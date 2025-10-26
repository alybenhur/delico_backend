// src/modules/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verificar si ya existe una categoría con ese nombre en el negocio
    const existing = await this.categoryModel.findOne({
      business: new Types.ObjectId(createCategoryDto.business),
      name: createCategoryDto.name,
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una categoría con ese nombre en este negocio',
      );
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      business: new Types.ObjectId(createCategoryDto.business),
    });

    return category.save();
  }

  async findByBusiness(businessId: string): Promise<Category[]> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    return this.categoryModel
      .find({
        business: new Types.ObjectId(businessId),
        isActive: true,
      })
      .sort({ order: 1, name: 1 })
      .exec();
  }

  async findAll(businessId: string, includeInactive = false): Promise<Category[]> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    const filter: any = { business: new Types.ObjectId(businessId) };

    if (!includeInactive) {
      filter.isActive = true;
    }

    return this.categoryModel.find(filter).sort({ order: 1, name: 1 }).exec();
  }

  async findOne(id: string): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
    userRole: string,
  ): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    const category = await this.categoryModel.findById(id).populate('business');

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Verificar permisos: solo el dueño del negocio o admin
    const business = category.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar esta categoría',
      );
    }

    // Si cambia el nombre, verificar que no exista otra con ese nombre
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryModel.findOne({
        business: category.business,
        name: updateCategoryDto.name,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          'Ya existe una categoría con ese nombre en este negocio',
        );
      }
    }

    const updated = await this.categoryModel.findByIdAndUpdate(
      id,
      { $set: updateCategoryDto },
      { new: true },
    );

    return updated!;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    const category = await this.categoryModel.findById(id).populate('business');

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Verificar permisos
    const business = category.business as any;
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta categoría',
      );
    }

    await this.categoryModel.findByIdAndDelete(id);
  }

  async toggleActive(id: string): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    category.isActive = !category.isActive;
    return category.save();
  }
}