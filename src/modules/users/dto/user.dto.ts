// src/modules/users/dto/user.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsDateString,
  IsUrl,
  Matches,
  MaxLength,
  IsObject,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/common.enums';

// ==================== SUB-DTOs ====================

/**
 * Coordenadas geográficas
 */
export class CoordinatesDto {
  @ApiProperty({ example: 8.7479, description: 'Latitud' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -75.8814, description: 'Longitud' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

/**
 * Dirección completa
 */
export class AddressDto {
  @ApiProperty({ example: 'Calle 123 #45-67' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street: string;

  @ApiProperty({ example: 'Montería' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Córdoba' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '230001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  zipCode: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({
    type: CoordinatesDto,
    example: { lat: 8.7479, lng: -75.8814 },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiPropertyOptional({ example: 'Casa blanca con portón negro' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reference?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * Información bancaria
 */
export class BankInfoDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: 'Bancolombia' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ example: 'savings', enum: ['savings', 'checking'] })
  @IsString()
  @IsNotEmpty()
  accountType: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;
}

/**
 * Horario de trabajo
 */
export class WorkingHoursDto {
  @ApiProperty({
    example: 'monday',
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  })
  @IsString()
  @IsNotEmpty()
  day: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

/**
 * Documento del repartidor
 */
export class DeliveryDocumentDto {
  @ApiProperty({
    example: 'DRIVER_LICENSE',
    enum: ['ID', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE', 'BACKGROUND_CHECK'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'ABC123456' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @ApiProperty({ example: false })
  @IsBoolean()
  verified: boolean;
}

/**
 * Información de delivery
 */
export class DeliveryInfoDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ type: CoordinatesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  currentLocation?: CoordinatesDto;

  @ApiPropertyOptional({
    example: ['motorcycle', 'bicycle'],
    enum: ['bicycle', 'motorcycle', 'car', 'scooter', 'van'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicleTypes?: string[];

  @ApiPropertyOptional({ example: 'ABC-123' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxOrdersCapacity?: number;

  @ApiPropertyOptional({ type: BankInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankInfoDto)
  bankInfo?: BankInfoDto;

  @ApiPropertyOptional({ type: [WorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({ type: [String], example: ['zone1', 'zone2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coverageZones?: string[];

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_BREAK'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [DeliveryDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryDocumentDto)
  documents?: DeliveryDocumentDto[];
}

/**
 * Método de pago
 */
export class PaymentMethodDto {
  @ApiProperty({
    example: 'CARD',
    enum: ['CARD', 'BANK_ACCOUNT', 'DIGITAL_WALLET'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: 'VISA' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: '4242' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  last4?: string;

  @ApiPropertyOptional({ example: '12/25' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)
  expiryDate?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isDefault: boolean;

  @ApiPropertyOptional({ example: 'tok_visa' })
  @IsOptional()
  @IsString()
  token?: string;
}

/**
 * Preferencias del usuario
 */
export class UserPreferencesDto {
  @ApiPropertyOptional({ example: 'es', enum: ['es', 'en'] })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional({ example: 'LIGHT', enum: ['LIGHT', 'DARK', 'AUTO'] })
  @IsOptional()
  @IsString()
  theme?: string;
}

// ==================== DTOs PRINCIPALES ====================

/**
 * DTO para crear un nuevo usuario
 */
export class CreateUserDto {
  @ApiProperty({ example: 'Juan', minLength: 2, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Pérez', minLength: 2, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener mayúsculas, minúsculas y números',
  })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({ example: '+57 300 123 4567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '+57 300 987 6543' })
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: DeliveryInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  deliveryInfo?: DeliveryInfoDto;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  nationalId?: string;
}

/**
 * DTO para actualizar usuario
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({ type: UserPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;

  @ApiPropertyOptional({ type: [AddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  savedAddresses?: AddressDto[];

  @ApiPropertyOptional({ type: [String], example: ['vip', 'frequent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * DTO para actualizar ubicación del repartidor
 */
export class UpdateDeliveryLocationDto {
  @ApiProperty({ example: 8.7479 })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -75.8814 })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  lng: number;
}

/**
 * DTO para actualizar disponibilidad del repartidor
 */
export class UpdateDeliveryAvailabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isAvailable: boolean;
}

/**
 * DTO para actualizar estado online del repartidor
 */
export class UpdateDeliveryOnlineStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isOnline: boolean;
}

/**
 * DTO para actualizar estado del repartidor
 */
export class UpdateDeliveryStatusDto {
  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_BREAK'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: 'Vacaciones programadas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  suspendedUntil?: Date;
}

/**
 * DTO para cambiar contraseña
 */
export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener mayúsculas, minúsculas y números',
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

/**
 * DTO para agregar método de pago
 */
export class AddPaymentMethodDto {
  @ApiProperty({ type: PaymentMethodDto })
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  @IsNotEmpty()
  paymentMethod: PaymentMethodDto;
}

/**
 * DTO para agregar dirección guardada
 */
export class AddSavedAddressDto {
  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;
}

// ==================== RESPONSE DTOs ====================

/**
 * DTO de respuesta con información pública del usuario
 */
export class UserResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  phoneSecondary?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional({ type: AddressDto })
  address?: AddressDto;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  isPhoneVerified: boolean;

  @ApiPropertyOptional()
  lastLogin?: Date;

  @ApiPropertyOptional({ type: DeliveryInfoDto })
  deliveryInfo?: DeliveryInfoDto;

  @ApiPropertyOptional({ type: UserPreferencesDto })
  preferences?: UserPreferencesDto;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  loyaltyPoints: number;

  @ApiProperty()
  loyaltyTier: string;

  @ApiPropertyOptional({ type: [AddressDto] })
  savedAddresses?: AddressDto[];

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * DTO de respuesta para perfil del repartidor (información pública)
 */
export class DeliveryPublicProfileDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  totalDeliveries: number;

  @ApiProperty()
  completedDeliveries: number;

  @ApiProperty()
  completionRate: number;

  @ApiPropertyOptional({ type: [String] })
  vehicleTypes?: string[];

  @ApiPropertyOptional()
  vehiclePlate?: string;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  isOnline: boolean;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  serviceQuality?: string;
}

/**
 * DTO de respuesta para estadísticas del repartidor
 */
export class DeliveryStatsDto {
  @ApiProperty()
  totalDeliveries: number;

  @ApiProperty()
  completedDeliveries: number;

  @ApiProperty()
  cancelledDeliveries: number;

  @ApiProperty()
  missedOrders: number;

  @ApiProperty()
  lateDeliveries: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  averageDeliveryTime: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  currentActiveOrders: number;

  @ApiProperty()
  maxOrdersCapacity: number;
}

/**
 * DTO para búsqueda/filtrado de usuarios
 */
export class UserFilterDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ example: 'juan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Montería' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Córdoba' })
  @IsOptional()
  @IsString()
  state?: string;

  // Para repartidores
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  deliveryStatus?: string;
}

/**
 * DTO para buscar repartidores cercanos
 */
export class FindNearbyDeliveriesDto {
  @ApiProperty({ example: 8.7479 })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -75.8814 })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxDistanceKm?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;
}