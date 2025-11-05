// src/modules/orders/controllers/delivery-assignment.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // Agregar Types aquí
import { DeliveryAssignmentService } from '../services/delivery-assignment.service';
import {
  AssignmentResultDto,
  AssignmentConfigDto,
  DeliveryAssignmentDto,
} from '../dto/delivery-assignment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/common.enums';
import { User } from '../../users/schemas/user.schema';

@ApiTags('Delivery Assignment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class DeliveryAssignmentController {
  constructor(
    private readonly deliveryAssignmentService: DeliveryAssignmentService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Post('groups/:groupId/assign-deliveries')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar repartidores a un grupo de órdenes',
    description: `
      Analiza un OrderGroup y asigna repartidores de manera inteligente usando:
      - INDIVIDUAL: 1 repartidor por orden (cuando están dispersas)
      - GROUPED: 1 repartidor para todas (cuando están cercanas)
      - HYBRID: Clustering inteligente (para grupos grandes)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Asignación completada exitosamente',
    type: AssignmentResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'OrderGroup no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'No hay repartidores disponibles',
  })
  async assignDeliveries(
    @Param('groupId') groupId: string,
    @Body() config?: AssignmentConfigDto,
  ): Promise<AssignmentResultDto> {
    const result = await this.deliveryAssignmentService.assignDeliveriesForOrderGroup(
      groupId,
    );

    // Transformar assignments a DTOs con información completa del delivery
    const assignmentsDto: DeliveryAssignmentDto[] = await Promise.all(
      result.assignments.map(async (assignment) => {
        // Agregar .lean() aquí para obtener un objeto plano
        const delivery = await this.userModel.findById(assignment.deliveryId).lean();
        
        if (!delivery) {
          throw new Error(`Delivery with ID ${assignment.deliveryId} not found`);
        }
        
        return {
          deliveryId: assignment.deliveryId.toString(),
          delivery: {
            _id: delivery._id.toString(),
            fullName: delivery.fullName,
            phone: delivery.phone,
            email: delivery.email,
          },
          orders: assignment.orders.map(o => o.toString()),
          route: {
            pickupPoints: assignment.route.pickupPoints.map(p => ({
              businessId: p.businessId.toString(),
              orderId: p.orderId.toString(),
              orderNumber: p.orderNumber,
              location: p.location,
              estimatedPrepTime: p.estimatedPrepTime,
              itemCount: p.itemCount,
            })),
            deliveryPoint: assignment.route.deliveryPoint,
            optimizedSequence: assignment.route.optimizedSequence,
            totalDistance: assignment.route.totalDistance,
            estimatedTime: assignment.route.estimatedTime,
          },
          priority: assignment.priority,
        };
      })
    );

    return {
      strategy: result.strategy,
      assignments: assignmentsDto,
      reason: result.reason,
      metrics: result.metrics,
      timestamp: new Date(),
    };
  }

  @Get('groups/:groupId/assignment-preview')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiOperation({
    summary: 'Vista previa de asignación sin guardar',
    description: 'Analiza cómo se asignarían los repartidores sin hacer cambios',
  })
  @ApiResponse({
    status: 200,
    description: 'Vista previa generada',
    type: AssignmentResultDto,
  })
  async previewAssignment(
    @Param('groupId') groupId: string,
  ): Promise<AssignmentResultDto> {
    const result = await this.deliveryAssignmentService.assignDeliveriesForOrderGroup(
      groupId,
    );

    // Transformar assignments a DTOs con información completa del delivery
    const assignmentsDto: DeliveryAssignmentDto[] = await Promise.all(
      result.assignments.map(async (assignment) => {
        // Agregar .lean() aquí también
        const delivery = await this.userModel.findById(assignment.deliveryId).lean();
        
        if (!delivery) {
          throw new Error(`Delivery with ID ${assignment.deliveryId} not found`);
        }
        
        return {
          deliveryId: assignment.deliveryId.toString(),
          delivery: {
            _id: delivery._id.toString(),
            fullName: delivery.fullName,
            phone: delivery.phone,
            email: delivery.email,
          },
          orders: assignment.orders.map(o => o.toString()),
          route: {
            pickupPoints: assignment.route.pickupPoints.map(p => ({
              businessId: p.businessId.toString(),
              orderId: p.orderId.toString(),
              orderNumber: p.orderNumber,
              location: p.location,
              estimatedPrepTime: p.estimatedPrepTime,
              itemCount: p.itemCount,
            })),
            deliveryPoint: assignment.route.deliveryPoint,
            optimizedSequence: assignment.route.optimizedSequence,
            totalDistance: assignment.route.totalDistance,
            estimatedTime: assignment.route.estimatedTime,
          },
          priority: assignment.priority,
        };
      })
    );

    return {
      strategy: result.strategy,
      assignments: assignmentsDto,
      reason: result.reason,
      metrics: result.metrics,
      timestamp: new Date(),
    };
  }
}