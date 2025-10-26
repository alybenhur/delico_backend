// src/modules/categories/categories.controller.ts
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
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto/category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../../common/enums/common.enums';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nueva categoría (BUSINESS o ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada exitosamente',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 409, description: 'La categoría ya existe' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Public()
  @Get('business/:businessId')
  @ApiOperation({ summary: 'Listar categorías de un negocio (público)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de categorías' })
  findByBusiness(
    @Param('businessId') businessId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.categoriesService.findAll(businessId, includeInactive);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID (público)' })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar categoría (Dueño o ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.categoriesService.update(
      id,
      updateCategoryDto,
      userId,
      userRole,
    );
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activar/Desactivar categoría (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  toggleActive(@Param('id') id: string) {
    return this.categoriesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar categoría (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.categoriesService.remove(id, userId, userRole);
  }
}