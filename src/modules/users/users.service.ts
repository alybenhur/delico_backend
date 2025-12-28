// src/modules/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums/common.enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(
    paginationDto: PaginationDto,
    role?: UserRole,
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role) {
      filter.role = role;
    }

    const [data, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter),
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

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password +refreshToken');
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Si se está actualizando el password, hashearlo
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Si se está actualizando el email, verificar que no exista
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;

    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel
      .findById(userId)
      .select('+password');

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

 // ==================== AGREGAR ESTOS MÉTODOS AL FINAL DE users.service.ts ====================
// Justo antes del último }

  // ==================== HELPER PRIVADO ====================

  private initializeDeliveryInfo() {
    return {
      isAvailable: true, // ✅ Default según schema línea 13
      isOnline: false,   // ✅ Default según schema línea 50
      status: 'ACTIVE',  // ✅ Default según schema línea 87
      rating: 0,
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      currentActiveOrders: 0, // ✅ Agregado (línea 47)
      maxOrdersCapacity: 5,   // ✅ Default según schema línea 43
      totalEarnings: 0,
      averageDeliveryTime: 0, // ✅ Agregado (línea 59)
      completionRate: 0,      // ✅ Agregado (línea 62)
      missedOrders: 0,        // ✅ Agregado (línea 96)
      lateDeliveries: 0,      // ✅ Agregado (línea 99)
      // Campos opcionales se omiten (undefined por defecto)
      // currentLocation, vehicleTypes, vehiclePlate, bankInfo, etc.
    };
  }

  // ==================== MÉTODOS PARA DELIVERY ====================

  async updateDeliveryOnlineStatus(
    userId: string,
    isOnline: boolean,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role !== UserRole.DELIVERY) {
      throw new BadRequestException('El usuario no es un repartidor');
    }

    // Inicializar deliveryInfo si no existe
    if (!user.deliveryInfo) {
      user.deliveryInfo = this.initializeDeliveryInfo();
    }

    user.deliveryInfo.isOnline = isOnline;
    
    // Actualizar lastOnlineAt cuando se conecta
    if (isOnline) {
      user.deliveryInfo.lastOnlineAt = new Date();
      // Si se conecta, cambiar a ACTIVE si no está suspendido
      if (user.deliveryInfo.status === 'INACTIVE') {
        user.deliveryInfo.status = 'ACTIVE';
      }
    } else {
      // Si se desconecta, también marcar como no disponible
      user.deliveryInfo.isAvailable = false;
      user.deliveryInfo.status = 'INACTIVE';
    }

    await user.save();

    return user;
  }

  async updateDeliveryAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role !== UserRole.DELIVERY) {
      throw new BadRequestException('El usuario no es un repartidor');
    }

    // Inicializar deliveryInfo si no existe
    if (!user.deliveryInfo) {
      user.deliveryInfo = this.initializeDeliveryInfo();
    }

    // No puede estar disponible si está offline
    if (isAvailable && !user.deliveryInfo.isOnline) {
      throw new BadRequestException(
        'No puedes estar disponible si estás desconectado',
      );
    }

    user.deliveryInfo.isAvailable = isAvailable;

    await user.save();

    return user;
  }

  async updateDeliveryLocation(
    userId: string,
    location: { lat: number; lng: number },
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role !== UserRole.DELIVERY) {
      throw new BadRequestException('El usuario no es un repartidor');
    }

    // Inicializar deliveryInfo si no existe
    if (!user.deliveryInfo) {
      user.deliveryInfo = this.initializeDeliveryInfo();
    }

    // Actualizar la ubicación según el schema (líneas 16-20)
    user.deliveryInfo.currentLocation = {
      lat: location.lat,
      lng: location.lng,
    };

    // Actualizar timestamp de última actualización de ubicación
    user.deliveryInfo.lastLocationUpdate = new Date();

    await user.save();

    return user;
  }

  async updateDeliveryStatus(
    userId: string,
    status: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role !== UserRole.DELIVERY) {
      throw new BadRequestException('El usuario no es un repartidor');
    }

    // Validar estados permitidos según schema (línea 87)
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_BREAK'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`,
      );
    }

    // Inicializar deliveryInfo si no existe
    if (!user.deliveryInfo) {
      user.deliveryInfo = this.initializeDeliveryInfo();
    }

    user.deliveryInfo.status = status;

    // Sincronizar flags según el status
    if (status === 'INACTIVE' || status === 'SUSPENDED') {
      user.deliveryInfo.isOnline = false;
      user.deliveryInfo.isAvailable = false;
    } else if (status === 'ACTIVE') {
      // Solo marcar disponible si está online
      if (user.deliveryInfo.isOnline) {
        user.deliveryInfo.isAvailable = true;
      }
    } else if (status === 'ON_BREAK') {
      user.deliveryInfo.isAvailable = false;
      // Mantener online pero no disponible
    }

    await user.save();

    return user;
  }

  // orders.service.ts


}