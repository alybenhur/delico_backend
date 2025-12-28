// src/modules/users/dto/delivery.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../../common/enums/common.enums';

export class UpdateOnlineStatusDto {
  @ApiProperty({
    description: 'Estado online del repartidor',
    example: true,
  })
  @IsBoolean()
  isOnline: boolean;
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Disponibilidad del repartidor para aceptar órdenes',
    example: true,
  })
  @IsBoolean()
  isAvailable: boolean;
}

export class UpdateDeliveryLocationDto {
  @ApiProperty({
    description: 'Latitud de la ubicación',
    example: 8.7479,
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: 'Longitud de la ubicación',
    example: -75.8814,
  })
  @IsNumber()
  lng: number;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    description: 'Estado del repartidor',
    example: 'AVAILABLE',
    enum: DeliveryStatus,
  })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}