// src/modules/tracking/dto/tracking.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackingStatus } from '../../../common/enums/common.enums';

export class UpdateLocationDto {
  @ApiProperty({ example: 8.7479 })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: -75.8814 })
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @ApiPropertyOptional({ example: 10, description: 'Precisión en metros' })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 35, description: 'Velocidad en km/h' })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ example: 90, description: 'Dirección en grados (0-360)' })
  @IsOptional()
  @IsNumber()
  heading?: number;
}

export class UpdateTrackingStatusDto {
  @ApiProperty({ enum: TrackingStatus, example: TrackingStatus.AT_BUSINESS })
  @IsEnum(TrackingStatus)
  @IsNotEmpty()
  status: TrackingStatus;
}

export class TrackingResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  order: string;

  @ApiProperty()
  delivery: any;

  @ApiProperty()
  route: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    distance: number;
    estimatedDuration: number;
    polyline?: string;
  };

  @ApiProperty()
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
    accuracy?: number;
    speed?: number;
    heading?: number;
  };

  @ApiProperty({ enum: TrackingStatus })
  status: TrackingStatus;

  @ApiProperty()
  distanceRemaining: number;

  @ApiProperty()
  timeRemaining: number;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  arrivedAtBusinessAt?: Date;

  @ApiPropertyOptional()
  pickedUpAt?: Date;

  @ApiPropertyOptional()
  arrivedAtClientAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}