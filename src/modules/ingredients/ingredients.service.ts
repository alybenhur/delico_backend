// src/modules/ingredients/ingredients.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ingredient } from './schemas/ingredient.schema';
import { Product } from '../products/schemas/product.schema';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  CustomizationDto,
  PriceCalculationResponseDto,
} from './dto/ingredient.dto';
import { IngredientStatus, ProductType } from '../../common/enums/common.enums';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<Ingredient>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    // Verificar que el producto existe y es customizable
    const product = await this.productModel.findById(
      createIngredientDto.product,
    );

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.type !== ProductType.CUSTOMIZABLE) {
      throw new BadRequestException(
        'Solo se pueden agregar ingredientes a productos customizables',
      );
    }

    const ingredient = new this.ingredientModel({
      ...createIngredientDto,
      product: new Types.ObjectId(createIngredientDto.product),
      business: new Types.ObjectId(createIngredientDto.business),
    });

    return ingredient.save();
  }

  async findByProduct(productId: string): Promise<Ingredient[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    return this.ingredientModel
      .find({
        product: new Types.ObjectId(productId),
      })
      .sort({ order: 1, name: 1 })
      .exec();
  }

  async findByProductAndType(
    productId: string,
    type: 'base' | 'optional',
  ): Promise<Ingredient[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const filter: any = {
      product: new Types.ObjectId(productId),
      status: IngredientStatus.AVAILABLE,
    };

    if (type === 'base') {
      filter.isBase = true;
    } else {
      filter.isOptional = true;
    }

    return this.ingredientModel.find(filter).sort({ order: 1, name: 1 }).exec();
  }

  async findByBusiness(businessId: string): Promise<Ingredient[]> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    return this.ingredientModel
      .find({ business: new Types.ObjectId(businessId) })
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Ingredient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ingrediente inválido');
    }

    const ingredient = await this.ingredientModel
      .findById(id)
      .populate('product', 'name basePrice')
      .populate('business', 'name');

    if (!ingredient) {
      throw new NotFoundException('Ingrediente no encontrado');
    }

    return ingredient;
  }

  async update(
    id: string,
    updateIngredientDto: UpdateIngredientDto,
    userId: string,
    userRole: string,
  ): Promise<Ingredient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ingrediente inválido');
    }

    const ingredient = await this.ingredientModel
      .findById(id)
      .populate({
        path: 'product',
        populate: { path: 'business' },
      });

    if (!ingredient) {
      throw new NotFoundException('Ingrediente no encontrado');
    }

    // Verificar permisos
    const product = ingredient.product as any;
    const business = product.business;

    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este ingrediente',
      );
    }

    const updated = await this.ingredientModel.findByIdAndUpdate(
      id,
      { $set: updateIngredientDto },
      { new: true },
    );

    return updated!;
  }

  async updateStatus(id: string, status: IngredientStatus): Promise<Ingredient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ingrediente inválido');
    }

    const ingredient = await this.ingredientModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );

    if (!ingredient) {
      throw new NotFoundException('Ingrediente no encontrado');
    }

    return ingredient;
  }

  async toggleStatus(id: string): Promise<Ingredient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ingrediente inválido');
    }

    const ingredient = await this.ingredientModel.findById(id);

    if (!ingredient) {
      throw new NotFoundException('Ingrediente no encontrado');
    }

    ingredient.status =
      ingredient.status === IngredientStatus.AVAILABLE
        ? IngredientStatus.UNAVAILABLE
        : IngredientStatus.AVAILABLE;

    return ingredient.save();
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ingrediente inválido');
    }

    const ingredient = await this.ingredientModel.findById(id).populate({
      path: 'product',
      populate: { path: 'business' },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingrediente no encontrado');
    }

    // Verificar permisos
    const product = ingredient.product as any;
    const business = product.business;

    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este ingrediente',
      );
    }

    await this.ingredientModel.findByIdAndDelete(id);
  }

  async calculateCustomizedPrice(
    customizationDto: CustomizationDto,
  ): Promise<PriceCalculationResponseDto> {
    const { productId, removeIngredients = [], addIngredients = [] } =
      customizationDto;

    // Obtener producto
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.type !== ProductType.CUSTOMIZABLE) {
      throw new BadRequestException('Este producto no es customizable');
    }

    const warnings: string[] = [];
    let additionalCost = 0;
    const ingredientsAddedDetails: any[] = [];
    const ingredientsRemovedNames: string[] = [];

    // Validar y calcular ingredientes agregados
    if (addIngredients.length > 0) {
      const ingredientIds = addIngredients.map((i) => i.ingredientId);
      const ingredients = await this.ingredientModel.find({
        _id: { $in: ingredientIds },
        product: new Types.ObjectId(productId),
      });

      for (const addItem of addIngredients) {
        const ingredient = ingredients.find(
          (i) => i.id === addItem.ingredientId,
        );

        if (!ingredient) {
          warnings.push(
            `Ingrediente ${addItem.ingredientId} no encontrado o no pertenece a este producto`,
          );
          continue;
        }

        if (!ingredient.isOptional) {
          warnings.push(`${ingredient.name} no es un ingrediente opcional`);
          continue;
        }

        if (ingredient.status !== IngredientStatus.AVAILABLE) {
          warnings.push(`${ingredient.name} no está disponible actualmente`);
          continue;
        }

        // Validar cantidad máxima
        if (
          ingredient.maxQuantity &&
          ingredient.maxQuantity > 0 &&
          addItem.quantity > ingredient.maxQuantity
        ) {
          warnings.push(
            `${ingredient.name} excede la cantidad máxima (${ingredient.maxQuantity})`,
          );
          continue;
        }

        const totalPrice = ingredient.additionalPrice * addItem.quantity;
        additionalCost += totalPrice;

        ingredientsAddedDetails.push({
          name: ingredient.name,
          quantity: addItem.quantity,
          pricePerUnit: ingredient.additionalPrice,
          totalPrice,
        });
      }
    }

    // Validar ingredientes removidos
    if (removeIngredients.length > 0) {
      const ingredients = await this.ingredientModel.find({
        _id: { $in: removeIngredients },
        product: new Types.ObjectId(productId),
      });

      for (const removeId of removeIngredients) {
        const ingredient = ingredients.find((i) => i.id === removeId);

        if (!ingredient) {
          warnings.push(
            `Ingrediente ${removeId} no encontrado o no pertenece a este producto`,
          );
          continue;
        }

        if (!ingredient.isRemovable) {
          warnings.push(`${ingredient.name} no se puede remover`);
          continue;
        }

        ingredientsRemovedNames.push(ingredient.name);
      }
    }

    const finalPrice = product.basePrice + additionalCost;

    return {
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      ingredientsAdded: ingredientsAddedDetails,
      ingredientsRemoved: ingredientsRemovedNames,
      additionalCost,
      finalPrice,
      isValid: warnings.length === 0,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async bulkUpdateStatus(
    productId: string,
    status: IngredientStatus,
  ): Promise<{ modifiedCount: number }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const result = await this.ingredientModel.updateMany(
      { product: new Types.ObjectId(productId) },
      { $set: { status } },
    );

    return { modifiedCount: result.modifiedCount };
  }
}