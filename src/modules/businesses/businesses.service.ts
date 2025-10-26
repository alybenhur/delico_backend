// src/modules/businesses/businesses.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business } from './schemas/business.schema';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import { BusinessType, BusinessStatus } from '../../common/enums/common.enums';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
  ) {}

  async create(
    createBusinessDto: CreateBusinessDto,
    ownerId: string,
  ): Promise<Business> {
    const business = new this.businessModel({
      ...createBusinessDto,
      owner: new Types.ObjectId(ownerId),
      status: BusinessStatus.PENDING, // Por defecto en PENDING hasta que admin apruebe
    });

    return business.save();
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      type?: BusinessType;
      status?: BusinessStatus;
      city?: string;
      search?: string;
    },
  ): Promise<PaginatedResponse<Business>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Aplicar filtros
    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.status) {
      query.status = filters.status;
    } else {
      // Por defecto, solo mostrar negocios activos
      query.status = BusinessStatus.ACTIVE;
    }

    if (filters?.city) {
      query['address.city'] = new RegExp(filters.city, 'i');
    }

    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    const [data, total] = await Promise.all([
      this.businessModel
        .find(query)
        .populate('owner', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.businessModel.countDocuments(query),
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

  // MÉTODO EN EL SERVICE (businesses.service.ts)

async findAllBusinesses(
  paginationDto: PaginationDto,
): Promise<PaginatedResponse<Business>> {
  const { page = 1, limit = 10 } = paginationDto;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.businessModel
      .find({})
      .populate('owner', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec(),
    this.businessModel.countDocuments({}),
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

  async findOne(id: string): Promise<Business> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    const business = await this.businessModel
      .findById(id)
      .populate('owner', 'firstName lastName email phone');

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return business;
  }

  async findByOwner(
    ownerId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Business>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.businessModel
        .find({ owner: new Types.ObjectId(ownerId) })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.businessModel.countDocuments({ owner: new Types.ObjectId(ownerId) }),
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
    updateBusinessDto: UpdateBusinessDto,
    userId: string,
    userRole: string,
  ): Promise<Business> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    const business = await this.businessModel.findById(id);

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Verificar permisos: solo el dueño o un admin pueden actualizar
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este negocio',
      );
    }

    // Solo admin puede cambiar el estado
    if (updateBusinessDto.status && userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo un admin puede cambiar el estado');
    }

    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      id,
      { $set: updateBusinessDto },
      { new: true },
    );

    return updatedBusiness!;
  }

  async updateStatus(
    id: string,
    status: BusinessStatus,
  ): Promise<Business> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    const business = await this.businessModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return business;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de negocio inválido');
    }

    const business = await this.businessModel.findById(id);

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Verificar permisos: solo el dueño o un admin pueden eliminar
    if (
      userRole !== 'ADMIN' &&
      business.owner.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este negocio',
      );
    }

    await this.businessModel.findByIdAndDelete(id);
  }

  async getStatsByOwner(ownerId: string): Promise<any> {
    const stats = await this.businessModel.aggregate([
      { $match: { owner: new Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await this.businessModel.countDocuments({
      owner: new Types.ObjectId(ownerId),
    });

    return {
      total,
      byStatus: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    };
  }
}