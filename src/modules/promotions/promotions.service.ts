// src/modules/promotions/promotions.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Promotion } from './schemas/promotion.schema';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  ApplyPromotionDto,
  DiscountResultDto,
} from './dto/promotion.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import {
  PromotionStatus,
  PromotionType,
} from '../../common/enums/common.enums';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    // Validar fechas
    if (createPromotionDto.startDate >= createPromotionDto.endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Validar valor según tipo
    if (createPromotionDto.type === PromotionType.PERCENTAGE) {
      if (createPromotionDto.value > 100) {
        throw new BadRequestException(
          'El porcentaje de descuento no puede ser mayor a 100',
        );
      }
    }

    // Determinar estado inicial
    const now = new Date();
    let status = PromotionStatus.SCHEDULED;

    if (
      createPromotionDto.startDate <= now &&
      createPromotionDto.endDate >= now
    ) {
      status = PromotionStatus.ACTIVE;
    } else if (createPromotionDto.endDate < now) {
      status = PromotionStatus.EXPIRED;
    }

    const promotion = new this.promotionModel({
      ...createPromotionDto,
      business: new Types.ObjectId(createPromotionDto.business),
      products: createPromotionDto.products.map((id) => new Types.ObjectId(id)),
      status,
      usageCount: 0,
    });

    return promotion.save();
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      business?: string;
      status?: PromotionStatus;
      active?: boolean;
    },
  ): Promise<PaginatedResponse<Promotion>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters?.business) {
      query.business = new Types.ObjectId(filters.business);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.active) {
      const now = new Date();
      query.status = PromotionStatus.ACTIVE;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const [data, total] = await Promise.all([
      this.promotionModel
        .find(query)
        .populate('business', 'name logo')
        .populate('products', 'name image basePrice')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.promotionModel.countDocuments(query),
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

  async findOne(id: string): Promise<Promotion> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de promoción inválido');
    }

    const promotion = await this.promotionModel
      .findById(id)
      .populate('business', 'name logo')
      .populate('products', 'name image basePrice');

    if (!promotion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    return promotion;
  }

  async findByProduct(productId: string): Promise<Promotion[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const now = new Date();

    return this.promotionModel
      .find({
        products: new Types.ObjectId(productId),
        status: PromotionStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ value: -1 })
      .exec();
  }

  async findByCode(code: string): Promise<Promotion | null> {
    const now = new Date();

    return this.promotionModel.findOne({
      code: code.toUpperCase(),
      status: PromotionStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
    userId: string,
    userRole: string,
  ): Promise<Promotion> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de promoción inválido');
    }

    const promotion = await this.promotionModel
      .findById(id)
      .populate('business');

    if (!promotion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    // Verificar permisos
    const business = promotion.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar esta promoción',
      );
    }

    // Validar fechas si se actualizan
    if (updatePromotionDto.startDate && updatePromotionDto.endDate) {
      if (updatePromotionDto.startDate >= updatePromotionDto.endDate) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }
    }

    const updated = await this.promotionModel.findByIdAndUpdate(
      id,
      { $set: updatePromotionDto },
      { new: true },
    );

    return updated!;
  }

  async updateStatus(id: string, status: PromotionStatus): Promise<Promotion> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de promoción inválido');
    }

    const promotion = await this.promotionModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );

    if (!promotion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    return promotion;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de promoción inválido');
    }

    const promotion = await this.promotionModel
      .findById(id)
      .populate('business');

    if (!promotion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    // Verificar permisos
    const business = promotion.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta promoción',
      );
    }

    await this.promotionModel.findByIdAndDelete(id);
  }

  async applyPromotion(
    applyPromotionDto: ApplyPromotionDto,
  ): Promise<DiscountResultDto> {
    const { productId, code, productPrice } = applyPromotionDto;

    let promotion: Promotion | null = null;

    // Buscar promoción por código si se proporciona
    if (code) {
      promotion = await this.findByCode(code);

      if (!promotion) {
        return {
          originalPrice: productPrice,
          discountAmount: 0,
          finalPrice: productPrice,
          promotionApplied: false,
          message: 'Código de promoción inválido o expirado',
        };
      }

      // Verificar si el producto está en la promoción
      const productInPromotion = promotion.products.some(
        (p) => p.toString() === productId,
      );

      if (!productInPromotion) {
        return {
          originalPrice: productPrice,
          discountAmount: 0,
          finalPrice: productPrice,
          promotionApplied: false,
          message: 'Este producto no está incluido en la promoción',
        };
      }
    } else {
      // Buscar mejor promoción para el producto
      const promotions = await this.findByProduct(productId);

      if (promotions.length === 0) {
        return {
          originalPrice: productPrice,
          discountAmount: 0,
          finalPrice: productPrice,
          promotionApplied: false,
        };
      }

      promotion = promotions[0]; // La primera es la mejor (mayor descuento)
    }

    // Validar condiciones de la promoción
    const validationResult = this.validatePromotion(promotion, productPrice);

    if (!validationResult.isValid) {
      return {
        originalPrice: productPrice,
        discountAmount: 0,
        finalPrice: productPrice,
        promotionApplied: false,
        message: validationResult.message,
      };
    }

    // Calcular descuento
    const discountAmount = this.calculateDiscount(
      promotion,
      productPrice,
    );

    const finalPrice = Math.max(0, productPrice - discountAmount);

    return {
      originalPrice: productPrice,
      discountAmount,
      finalPrice,
      promotionApplied: true,
      promotionName: promotion.name,
      promotionId: promotion.id,
    };
  }

  private validatePromotion(
    promotion: Promotion,
    productPrice: number,
  ): { isValid: boolean; message?: string } {
    const now = new Date();

    // Validar límite de usos
    if (
      promotion.usageLimit &&
      promotion.usageLimit > 0 &&
      (promotion.usageCount || 0) >= promotion.usageLimit
    ) {
      return {
        isValid: false,
        message: 'Esta promoción ha alcanzado su límite de usos',
      };
    }

    // Validar compra mínima
    if (promotion.minPurchase && productPrice < promotion.minPurchase) {
      return {
        isValid: false,
        message: `Compra mínima de $${promotion.minPurchase} requerida`,
      };
    }

    // Validar día de la semana
    if (promotion.daysOfWeek && promotion.daysOfWeek.length > 0) {
      const days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const currentDay = days[now.getDay()];

      if (!promotion.daysOfWeek.includes(currentDay)) {
        return {
          isValid: false,
          message: 'Esta promoción no está disponible hoy',
        };
      }
    }

    // Validar horario
    if (promotion.startTime && promotion.endTime) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime < promotion.startTime || currentTime > promotion.endTime) {
        return {
          isValid: false,
          message: `Esta promoción solo está disponible de ${promotion.startTime} a ${promotion.endTime}`,
        };
      }
    }

    return { isValid: true };
  }

  private calculateDiscount(
    promotion: Promotion,
    productPrice: number,
  ): number {
    let discount = 0;

    if (promotion.type === PromotionType.PERCENTAGE) {
      discount = (productPrice * promotion.value) / 100;

      // Aplicar descuento máximo si existe
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount;
      }
    } else {
      // PromotionType.FIXED_AMOUNT
      discount = promotion.value;
    }

    return Math.min(discount, productPrice); // No puede ser mayor al precio
  }

  async incrementUsageCount(promotionId: string): Promise<void> {
    await this.promotionModel.findByIdAndUpdate(promotionId, {
      $inc: { usageCount: 1 },
    });
  }

  async updateExpiredPromotions(): Promise<{ modifiedCount: number }> {
    const now = new Date();

    const result = await this.promotionModel.updateMany(
      {
        status: { $in: [PromotionStatus.ACTIVE, PromotionStatus.SCHEDULED] },
        endDate: { $lt: now },
      },
      { $set: { status: PromotionStatus.EXPIRED } },
    );

    return { modifiedCount: result.modifiedCount };
  }

  async activateScheduledPromotions(): Promise<{ modifiedCount: number }> {
    const now = new Date();

    const result = await this.promotionModel.updateMany(
      {
        status: PromotionStatus.SCHEDULED,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      { $set: { status: PromotionStatus.ACTIVE } },
    );

    return { modifiedCount: result.modifiedCount };
  }
}