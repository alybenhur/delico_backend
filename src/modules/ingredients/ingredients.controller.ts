// src/modules/ingredients/ingredients.controller.ts
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
import { IngredientsService } from './ingredients.service';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  UpdateIngredientStatusDto,
  IngredientResponseDto,
  CustomizationDto,
  PriceCalculationResponseDto,
} from './dto/ingredient.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, IngredientStatus } from '../../common/enums/common.enums';

@ApiTags('ingredients')
@ApiBearerAuth('JWT-auth')
@Controller('ingredients')
@UseGuards(RolesGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo ingrediente (BUSINESS o ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Ingrediente creado exitosamente',
    type: IngredientResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({
    status: 400,
    description: 'Solo productos customizables pueden tener ingredientes',
  })
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Listar ingredientes de un producto (público)' })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes' })
  findByProduct(@Param('productId') productId: string) {
    return this.ingredientsService.findByProduct(productId);
  }

  @Public()
  @Get('product/:productId/base')
  @ApiOperation({
    summary: 'Listar ingredientes base de un producto (público)',
  })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes base' })
  findBaseIngredients(@Param('productId') productId: string) {
    return this.ingredientsService.findByProductAndType(productId, 'base');
  }

  @Public()
  @Get('product/:productId/optional')
  @ApiOperation({
    summary: 'Listar ingredientes opcionales de un producto (público)',
  })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes opcionales' })
  findOptionalIngredients(@Param('productId') productId: string) {
    return this.ingredientsService.findByProductAndType(productId, 'optional');
  }

  @Get('business/:businessId')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los ingredientes de un negocio (BUSINESS o ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes del negocio' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  findByBusiness(@Param('businessId') businessId: string) {
    return this.ingredientsService.findByBusiness(businessId);
  }

  @Public()
  @Post('calculate-price')
  @ApiOperation({ summary: 'Calcular precio de producto customizado (público)' })
  @ApiResponse({
    status: 200,
    description: 'Precio calculado',
    type: PriceCalculationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  calculatePrice(@Body() customizationDto: CustomizationDto) {
    return this.ingredientsService.calculateCustomizedPrice(customizationDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener ingrediente por ID (público)' })
  @ApiResponse({
    status: 200,
    description: 'Ingrediente encontrado',
    type: IngredientResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar ingrediente (Dueño o ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Ingrediente actualizado exitosamente',
    type: IngredientResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  update(
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ingredientsService.update(
      id,
      updateIngredientDto,
      userId,
      userRole,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del ingrediente (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateIngredientStatusDto,
  ) {
    return this.ingredientsService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alternar disponibilidad del ingrediente (Dueño o ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Estado alternado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  toggleStatus(@Param('id') id: string) {
    return this.ingredientsService.toggleStatus(id);
  }

  @Patch('product/:productId/bulk-status')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Cambiar estado de todos los ingredientes de un producto (Dueño o ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estados actualizados exitosamente',
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  bulkUpdateStatus(
    @Param('productId') productId: string,
    @Body() updateStatusDto: UpdateIngredientStatusDto,
  ) {
    return this.ingredientsService.bulkUpdateStatus(
      productId,
      updateStatusDto.status,
    );
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar ingrediente (Dueño o ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Ingrediente eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ingredientsService.remove(id, userId, userRole);
  }
}