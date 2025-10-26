// src/modules/businesses/businesses.controller.ts
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
import { BusinessesService } from './businesses.service';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
  BusinessResponseDto,
} from './dto/business.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, BusinessType, BusinessStatus } from '../../common/enums/common.enums';

@ApiTags('businesses')
@ApiBearerAuth('JWT-auth')
@Controller('businesses')
@UseGuards(RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo negocio (BUSINESS o ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Negocio creado exitosamente',
    type: BusinessResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.businessesService.create(createBusinessDto, userId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todos los negocios (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: BusinessType })
  @ApiQuery({ name: 'status', required: false, enum: BusinessStatus })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de negocios' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('type') type?: BusinessType,
    @Query('status') status?: BusinessStatus,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    return this.businessesService.findAll(paginationDto, {
      type,
      status,
      city,
      search,
    });
  }

   @Public()
  @Get('all')
  //@Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los negocios sin filtros (solo ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista completa de todos los negocios' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  findAllBusinesses(@Query() paginationDto: PaginationDto) {
    return this.businessesService.findAllBusinesses(paginationDto);
  }

  @Get('my-businesses')
  @Roles(UserRole.BUSINESS)
  @ApiOperation({ summary: 'Listar mis negocios (solo BUSINESS)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de mis negocios' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  findMyBusinesses(
    @CurrentUser('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.businessesService.findByOwner(userId, paginationDto);
  }

  @Get('my-businesses/stats')
  @Roles(UserRole.BUSINESS)
  @ApiOperation({ summary: 'Estadísticas de mis negocios (solo BUSINESS)' })
  @ApiResponse({ status: 200, description: 'Estadísticas de negocios' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  getMyBusinessesStats(@CurrentUser('userId') userId: string) {
    return this.businessesService.getStatsByOwner(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener negocio por ID (público)' })
  @ApiResponse({
    status: 200,
    description: 'Negocio encontrado',
    type: BusinessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar negocio (Dueño o ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Negocio actualizado exitosamente',
    type: BusinessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.businessesService.update(
      id,
      updateBusinessDto,
      userId,
      userRole,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del negocio (solo ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BusinessStatus,
  ) {
    return this.businessesService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar negocio (Dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Negocio eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.businessesService.remove(id, userId, userRole);
  }
}