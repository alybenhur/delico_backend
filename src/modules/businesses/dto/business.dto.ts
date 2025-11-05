// src/modules/businesses/dto/business.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BusinessType, BusinessStatus } from '../../../common/enums/common.enums';

class CoordinatesDto {
  @ApiProperty({ example: 8.7479 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -75.8814 })
  @IsNumber()
  lng: number;
}

class BusinessAddressDto {
  @ApiProperty({ example: 'Calle 123 #45-67' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Montería' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Córdoba' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '230001' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ example: { lat: 8.7479, lng: -75.8814 } })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

class DayScheduleDto {
  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato debe ser HH:MM (ej: 08:00)',
  })
  open?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'El formato debe ser HH:MM (ej: 22:00)',
  })
  close?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isClosed?: boolean;
}

class ScheduleDto {
  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday?: DayScheduleDto;
}

export class CreateBusinessDto {
  @ApiProperty({ example: 'Restaurante La Delicia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Los mejores platos de comida rápida de la ciudad' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: BusinessType, example: BusinessType.FAST_FOOD })
  @IsEnum(BusinessType)
  @IsNotEmpty()
  type: BusinessType;

  @ApiProperty({ example: '+57 300 123 4567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'contacto@ladelicia.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: BusinessAddressDto })
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  @IsNotEmpty()
  address: BusinessAddressDto;

  @ApiPropertyOptional({ type: ScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule?: ScheduleDto;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: ['https://example.com/img1.png'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 5000, description: 'Tarifa de delivery en COP' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Pedido mínimo en COP',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrder?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Tiempo estimado de entrega en minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDeliveryTime?: number;

  @ApiPropertyOptional({
    example: ['Pizza', 'Italiana', 'Delivery Rápido'],
    description: 'Etiquetas descriptivas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @ApiPropertyOptional({ enum: BusinessStatus, example: BusinessStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ example: 4.5, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalReviews?: number;
}

export class BusinessResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: BusinessType })
  type: BusinessType;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  address: BusinessAddressDto;

  @ApiPropertyOptional()
  schedule?: ScheduleDto;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  banner?: string;

  @ApiPropertyOptional()
  images?: string[];

  @ApiProperty({ enum: BusinessStatus })
  status: BusinessStatus;

  @ApiPropertyOptional()
  rating?: number;

  @ApiPropertyOptional()
  totalReviews?: number;

  @ApiPropertyOptional()
  deliveryFee?: number;

  @ApiPropertyOptional()
  minimumOrder?: number;

  @ApiPropertyOptional()
  estimatedDeliveryTime?: number;

  @ApiPropertyOptional()
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}