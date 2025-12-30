// src/modules/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { Product } from '../products/schemas/product.schema';
import { Business } from '../businesses/schemas/business.schema';
import { Ingredient } from '../ingredients/schemas/ingredient.schema';
import { Promotion } from '../promotions/schemas/promotion.schema';
import { User } from '../users/schemas/user.schema';
import {
  CreateOrderDto,
  CalculateOrderDto,
  OrderCalculationResponseDto,
  UpdateOrderStatusDto,
  AssignDeliveryDto,
  CancelOrderDto,
  RateOrderDto,
} from './dto/order.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  IngredientStatus,
} from '../../common/enums/common.enums';
import {
  calculateDistance,
  validateDeliveryLocation,
} from '../../common/utils/geolocation.util';


@Injectable()
export class OrdersService {
  private readonly MAX_DELIVERY_DISTANCE = 5;
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<Ingredient>,
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,
     @InjectModel(User.name) private readonly userModel: Model<User>,
    
  ) {}

  async create(createOrderDto: CreateOrderDto, clientId: string): Promise<Order> {
    // 1. Validar negocio
    const business = await this.businessModel.findById(createOrderDto.business);
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

      const productIds = createOrderDto.items.map(item => item.productId);
      const products = await this.productModel.find({ 
        _id: { $in: productIds } 
      });

      // Validar que todos los productos existen
      if (products.length !== productIds.length) {
        throw new BadRequestException('Algunos productos no fueron encontrados');
      }

      // Validar que todos pertenecen al mismo negocio
      const businessesFound = new Set(
        products.map(p => p.business.toString())
      );

      if (businessesFound.size > 1) {
        throw new BadRequestException(
          'No se pueden mezclar productos de diferentes negocios en una misma orden. ' +
          'Por favor, crea órdenes separadas para cada negocio.'
        );
      }

      // Validar que el negocio especificado coincide con los productos
      if (!businessesFound.has(createOrderDto.business)) {
        throw new BadRequestException(
          'Los productos no pertenecen al negocio especificado'
        );
      }


    // 2. Calcular totales y validar items
    const calculation = await this.calculateOrder({
      business: createOrderDto.business,
      items: createOrderDto.items,
      promotionCode: createOrderDto.promotionCode,
    });

    if (!calculation.isValid) {
      throw new BadRequestException(
        `Orden inválida: ${calculation.warnings?.join(', ')}`,
      );
    }

    // 3. Generar número de orden único
    const orderNumber = await this.generateOrderNumber();

    // 4. Calcular tiempo estimado
    const estimatedTime = business.estimatedDeliveryTime || 30;
    const estimatedDate = new Date();
    estimatedDate.setMinutes(estimatedDate.getMinutes() + estimatedTime);

    // 5. Crear orden
    const order = new this.orderModel({
      orderNumber,
      client: new Types.ObjectId(clientId),
      business: new Types.ObjectId(createOrderDto.business),
      items: calculation.items,
      subtotal: calculation.subtotal,
      deliveryFee: calculation.deliveryFee,
      discount: calculation.discount,
      promotionApplied: calculation.promotionApplied?.id
        ? new Types.ObjectId(calculation.promotionApplied.id)
        : undefined,
      total: calculation.total,
      deliveryAddress: createOrderDto.deliveryAddress,
      businessLocation: {
        lat: business.address.coordinates?.lat || 0,
        lng: business.address.coordinates?.lng || 0,
      },
      status: OrderStatus.PENDING,
      statusHistory: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          note: 'Pedido creado',
        },
      ],
      estimatedDeliveryTime: estimatedTime,
      estimatedDeliveryDate: estimatedDate,
      paymentMethod: createOrderDto.paymentMethod,
      paymentStatus:
        createOrderDto.paymentMethod === PaymentMethod.CASH
          ? PaymentStatus.PENDING
          : PaymentStatus.PENDING,
      notes: createOrderDto.notes,
    });

    const savedOrder = await order.save();

    // 6. Incrementar uso de promoción si aplica
    if (calculation.promotionApplied?.id) {
      await this.promotionModel.findByIdAndUpdate(
        calculation.promotionApplied.id,
        { $inc: { usageCount: 1 } },
      );
    }

    return savedOrder;
  }

  async calculateOrder(
    calculateOrderDto: CalculateOrderDto,
  ): Promise<OrderCalculationResponseDto> {
    const warnings: string[] = [];
    let subtotal = 0;
    const processedItems: any[] = [];

    // 1. Obtener negocio
    const business = await this.businessModel.findById(
      calculateOrderDto.business,
    );
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // 2. Procesar cada item
    for (const item of calculateOrderDto.items) {
      const product = await this.productModel.findById(item.productId);

      if (!product) {
        warnings.push(`Producto ${item.productId} no encontrado`);
        continue;
      }

      if (product.status !== ProductStatus.AVAILABLE) {
        warnings.push(`${product.name} no está disponible`);
        continue;
      }

      // Calcular precio base
      let itemSubtotal = product.basePrice * item.quantity;
      let customizationCost = 0;

      // Procesar customización si existe
      const customization: any = {
        removedIngredients: [],
        addedIngredients: [],
      };

      if (item.customization) {
        // Validar ingredientes removidos
        if (item.customization.removeIngredients) {
          for (const ingredientId of item.customization.removeIngredients) {
            const ingredient = await this.ingredientModel.findById(ingredientId);
            if (ingredient && ingredient.isRemovable) {
              customization.removedIngredients.push({
                ingredient: ingredient._id,
                name: ingredient.name,
              });
            }
          }
        }

        // Validar y calcular ingredientes agregados
        if (item.customization.addIngredients) {
          for (const addItem of item.customization.addIngredients) {
            const ingredient = await this.ingredientModel.findById(
              addItem.ingredientId,
            );

            if (!ingredient) {
              warnings.push(
                `Ingrediente ${addItem.ingredientId} no encontrado`,
              );
              continue;
            }

            if (!ingredient.isOptional) {
              warnings.push(`${ingredient.name} no es opcional`);
              continue;
            }

            if (ingredient.status !== IngredientStatus.AVAILABLE) {
              warnings.push(`${ingredient.name} no está disponible`);
              continue;
            }

            // Validar cantidad máxima
            if (
              ingredient.maxQuantity &&
              ingredient.maxQuantity > 0 &&
              addItem.quantity > ingredient.maxQuantity
            ) {
              warnings.push(
                `${ingredient.name} excede cantidad máxima (${ingredient.maxQuantity})`,
              );
              continue;
            }

            const ingredientTotal =
              ingredient.additionalPrice * addItem.quantity;
            customizationCost += ingredientTotal;

            customization.addedIngredients.push({
              ingredient: ingredient._id,
              name: ingredient.name,
              quantity: addItem.quantity,
              pricePerUnit: ingredient.additionalPrice,
              totalPrice: ingredientTotal,
            });
          }
        }
      }

      const itemTotal = itemSubtotal + customizationCost;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        productPrice: product.basePrice,
        quantity: item.quantity,
        customization:
          Object.keys(customization.removedIngredients).length > 0 ||
          Object.keys(customization.addedIngredients).length > 0
            ? customization
            : undefined,
        subtotal: itemSubtotal,
        customizationCost,
        itemTotal,
        notes: item.notes,
      });
    }

    // 3. Calcular delivery fee
    const deliveryFee = business.deliveryFee || 0;

    // 4. Aplicar promoción si existe
    let discount = 0;
    let promotionApplied: any = undefined;

    if (calculateOrderDto.promotionCode) {
      const promotion = await this.promotionModel.findOne({
        code: calculateOrderDto.promotionCode.toUpperCase(),
        business: new Types.ObjectId(calculateOrderDto.business),
        status: 'ACTIVE',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (promotion) {
        // Validar compra mínima
        if (promotion.minPurchase && subtotal < promotion.minPurchase) {
          warnings.push(
            `Compra mínima de $${promotion.minPurchase} requerida para esta promoción`,
          );
        } else {
          // Calcular descuento
          if (promotion.type === 'PERCENTAGE') {
            discount = (subtotal * promotion.value) / 100;
            if (promotion.maxDiscount && discount > promotion.maxDiscount) {
              discount = promotion.maxDiscount;
            }
          } else {
            discount = promotion.value;
          }

          discount = Math.min(discount, subtotal);

          promotionApplied = {
            id: promotion.id,
            name: promotion.name,
            discount,
          };
        }
      } else {
        warnings.push('Código de promoción inválido o expirado');
      }
    }

    // 5. Calcular total
    const total = subtotal + deliveryFee - discount;

    return {
      business: calculateOrderDto.business,
      items: processedItems,
      subtotal,
      deliveryFee,
      discount,
      promotionApplied,
      total,
      isValid: warnings.length === 0,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      client?: string;
      business?: string;
      delivery?: string;
      status?: OrderStatus;
    },
  ): Promise<PaginatedResponse<Order>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters?.client) {
      query.client = new Types.ObjectId(filters.client);
    }

    if (filters?.business) {
      query.business = new Types.ObjectId(filters.business);
    }

    if (filters?.delivery) {
      query.delivery = new Types.ObjectId(filters.delivery);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('client', 'firstName lastName email phone')
        .populate('business', 'name logo phone address')
        .populate('delivery', 'firstName lastName phone')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de orden inválido');
    }

    const order = await this.orderModel
      .findById(id)
      .populate('client', 'firstName lastName email phone')
      .populate('business', 'name logo phone address')
      .populate('delivery', 'firstName lastName phone')
      .populate('promotionApplied', 'name type value');

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.orderModel.countDocuments();
    const orderNum = (count + 1).toString().padStart(6, '0');
    return `ORD-${year}-${orderNum}`;
  }

  // src/modules/orders/orders.service.ts (PARTE 2)
