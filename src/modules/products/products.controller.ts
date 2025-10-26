// src/modules/products/products.controller.ts
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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
  ProductResponseDto,
  ProductWithDetailsResponseDto,
} from './dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  UserRole,
  ProductType,
  ProductStatus,
} from '../../common/enums/common.enums';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo producto (BUSINESS o ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todos los productos (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'business', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ProductType })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('business') business?: string,
    @Query('category') category?: string,
    @Query('type') type?: ProductType,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(paginationDto, {
      business,
      category,
      type,
      status,
      search,
    });
  }

  @Public()
  @Get('business/:businessId')
  @ApiOperation({ summary: 'Listar productos de un negocio (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de productos del negocio' })
  findByBusiness(
    @Param('businessId') businessId: string,
    @Query() paginationDto: PaginationDto,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.productsService.findByBusiness(
      businessId,
      paginationDto,
      includeInactive,
    );
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Listar productos de una categoría (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de productos de la categoría' })
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productsService.findByCategory(categoryId, paginationDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID (público)' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar producto (Dueño o ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.productsService.update(id, updateProductDto, userId, userRole);
  }

  @Patch(':id/status')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del producto (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    return this.productsService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/stock')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar inventario del producto (Dueño o ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Inventario actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(id, quantity);
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar producto (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.productsService.remove(id, userId, userRole);
  }

 @Public()
@Get('search/by-tags')
@ApiOperation({ summary: 'Buscar productos por tags con detalles completos (público)' })
@ApiQuery({ name: 'tags', required: true, type: String, description: 'Tags separados por comas (ej: vegetariano,saludable)' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiResponse({ 
  status: 200, 
  description: 'Productos encontrados con ingredientes y promociones',
  type: ProductWithDetailsResponseDto,
  isArray: true,
})
findByTags(
  @Query('tags') tags: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  // Convertir el string de tags a array
  const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  if (tagsArray.length === 0) {
    throw new BadRequestException('Debe proporcionar al menos un tag');
  }
  
  // Crear el paginationDto manualmente sin el tags
  const paginationDto: PaginationDto = {
    page: page || 1,
    limit: limit || 10,
  };
  
  return this.productsService.findByTags(tagsArray, paginationDto);
}
}