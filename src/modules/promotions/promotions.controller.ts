// src/modules/promotions/promotions.controller.ts
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
import { PromotionsService } from './promotions.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  UpdatePromotionStatusDto,
  ApplyPromotionDto,
  PromotionResponseDto,
  DiscountResultDto,
} from './dto/promotion.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, PromotionStatus } from '../../common/enums/common.enums';

@ApiTags('promotions')
@ApiBearerAuth('JWT-auth')
@Controller('promotions')
@UseGuards(RolesGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nueva promoción (BUSINESS o ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Promoción creada exitosamente',
    type: PromotionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }


  // promotion.controller.ts
@Public()
@Get()
@ApiOperation({ summary: 'Listar todas las promociones (público)' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'business', required: false, type: String })
@ApiQuery({ name: 'status', required: false, enum: PromotionStatus })
findAll(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('business') business?: string,
  @Query('status') status?: PromotionStatus,
) {
  const paginationDto = { page, limit };
  return this.promotionsService.findAll(paginationDto, {
    business,
    status,
  });
}
/*
  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todas las promociones (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'business', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PromotionStatus })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de promociones' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('business') business?: string,
    @Query('status') status?: PromotionStatus,
    @Query('active') active?: boolean,
  ) {
    return this.promotionsService.findAll(paginationDto, {
      business,
      status,
      active,
    });
  }
    */

  @Public()
  @Get('product/:productId')
  @ApiOperation({
    summary: 'Listar promociones activas de un producto (público)',
  })
  @ApiResponse({ status: 200, description: 'Lista de promociones del producto' })
  findByProduct(@Param('productId') productId: string) {
    return this.promotionsService.findByProduct(productId);
  }

  @Public()
  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar promoción por código (público)' })
  @ApiResponse({
    status: 200,
    description: 'Promoción encontrada',
    type: PromotionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  findByCode(@Param('code') code: string) {
    return this.promotionsService.findByCode(code);
  }

  @Public()
  @Post('apply')
  @ApiOperation({ summary: 'Aplicar promoción a un producto (público)' })
  @ApiResponse({
    status: 200,
    description: 'Resultado del descuento',
    type: DiscountResultDto,
  })
  applyPromotion(@Body() applyPromotionDto: ApplyPromotionDto) {
    return this.promotionsService.applyPromotion(applyPromotionDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener promoción por ID (público)' })
  @ApiResponse({
    status: 200,
    description: 'Promoción encontrada',
    type: PromotionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar promoción (Dueño o ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Promoción actualizada exitosamente',
    type: PromotionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.promotionsService.update(
      id,
      updatePromotionDto,
      userId,
      userRole,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado de la promoción (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePromotionStatusDto,
  ) {
    return this.promotionsService.updateStatus(id, updateStatusDto.status);
  }

  @Post('maintenance/update-expired')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar promociones expiradas (solo ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Promociones actualizadas',
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateExpired() {
    return this.promotionsService.updateExpiredPromotions();
  }

  @Post('maintenance/activate-scheduled')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activar promociones programadas (solo ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Promociones activadas',
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  activateScheduled() {
    return this.promotionsService.activateScheduledPromotions();
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar promoción (Dueño o ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Promoción eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.promotionsService.remove(id, userId, userRole);
  }
}