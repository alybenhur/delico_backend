// src/modules/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import { ProductStatus, ProductType,IngredientStatus,  PromotionStatus, } from '../../common/enums/common.enums';
import { Ingredient } from '../ingredients/schemas/ingredient.schema';
import { Promotion } from '../promotions/schemas/promotion.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<Ingredient>,
    @InjectModel(Promotion.name) private readonly promotionModel: Model<Promotion>,

  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    console.log(createProductDto)
    const product = new this.productModel({
      ...createProductDto,
      business: new Types.ObjectId(createProductDto.business),
      category: new Types.ObjectId(createProductDto.category),
    });

    return product.save();
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      business?: string;
      category?: string;
      type?: ProductType;
      status?: ProductStatus;
      search?: string;
    },
  ): Promise<PaginatedResponse<Product>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters?.business) {
      query.business = new Types.ObjectId(filters.business);
    }

    if (filters?.category) {
      query.category = new Types.ObjectId(filters.category);
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.status) {
      query.status = filters.status;
    } else {
      // Por defecto, solo productos disponibles
      query.status = ProductStatus.AVAILABLE;
    }

    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('business', 'name logo')
        .populate('category', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ order: 1, createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(query),
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

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel
      .findById(id)
      .populate('business', 'name logo phone address')
      .populate('category', 'name');

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async findByBusiness(
    businessId: string,
    paginationDto: PaginationDto,
    includeInactive = false,
  ): Promise<PaginatedResponse<Product>> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: any = { business: new Types.ObjectId(businessId) };

    if (!includeInactive) {
      query.status = ProductStatus.AVAILABLE;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ order: 1, createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(query),
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

  async findByCategory(
    categoryId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Product>> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = {
      category: new Types.ObjectId(categoryId),
      status: ProductStatus.AVAILABLE,
    };

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('business', 'name logo')
        .skip(skip)
        .limit(limit)
        .sort({ order: 1, createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(query),
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    userRole: string,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).populate('business');

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar permisos
    const business = product.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este producto',
      );
    }

    const updated = await this.productModel.findByIdAndUpdate(
      id,
      { $set: updateProductDto },
      { new: true },
    );

    return updated!;
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!product.trackInventory) {
      throw new BadRequestException(
        'Este producto no tiene inventario habilitado',
      );
    }

    product.stock = (product.stock || 0) + quantity;

    // Si el stock llega a 0, cambiar estado
    if (product.stock <= 0) {
      product.stock = 0;
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (product.status === ProductStatus.OUT_OF_STOCK) {
      product.status = ProductStatus.AVAILABLE;
    }

    return product.save();
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).populate('business');

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar permisos
    const business = product.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este producto',
      );
    }

    await this.productModel.findByIdAndDelete(id);
  }

  async findByTags(
  tags: string[],
  paginationDto: PaginationDto,
): Promise<PaginatedResponse<any>> {
  const { page = 1, limit = 10 } = paginationDto;
  const skip = (page - 1) * limit;

  // Query para buscar productos por tags (OR)
  const query = {
    tags: { $in: tags },
    status: ProductStatus.AVAILABLE,
  };

  // Buscar productos
  const [products, total] = await Promise.all([
    this.productModel
      .find(query)
      .populate('business', 'name logo type address phone')
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ order: 1, createdAt: -1 })
      .lean()
      .exec(),
    this.productModel.countDocuments(query),
  ]);

  // Para cada producto, buscar ingredientes y promociones
  const productsWithDetails = await Promise.all(
    products.map(async (product) => {
      const productDetails: any = { ...product };

      // Si es customizable, buscar ingredientes
      if (product.type === ProductType.CUSTOMIZABLE) {
        const ingredients = await this.ingredientModel
          .find({
            product: product._id,
            status: IngredientStatus.AVAILABLE,
          })
          .select('-product -business -__v')
          .sort({ order: 1 })
          .lean()
          .exec();

        productDetails.ingredients = ingredients;
      }

      // Buscar promociones activas para este producto
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      const promotions = await this.promotionModel
        .find({
          products: product._id,
          status: PromotionStatus.ACTIVE,
          startDate: { $lte: now },
          endDate: { $gte: now },
          $or: [
            { usageLimit: 0 }, // Sin límite
            { $expr: { $lt: ['$usageCount', '$usageLimit'] } }, // Aún disponible
          ],
        })
        .select('-products -business -__v -usageCount -usageLimit')
        .lean()
        .exec();

      // Filtrar por día de la semana y hora si aplica
      const activePromotions = promotions.filter((promo: any) => {
        // Si tiene días específicos, validar
        if (promo.daysOfWeek && promo.daysOfWeek.length > 0) {
          if (!promo.daysOfWeek.includes(currentDay)) {
            return false;
          }
        }

        // Si tiene horario específico, validar
        if (promo.startTime && promo.endTime) {
          if (currentTime < promo.startTime || currentTime > promo.endTime) {
            return false;
          }
        }

        return true;
      });

      productDetails.promotions = activePromotions;

      return productDetails;
    }),
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: productsWithDetails,
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
}