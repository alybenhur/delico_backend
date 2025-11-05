// src/modules/orders/dto/delivery-assignment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum AssignmentStrategy {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUPED = 'GROUPED',
  HYBRID = 'HYBRID',
  SEQUENTIAL = 'SEQUENTIAL',
}

// ==================== REQUEST DTOs ====================

export class AssignmentConfigDto {
  @ApiPropertyOptional({
    example: 4,
    description: 'Máximo de órdenes por repartidor',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrdersPerDelivery?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Distancia máxima en km para agrupar órdenes',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  maxDistanceForGrouping?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Tiempo adicional máximo tolerado en minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  maxAdditionalWaitTime?: number;

  @ApiPropertyOptional({
    enum: AssignmentStrategy,
    description: 'Forzar una estrategia específica',
  })
  @IsOptional()
  @IsEnum(AssignmentStrategy)
  forceStrategy?: AssignmentStrategy;
}

// ==================== RESPONSE DTOs ====================

export class BusinessPickupPointDto {
  @ApiProperty()
  businessId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({
    example: { lat: 8.7479, lng: -75.8814 },
  })
  location: { lat: number; lng: number };

  @ApiProperty({ example: 30 })
  estimatedPrepTime: number;

  @ApiProperty({ example: 3 })
  itemCount: number;
}

export class RouteDto {
  @ApiProperty({ type: [BusinessPickupPointDto] })
  pickupPoints: BusinessPickupPointDto[];

  @ApiProperty({
    example: { lat: 8.7500, lng: -75.8900 },
  })
  deliveryPoint: { lat: number; lng: number };

  @ApiProperty({
    example: [0, 2, 1],
    description: 'Secuencia optimizada de recogida',
  })
  optimizedSequence: number[];

  @ApiProperty({ example: 5.2, description: 'Distancia total en km' })
  totalDistance: number;

  @ApiProperty({ example: 45, description: 'Tiempo estimado en minutos' })
  estimatedTime: number;
}

export class DeliveryAssignmentDto {
  @ApiProperty()
  deliveryId: string;

  @ApiProperty({ description: 'Información del repartidor' })
  delivery: {
    _id: string;
    fullName: string;
    phone: string;
    email: string;
  };

  @ApiProperty({ type: [String] })
  orders: string[];

  @ApiProperty({ type: RouteDto })
  route: RouteDto;

  @ApiProperty({ example: 3, description: 'Prioridad de 1 (baja) a 5 (alta)' })
  priority: number;
}

export class AssignmentMetricsDto {
  @ApiProperty({ example: 5 })
  totalOrders: number;

  @ApiProperty({ example: 2 })
  deliveriesUsed: number;

  @ApiProperty({ example: 2.5 })
  averageOrdersPerDelivery: number;

  @ApiProperty({ example: 45 })
  estimatedTotalTime: number;

  @ApiProperty({
    example: 75.5,
    description: 'Eficiencia de costo (0-100)',
  })
  costEfficiency: number;
}

export class AssignmentResultDto {
  @ApiProperty({ enum: AssignmentStrategy })
  strategy: AssignmentStrategy;

  @ApiProperty({ type: [DeliveryAssignmentDto] })
  assignments: DeliveryAssignmentDto[];

  @ApiProperty({
    example: 'Agrupación inteligente en 2 clusters',
  })
  reason: string;

  @ApiProperty({ type: AssignmentMetricsDto })
  metrics: AssignmentMetricsDto;

  @ApiProperty()
  timestamp: Date;
}

// ==================== SIMULACIÓN ====================

export class SimulateAssignmentDto extends AssignmentConfigDto {
  @ApiProperty({
    example: 5,
    description: 'Número de órdenes a simular',
  })
  @IsNumber()
  @Min(1)
  orderCount: number;

  @ApiPropertyOptional({
    example: { lat: 8.7500, lng: -75.8900 },
    description: 'Centro del área de simulación',
  })
  @IsOptional()
  centerPoint?: { lat: number; lng: number };
}

export class SimulationResultDto extends AssignmentResultDto {
  @ApiProperty()
  simulatedOrders: {
    orderNumber: string;
    business: string;
    businessLocation: { lat: number; lng: number };
    itemCount: number;
  }[];

  @ApiProperty()
  availableDeliveries: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
  }[];
}