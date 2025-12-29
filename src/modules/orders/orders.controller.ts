// src/modules/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  CalculateOrderDto,
  UpdateOrderStatusDto,
  AssignDeliveryDto,
  CancelOrderDto,
  RateOrderDto,
  OrderResponseDto,
  OrderCalculationResponseDto,
} from './dto/order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, OrderStatus } from '../../common/enums/common.enums';
/* import {
  CreateMarketplaceOrderDto,
  CalculateMarketplaceOrderDto,
  OrderGroupResponseDto,
  MarketplaceCalculationResponseDto,
} from './dto/marketplace-order.dto';*/
import { Public } from '../auth/decorators/public.decorator';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Crear nuevo pedido (CLIENT)' })
  @ApiResponse({
    status: 201,
    description: 'Pedido creado exitosamente',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Post('calculate')
  //@Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Calcular precio del pedido (preview)' })
  @ApiResponse({
    status: 200,
    description: 'Cálculo realizado',
    type: OrderCalculationResponseDto,
  })
  calculate(@Body() calculateOrderDto: CalculateOrderDto) {
    return this.ordersService.calculateOrder(calculateOrderDto);
  }

  @Get('my-orders')
  @Roles(UserRole.CLIENT,UserRole.DELIVERY)
  @ApiOperation({ summary: 'Mis pedidos (CLIENT)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  getMyOrders(
    @CurrentUser('userId') userId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.getClientOrders(userId, paginationDto, status);
  }

  @Get('business/:businessId')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Pedidos del negocio (BUSINESS o ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Lista de pedidos del negocio' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  getBusinessOrders(
    @Param('businessId') businessId: string,
     @Query() queryDto: OrderPaginationDto,
  
  ) {
     const { status, ...paginationDto } = queryDto;
    return this.ordersService.getBusinessOrders(businessId, paginationDto, status);
  }

  
  @Get('delivery/available')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: 'Pedidos disponibles para tomar (DELIVERY)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pedidos disponibles' })
  getAvailableOrders(@Query() paginationDto: PaginationDto) {
    return this.ordersService.getAvailableOrdersForDelivery(paginationDto);
  }

  @Get('delivery/my-deliveries')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: 'Mis entregas activas (DELIVERY)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Mis entregas' })
  getMyDeliveries(
    @CurrentUser('userId') userId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.getDeliveryOrders(userId, paginationDto, status);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.BUSINESS, UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.BUSINESS, UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar estado del pedido' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto, userId, userRole);
  }

  @Patch(':id/assign-delivery')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Asignar repartidor (BUSINESS o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Repartidor asignado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  assignDelivery(
    @Param('id') id: string,
    @Body() assignDeliveryDto: AssignDeliveryDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ordersService.assignDelivery(
      id,
      assignDeliveryDto,
      userId,
      userRole,
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLIENT, UserRole.BUSINESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  cancel(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ordersService.cancelOrder(id, cancelOrderDto, userId, userRole);
  }

  @Post(':id/rate')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Calificar pedido (CLIENT)' })
  @ApiResponse({ status: 200, description: 'Pedido calificado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  rate(
    @Param('id') id: string,
    @Body() rateOrderDto: RateOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.ordersService.rateOrder(id, rateOrderDto, userId);
  }


// Agregar este endpoint a orders.controller.ts

/**
 * Asignar delivery automáticamente (auto-asignación)
 * El delivery se asigna a sí mismo a la orden
 */
@Patch(':id/assign-delivery')
@Roles(UserRole.DELIVERY)
@ApiOperation({ 
  summary: 'Auto-asignar orden al delivery autenticado',
  description: 'Permite que un delivery acepte una orden disponible y se la asigne automáticamente' 
})
@ApiResponse({ 
  status: 200, 
  description: 'Orden asignada exitosamente',
  type: OrderResponseDto 
})
@ApiResponse({ 
  status: 400, 
  description: 'La orden no está en estado READY o ya tiene delivery asignado' 
})
@ApiResponse({ 
  status: 403, 
  description: 'Solo los deliveries pueden auto-asignarse órdenes' 
})
@ApiResponse({ 
  status: 404, 
  description: 'Orden no encontrada' 
})
async assignDeliveryToOrder(
  @Param('id') orderId: string,
  @CurrentUser('userId') deliveryUserId: string,
) {
  return this.ordersService.assignDeliveryToOrder(orderId, deliveryUserId);
}
  // Agregar estos endpoints en la clase OrdersController:
/* @Public()
@Post('marketplace/calculate')
@ApiOperation({ summary: 'Calcular orden de marketplace (cotización)' })
@ApiResponse({ status: 200, type: MarketplaceCalculationResponseDto })
async calculateMarketplaceOrder(
  @Body() calculateDto: CalculateMarketplaceOrderDto,
) {
  console.log(calculateDto)
  return this.ordersService.calculateMarketplaceOrder(calculateDto);
} */

/*
@Post('marketplace')
@ApiOperation({ summary: 'Crear orden de marketplace (múltiples negocios)' })
@ApiResponse({ status: 201 })

async createMarketplaceOrder(
  @Body() createDto: CreateMarketplaceOrderDto,
  @CurrentUser('userId') clientId: string, // ✅ Mucho más limpio
  @Req() request: any,   
) {
    const authHeader = request.headers.authorization;
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 DEBUG - CREAR MARKETPLACE ORDER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Authorization Header:', authHeader);
    return this.ordersService.createMarketplaceOrder(createDto, clientId);
}*/

/*
@Get('marketplace/groups')
@ApiOperation({ summary: 'Obtener grupos de órdenes del cliente' })
@ApiResponse({ status: 200 })
async getClientOrderGroups(
  @Query() paginationDto: PaginationDto,
  @CurrentUser('userId') clientId: string, // ✅ Mucho más limpio
  @Req() request: any,
) 
{
   const authHeader = request.headers.authorization;
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 DEBUG - CREAR MARKETPLACE ORDER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 Authorization Header:', authHeader);
  return this.ordersService.getClientOrderGroups(clientId, paginationDto);
}


@Get('marketplace/groups/:id')
@ApiOperation({ summary: 'Obtener detalle de grupo de órdenes' })
@ApiResponse({ status: 200, type: OrderGroupResponseDto })
async getOrderGroup(@Param('id') id: string) {
  return this.ordersService.findOrderGroup(id);
}*/
}