// Agregar estos métodos al final de la clase OrdersService

 async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).populate('business');

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Validar permisos
    const business = order.business as any;
    const canUpdate =
      userRole === 'ADMIN' ||
      (userRole === 'BUSINESS' &&
        business.owner.toString() === userId.toString()) ||
      (userRole === 'DELIVERY' &&
        order.delivery?.toString() === userId.toString());

    if (!canUpdate) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar esta orden',
      );
    }

    // ✅ NUEVA VALIDACIÓN: Si se marca como DELIVERED, validar ubicación
    if (updateStatusDto.status === OrderStatus.DELIVERED) {
      console.log('🔍 Validando ubicación para marcar como entregado...');

      // 1. Validar que se envió la ubicación del delivery
      if (
        !updateStatusDto.deliveryLatitude ||
        !updateStatusDto.deliveryLongitude
      ) {
        throw new BadRequestException(
          'Se requiere la ubicación del delivery para marcar como entregado',
        );
      }

      console.log(
        `📍 Ubicación del delivery: ${updateStatusDto.deliveryLatitude}, ${updateStatusDto.deliveryLongitude}`,
      );

      // 2. Validar que la orden tenga coordenadas de entrega
      if (
        !order.deliveryAddress?.coordinates?.lat ||
        !order.deliveryAddress?.coordinates?.lng
      ) {
        throw new BadRequestException(
          'La orden no tiene coordenadas de entrega configuradas. ' +
            'No es posible validar la ubicación.',
        );
      }

      console.log(
        `🎯 Ubicación de destino: ${order.deliveryAddress.coordinates.lat}, ${order.deliveryAddress.coordinates.lng}`,
      );

      // 3. Validar proximidad (máximo 5 metros)
      const { isValid, distance } = validateDeliveryLocation(
        updateStatusDto.deliveryLatitude,
        updateStatusDto.deliveryLongitude,
        order.deliveryAddress.coordinates.lat,
        order.deliveryAddress.coordinates.lng,
        this.MAX_DELIVERY_DISTANCE,
      );

      console.log(`📏 Distancia calculada: ${distance}m`);
      console.log(`✅ Dentro del rango (${this.MAX_DELIVERY_DISTANCE}m): ${isValid}`);

      if (!isValid) {
        throw new BadRequestException(
          `Debes estar cerca de la dirección de entrega para marcar como entregado. ` +
            `Distancia actual: ${distance}m (máximo permitido: ${this.MAX_DELIVERY_DISTANCE}m). ` +
            `Por favor, acércate más a la dirección de entrega.`,
        );
      }

      // 4. ✅ Guardar ubicación de entrega para auditoría
      order.deliveredLocation = {
        lat: updateStatusDto.deliveryLatitude,
        lng: updateStatusDto.deliveryLongitude,
        timestamp: new Date(),
        distanceFromTarget: distance,
      };

      console.log('✅ Ubicación de entrega guardada para auditoría');

      // 5. Establecer fecha de entrega
      order.deliveredAt = new Date();
    }

    // Validar transiciones de estado
    this.validateStatusTransition(order.status, updateStatusDto.status);

    // Actualizar estado
    order.status = updateStatusDto.status;

    // Agregar al historial
    order.statusHistory.push({
      status: updateStatusDto.status,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId),
      note: updateStatusDto.note || '',
    } as any);

    // Actualizar timestamps según el estado
    switch (updateStatusDto.status) {
      case OrderStatus.CONFIRMED:
        order.confirmedAt = new Date();
        break;
      case OrderStatus.PREPARING:
        order.preparingAt = new Date();
        break;
      case OrderStatus.READY:
        order.readyAt = new Date();
        break;
      case OrderStatus.PICKUP:
        order.pickedUpAt = new Date();
        break;
      // DELIVERED ya se maneja arriba
    }

    await order.save();

    console.log(`✅ Orden ${order.orderNumber} actualizada a estado ${updateStatusDto.status}`);

    return order;
  }

  
 private validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): void {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [
      OrderStatus.ON_DELIVERY,  // ✅ AGREGADO
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.ON_DELIVERY]: [  // ✅ AGREGADO
      OrderStatus.PICKUP,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PICKUP]: [OrderStatus.IN_TRANSIT],
    [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new BadRequestException(
      `No se puede cambiar de ${currentStatus} a ${newStatus}`,
    );
  }
}

  async assignDelivery(
    id: string,
    assignDeliveryDto: AssignDeliveryDto,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).populate('business');

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Validar permisos (solo negocio o admin)
    const business = order.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('No tienes permisos para asignar repartidor');
    }

    // Validar que la orden esté en estado READY
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException(
        'Solo se puede asignar repartidor cuando el pedido esté listo',
      );
    }

    order.delivery = new Types.ObjectId(assignDeliveryDto.deliveryId);
    return order.save();
  }

  async cancelOrder(
    id: string,
    cancelOrderDto: CancelOrderDto,
    userId: string,
    userRole: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).populate('business');

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // No se puede cancelar si ya está en camino o entregada
    if (
      [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status)
    ) {
      throw new BadRequestException(
        'No se puede cancelar una orden en tránsito o entregada',
      );
    }

    // Validar permisos
    const business = order.business as any;
    const canCancel =
      userRole === 'ADMIN' ||
      (userRole === 'CLIENT' && order.client.toString() === userId.toString()) ||
      (userRole === 'BUSINESS' &&
        business.owner.toString() === userId.toString());

    if (!canCancel) {
      throw new ForbiddenException('No tienes permisos para cancelar esta orden');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledReason = `${cancelOrderDto.reason}: ${cancelOrderDto.details || ''}`;

    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId),
      note: order.cancelledReason,
    } as any);

    // Si había promoción aplicada, decrementar uso
    if (order.promotionApplied) {
      await this.promotionModel.findByIdAndUpdate(order.promotionApplied, {
        $inc: { usageCount: -1 },
      });
    }

    return order.save();
  }

  async rateOrder(
    id: string,
    rateOrderDto: RateOrderDto,
    userId: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Validar que sea el cliente
    if (order.client.toString() !== userId.toString()) {
      throw new ForbiddenException('Solo el cliente puede calificar');
    }

    // Validar que esté entregada
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Solo se pueden calificar órdenes entregadas',
      );
    }

    // Validar que no esté ya calificada
    if (order.rating?.ratedAt) {
      throw new BadRequestException('Esta orden ya fue calificada');
    }

    order.rating = {
      food: rateOrderDto.food,
      delivery: rateOrderDto.delivery,
      comment: rateOrderDto.comment,
      ratedAt: new Date(),
    };

    return order.save();
  }

  async getBusinessOrders(
    businessId: string,
    paginationDto: PaginationDto,
    status?: OrderStatus,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll(paginationDto, { business: businessId, status });
  }

  async getClientOrders(
    clientId: string,
    paginationDto: PaginationDto,
    status?: OrderStatus,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll(paginationDto, { client: clientId, status });
  }

  async getDeliveryOrders(
    deliveryId: string,
    paginationDto: PaginationDto,
    status?: OrderStatus,
  ): Promise<PaginatedResponse<Order>> {
    return this.findAll(paginationDto, { delivery: deliveryId, status });
  }

  async getAvailableOrdersForDelivery(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Order>> {
    // Órdenes listas pero sin repartidor asignado
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = {
      status: OrderStatus.READY,
      delivery: { $exists: false },
    };

    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('business', 'name logo address')
        .skip(skip)
        .limit(limit)
        .sort({ readyAt: 1 })
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Agregar este método a orders.service.ts

/**
 * Asignar delivery automáticamente (llamado desde la app del delivery)
 * El delivery se auto-asigna a la orden
 */
async assignDeliveryToOrder(
  orderId: string,
  deliveryUserId: string,
): Promise<Order> {
  // Validar que el usuario sea un delivery válido
  const deliveryUser = await this.userModel.findById(deliveryUserId);
  
  if (!deliveryUser) {
    throw new NotFoundException('Delivery no encontrado');
  }
  
  if (deliveryUser.role !== 'DELIVERY') {
    throw new ForbiddenException('Solo los deliveries pueden aceptar órdenes');
  }
  
  // Verificar que el delivery puede tomar órdenes
  if (!deliveryUser.deliveryInfo?.isOnline) {
    throw new BadRequestException('Debes estar en línea para aceptar órdenes');
  }
  
  if (!deliveryUser.deliveryInfo?.isAvailable) {
    throw new BadRequestException('Debes estar disponible para aceptar órdenes');
  }
  
  const status = deliveryUser.deliveryInfo?.status;
  if (status !== 'ACTIVE' && status !== 'IDLE') {
    throw new BadRequestException('No puedes aceptar órdenes en tu estado actual');
  }
  
  // Buscar la orden
  const order = await this.orderModel.findById(orderId);
  
  if (!order) {
    throw new NotFoundException('Orden no encontrada');
  }
  
  // Verificar que la orden esté en estado READY
  if (order.status !== OrderStatus.READY) {
    throw new BadRequestException(
      `La orden debe estar en estado READY. Estado actual: ${order.status}`,
    );
  }
  
  // Verificar que no tenga delivery asignado
  if (order.delivery) {  // ✅ CORREGIDO: "delivery" no "deliveryUser"
    throw new BadRequestException('La orden ya tiene un delivery asignado');
  }
  
  // Asignar el delivery a la orden
  order.delivery = new Types.ObjectId(deliveryUserId);  // ✅ CORREGIDO
  order.status = OrderStatus.ON_DELIVERY;
  
  // Agregar al historial de estados
  order.statusHistory.push({
    status: OrderStatus.ON_DELIVERY,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(deliveryUserId),
    note: 'Delivery asignado y en camino a recoger',
  });
  
  // Establecer tiempo de recogida
  order.pickedUpAt = new Date();
  
  // Guardar la orden
  await order.save();
  
  // Actualizar las estadísticas del delivery
  await this.userModel.findByIdAndUpdate(deliveryUserId, {
    $inc: {
      'deliveryInfo.currentActiveOrders': 1,
    },
  });
  
  // Retornar la orden con populate
   const populatedOrder = await this.orderModel
    .findById(orderId)
    .populate('client', 'firstName lastName email phone')
    .populate('business', 'name address logo phone')
    .populate('delivery', 'firstName lastName phone')
    .exec();
  
  if (!populatedOrder) {
    throw new NotFoundException('Error al recuperar la orden actualizada');
  }
  
  return populatedOrder; 
}
  // ==================== MÉTODOS MARKETPLACE ====================

// ==================== MÉTODOS MARKETPLACE ====================
/*
async calculateMarketplaceOrder(
  dto: CalculateMarketplaceOrderDto,
): Promise<MarketplaceCalculationResponseDto> {
  console.log("hola mundo")
  const warnings: string[] = [];
  const ordersByBusiness: any[] = [];
  let totalItems = 0;
  let grandTotal = 0;

  // 1. Agrupar items por negocio
  const itemsByBusiness = new Map<string, typeof dto.items>();

  for (const item of dto.items) {
    const product = await this.productModel
      .findById(item.productId)
      .populate('business');

    if (!product) {
      warnings.push(`Producto ${item.productId} no encontrado`);
      continue;
    }

    const businessId = product.business._id.toString();

    if (!itemsByBusiness.has(businessId)) {
      itemsByBusiness.set(businessId, []);
    }
    
    // ✅ FIX: Verificar que existe antes de hacer push
    const businessItems = itemsByBusiness.get(businessId);
    if (businessItems) {
      businessItems.push(item);
    }
  }

  // 2. Calcular cada orden por negocio
  for (const [businessId, businessItems] of itemsByBusiness) {
    const calculation = await this.calculateOrder({
      business: businessId,
      items: businessItems,
      promotionCode: dto.promotionCodes?.[businessId],
    });

    if (!calculation.isValid) {
      warnings.push(...(calculation.warnings || []));
    }

    const business = await this.businessModel.findById(businessId);
    
    // ✅ FIX: Verificar que business existe
    if (!business) {
      warnings.push(`Negocio ${businessId} no encontrado`);
      continue;
    }

    ordersByBusiness.push({
      business: {
        _id: business._id,
        name: business.name,
        logo: business.logo,
      },
      items: calculation.items,
      subtotal: calculation.subtotal,
      deliveryFee: calculation.deliveryFee,
      discount: calculation.discount,
      promotionApplied: calculation.promotionApplied,
      total: calculation.total,
    });

    totalItems += businessItems.length;
    grandTotal += calculation.total;
  }

  return {
    ordersByBusiness,
    totalItems,
    grandTotal,
    isValid: warnings.length === 0,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}*/
/*
async createMarketplaceOrder(
  dto: CreateMarketplaceOrderDto,
  clientId: string,
): Promise<{ orderGroup: OrderGroup; orders: Order[] }> {
  // 1. Primero calcular para validar
  const calculation = await this.calculateMarketplaceOrder({
    items: dto.items,
    promotionCodes: dto.promotionCodes,
  });

  if (!calculation.isValid) {
    throw new BadRequestException(
      `Orden inválida: ${calculation.warnings?.join(', ')}`,
    );
  }

  // 2. Agrupar items por negocio
  const itemsByBusiness = new Map<string, typeof dto.items>();

  for (const item of dto.items) {
    const product = await this.productModel.findById(item.productId);
    
    // ✅ FIX: Verificar que producto existe
    if (!product) {
      throw new NotFoundException(`Producto ${item.productId} no encontrado`);
    }
    
    const businessId = product.business.toString();

    if (!itemsByBusiness.has(businessId)) {
      itemsByBusiness.set(businessId, []);
    }
    
    // ✅ FIX: Verificar que existe antes de hacer push
    const businessItems = itemsByBusiness.get(businessId);
    if (businessItems) {
      businessItems.push(item);
    }
  }

  // 3. Crear OrderGroup
  const groupNumber = await this.generateGroupNumber();
  const orderGroup = new this.orderGroupModel({
    groupNumber,
    client: new Types.ObjectId(clientId),
    paymentMethod: dto.paymentMethod,
    paymentStatus: PaymentStatus.PENDING,
    totalItems: dto.items.length,
    notes: dto.notes,
    orders: [],
  });

  // 4. Crear una orden por cada negocio
  const createdOrders: Order[] = [];
  let totalAmount = 0;

  for (const [businessId, businessItems] of itemsByBusiness) {
    const business = await this.businessModel.findById(businessId);
    
    // ✅ FIX: Verificar que business existe
    if (!business) {
      throw new NotFoundException(`Negocio ${businessId} no encontrado`);
    }

    const orderDto = {
      business: businessId,
      items: businessItems,
      deliveryAddress: dto.deliveryAddress,
      paymentMethod: dto.paymentMethod,
      promotionCode: dto.promotionCodes?.[businessId],
      notes: dto.notes,
    };

    const order = await this.create(orderDto, clientId);
    createdOrders.push(order);
    totalAmount += order.total;

    // Agregar resumen al grupo
    orderGroup.orders.push({
      orderId: order._id,
      business: order.business,
      businessName: business.name,
      itemCount: order.items.length,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      status: order.status,
    } as any);
  }

  // 5. Guardar OrderGroup
  orderGroup.totalAmount = totalAmount;
  await orderGroup.save();

  return { orderGroup, orders: createdOrders };
}*/
/*

async findOrderGroup(id: string): Promise<OrderGroup> {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('ID de grupo de orden inválido');
  }

  const orderGroup = await this.orderGroupModel
    .findById(id)
    .populate('client', 'firstName lastName email phone')
    .populate({
      path: 'orders.orderId',
      populate: [
        { path: 'business', select: 'name logo phone address' },
        { path: 'delivery', select: 'firstName lastName phone' },
      ],
    });

  if (!orderGroup) {
    throw new NotFoundException('Grupo de orden no encontrado');
  }

  return orderGroup;
}*/

/*
async getClientOrderGroups(
  clientId: string,
  paginationDto: PaginationDto,
): Promise<PaginatedResponse<OrderGroup>> {
  const { page = 1, limit = 10 } = paginationDto;
  const skip = (page - 1) * limit;

  // ✅ LOGS DE DEBUG
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SERVICE - getClientOrderGroups');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 ClientId recibido (tipo):', typeof clientId);
  console.log('📝 ClientId recibido (valor):', clientId);
  console.log('📝 ClientId esperado en DB:', '68ea644ce18e51cfb400c252');
  console.log('✅ ¿Son iguales?:', clientId === '68ea644ce18e51cfb400c252');
  
  const query = { client: new Types.ObjectId(clientId) };
  console.log('🔎 Query construida:', JSON.stringify(query));

  const [data, total] = await Promise.all([
    this.orderGroupModel
      .find(query)
      .populate('client', 'firstName lastName email phone')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec(),
    this.orderGroupModel.countDocuments(query),
  ]);

  console.log('📊 Resultados encontrados:', total);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}*/

/*
private async generateGroupNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.orderGroupModel.countDocuments();
  const groupNum = (count + 1).toString().padStart(6, '0');
  return `GRP-${year}-${groupNum}`;
}*/
  // Continuará en la parte 2...
}