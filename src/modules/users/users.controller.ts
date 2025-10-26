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

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== ENDPOINTS PARA ADMIN ====================

  @Post()
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
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
}