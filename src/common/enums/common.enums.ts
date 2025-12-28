// src/common/enums/common.enums.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  CLIENT = 'CLIENT',
  DELIVERY = 'DELIVERY',
}

export enum ProductType {
  SIMPLE = 'SIMPLE',
  CUSTOMIZABLE = 'CUSTOMIZABLE',
}

export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INACTIVE = 'INACTIVE',
}

export enum IngredientStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  INACTIVE = 'INACTIVE',
}

export enum MeasurementUnit {
  UNIT = 'UNIT',
  LITER = 'LITER',
  MILLILITER = 'MILLILITER',
  KILO = 'KILO',
  GRAM = 'GRAM',
  POUND = 'POUND',
  OUNCE = 'OUNCE',
}

export enum BusinessType {
  FAST_FOOD = 'FAST_FOOD',
  RESTAURANT = 'RESTAURANT',
  SUPERMARKET = 'SUPERMARKET',
  PHARMACY = 'PHARMACY',
  OTHER = 'OTHER',
}

export enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SCHEDULED = 'SCHEDULED',
}

// ==================== NUEVOS ENUMS PARA ORDERS ====================

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKUP = 'PICKUP',
  IN_TRANSIT = 'IN_TRANSIT',
  ON_DELIVERY = 'ON_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  PAYU = 'PAYU',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum CancellationReason {
  CLIENT_REQUEST = 'CLIENT_REQUEST',
  BUSINESS_UNAVAILABLE = 'BUSINESS_UNAVAILABLE',
  DELIVERY_UNAVAILABLE = 'DELIVERY_UNAVAILABLE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  TIMEOUT = 'TIMEOUT',
  OTHER = 'OTHER',
}

export enum TrackingStatus {
  GOING_TO_BUSINESS = 'GOING_TO_BUSINESS',
  AT_BUSINESS = 'AT_BUSINESS',
  GOING_TO_CLIENT = 'GOING_TO_CLIENT',
  ARRIVED = 'ARRIVED',
}

export enum DeliveryStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}