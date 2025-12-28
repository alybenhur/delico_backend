// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/common.enums';

import {
  UpdateOnlineStatusDto,
  UpdateAvailabilityDto,
  UpdateDeliveryLocationDto,
  UpdateDeliveryStatusDto,
} from './dto/delivery.dto';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== ENDPOINTS PARA ADMIN ====================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Crear nuevo usuario (solo ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({ summary: 'Listar todos los usuarios (solo ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(paginationDto, role);
  }

  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener usuario por ID (solo ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  findOneByAdmin(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario (solo ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateByAdmin(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  removeByAdmin(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ==================== ENDPOINTS PARA TODOS LOS USUARIOS ====================

  @Get('profile')
  @ApiOperation({ summary: 'Obtener mi perfil (usuario autenticado)' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UserResponseDto,
  })
  getMyProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Actualizar mi perfil (usuario autenticado)' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Prevenir cambio de rol por el propio usuario
    delete (updateUserDto as any).role;
    delete (updateUserDto as any).isActive;
    delete (updateUserDto as any).isEmailVerified;
    
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete('profile')
  @ApiOperation({ summary: 'Eliminar mi cuenta (usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  deleteMyAccount(@CurrentUser('userId') userId: string) {
    return this.usersService.remove(userId);
  }

   @Patch(':id/online-status')
  @Roles(UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar estado online del repartidor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado online actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 400, description: 'El usuario no es un repartidor' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar este usuario' })
  async updateOnlineStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOnlineStatusDto,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    // Solo el propio delivery o admin puede actualizar
    if (currentUserRole !== UserRole.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('No puedes actualizar otro usuario');
    }

    const user = await this.usersService.updateDeliveryOnlineStatus(
      id,
      dto.isOnline,
    );

    return {
      message: 'Estado online actualizado exitosamente',
      user,
    };
  }

  @Patch(':id/availability')
  @Roles(UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar disponibilidad del repartidor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Disponibilidad actualizada exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 400, description: 'El usuario no es un repartidor o está desconectado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar este usuario' })
  async updateAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    // Solo el propio delivery o admin puede actualizar
    if (currentUserRole !== UserRole.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('No puedes actualizar otro usuario');
    }

    const user = await this.usersService.updateDeliveryAvailability(
      id,
      dto.isAvailable,
    );

    return {
      message: 'Disponibilidad actualizada exitosamente',
      user,
    };
  }

  @Patch(':id/location')
  @Roles(UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar ubicación del repartidor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Ubicación actualizada exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 400, description: 'El usuario no es un repartidor' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar este usuario' })
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryLocationDto,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    // Solo el propio delivery o admin puede actualizar
    if (currentUserRole !== UserRole.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('No puedes actualizar otro usuario');
    }

    const user = await this.usersService.updateDeliveryLocation(id, {
      lat: dto.lat,
      lng: dto.lng,
    });

    return {
      message: 'Ubicación actualizada exitosamente',
      user,
    };
  }

  @Patch(':id/delivery-status')
  @Roles(UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar estado del repartidor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del repartidor actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 400, description: 'El usuario no es un repartidor' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar este usuario' })
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    // Solo el propio delivery o admin puede actualizar
    if (currentUserRole !== UserRole.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('No puedes actualizar otro usuario');
    }

    const user = await this.usersService.updateDeliveryStatus(
      id,
      dto.status,
    );

    return {
      message: 'Estado del repartidor actualizado exitosamente',
      user,
    };
  }
}