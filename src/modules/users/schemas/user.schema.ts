// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enums/common.enums';

// ==================== SUB-SCHEMAS ====================

/**
 * Información específica para repartidores
 */
@Schema({ _id: false })
export class DeliveryInfo {
  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ type: { lat: Number, lng: Number } })
  currentLocation?: {
    lat: number;
    lng: number;
  };

  @Prop()
  lastLocationUpdate?: Date;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  totalDeliveries: number;

  @Prop({ default: 0 })
  completedDeliveries: number;

  @Prop({ default: 0 })
  cancelledDeliveries: number;

  @Prop({ type: [String], default: [] })
  vehicleTypes?: string[]; // 'bicycle', 'motorcycle', 'car', 'scooter'

  @Prop()
  vehiclePlate?: string;

  @Prop({ default: 5, min: 1, max: 10 })
  maxOrdersCapacity: number;

  @Prop({ default: 0, min: 0 })
  currentActiveOrders: number;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastOnlineAt?: Date;

  @Prop({ default: 0 })
  totalEarnings: number;

  @Prop({ default: 0 })
  averageDeliveryTime: number; // en minutos

  @Prop({ default: 0 })
  completionRate: number; // 0-100%

  @Prop({ type: Object })
  bankInfo?: {
    accountNumber: string;
    bankName: string;
    accountType: string; // 'savings', 'checking'
    accountHolderName: string;
  };

  @Prop({ type: [Object], default: [] })
  workingHours?: {
    day: string; // 'monday', 'tuesday', etc.
    startTime: string; // '08:00'
    endTime: string; // '18:00'
    isActive: boolean;
  }[];

  @Prop({ type: [String], default: [] })
  coverageZones?: string[]; // IDs de zonas que cubre

  @Prop()
  joiningDate?: Date;

  @Prop({ default: 'ACTIVE' })
  status: string; // 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_BREAK'

  @Prop()
  suspensionReason?: string;

  @Prop()
  suspendedUntil?: Date;

  @Prop({ default: 0 })
  missedOrders: number;

  @Prop({ default: 0 })
  lateDeliveries: number;

  @Prop({ type: [Object], default: [] })
  documents?: {
    type: string; // 'ID', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION', etc.
    documentNumber: string;
    expiryDate?: Date;
    verified: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
  }[];
}

/**
 * Dirección del usuario
 */
@Schema({ _id: false })
export class UserAddress {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  zipCode: string;

  @Prop({ required: true })
  country: string;

  @Prop({ type: { lat: Number, lng: Number } })
  coordinates?: {
    lat: number;
    lng: number;
  };

  @Prop()
  reference?: string;

  @Prop({ default: false })
  isDefault: boolean;
}

/**
 * Preferencias del usuario
 */
@Schema({ _id: false })
export class UserPreferences {
  @Prop({ default: 'es' })
  language: string; // 'es', 'en', etc.

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;

  @Prop({ default: true })
  smsNotifications: boolean;

  @Prop({ default: 'LIGHT' })
  theme: string; // 'LIGHT', 'DARK', 'AUTO'

  @Prop({ type: Object })
  orderPreferences?: {
    defaultPaymentMethod?: string;
    savePaymentMethods?: boolean;
    shareLocationWithDelivery?: boolean;
  };
}

// ==================== MAIN SCHEMA ====================

@Schema({ timestamps: true })
export class User extends Document {
  // ==================== INFORMACIÓN BÁSICA ====================

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  firstName: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true })
  phoneSecondary?: string;

  @Prop()
  avatar?: string; // URL de la imagen

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  gender?: string; // 'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'

  @Prop()
  nationalId?: string; // Cédula, DNI, etc.

  // ==================== DIRECCIÓN ====================

  @Prop({ type: UserAddress })
  address?: UserAddress;

  @Prop({ type: [UserAddress], default: [] })
  savedAddresses?: UserAddress[];

  // ==================== INFORMACIÓN DE DELIVERY ====================

  @Prop({ type: DeliveryInfo })
  deliveryInfo?: DeliveryInfo;

  // ==================== PREFERENCIAS ====================

  @Prop({ type: UserPreferences })
  preferences?: UserPreferences;

  // ==================== SEGURIDAD Y SESIÓN ====================

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ type: String, select: false })
  refreshToken?: string;

  @Prop()
  lastLogin?: Date;

  @Prop()
  lastPasswordChange?: Date;

  @Prop({ type: [String], default: [], select: false })
  passwordHistory?: string[]; // Para evitar reutilizar contraseñas

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  phoneVerificationCode?: string;

  @Prop()
  phoneVerificationExpires?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  // ==================== INFORMACIÓN FINANCIERA ====================

  @Prop({ default: 0 })
  walletBalance: number;

  @Prop({ type: [Object], default: [] })
  paymentMethods?: {
    type: string; // 'CARD', 'BANK_ACCOUNT', 'DIGITAL_WALLET'
    provider?: string; // 'VISA', 'MASTERCARD', 'BANCOLOMBIA', etc.
    last4?: string;
    expiryDate?: string;
    isDefault: boolean;
    token?: string; // Token del gateway de pago
    createdAt: Date;
  }[];

  // ==================== ESTADÍSTICAS DE CLIENTE ====================

  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ default: 0 })
  cancelledOrders: number;

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop()
  firstOrderDate?: Date;

  @Prop()
  lastOrderDate?: Date;

  // ==================== PROGRAMA DE LEALTAD ====================

  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ default: 'BRONZE' })
  loyaltyTier: string; // 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'

  @Prop({ type: [Object], default: [] })
  appliedPromotions?: {
    promotionId: string;
    code: string;
    appliedAt: Date;
    discount: number;
  }[];

  // ==================== METADATA ====================

  @Prop()
  referredBy?: string; // User ID que lo refirió

  @Prop({ default: 0 })
  referralCount: number; // Cuántos usuarios ha referido

  @Prop({ type: Object })
  metadata?: {
    source?: string; // 'WEB', 'MOBILE_APP', 'ADMIN'
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  };

  @Prop({ type: [String], default: [] })
  tags?: string[]; // Para segmentación y marketing

  @Prop({ type: [Object], default: [] })
  notes?: {
    content: string;
    createdBy: string;
    createdAt: Date;
    isPrivate: boolean;
  }[];

  // ==================== AUDIT ====================

  @Prop()
  deletedAt?: Date;

  @Prop()
  deletedBy?: string;

  @Prop()
  deletionReason?: string;

  // Timestamps (createdAt, updatedAt) se agregan automáticamente

  // ==================== VIRTUAL: NOMBRE COMPLETO ====================

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // ==================== VIRTUAL: ES REPARTIDOR ====================

  get isDelivery(): boolean {
    return this.role === UserRole.DELIVERY;
  }

  // ==================== VIRTUAL: PUEDE HACER DELIVERY ====================

  get canDeliverNow(): boolean {
    if (this.role !== UserRole.DELIVERY || !this.deliveryInfo) {
      return false;
    }

    return (
      this.isActive &&
      this.deliveryInfo.isAvailable &&
      this.deliveryInfo.isOnline &&
      this.deliveryInfo.status === 'ACTIVE' &&
      this.deliveryInfo.currentActiveOrders < this.deliveryInfo.maxOrdersCapacity
    );
  }

  // ==================== VIRTUAL: CALIDAD DEL SERVICIO (DELIVERY) ====================

  get serviceQuality(): string | null {
    if (this.role !== UserRole.DELIVERY || !this.deliveryInfo) {
      return null;
    }

    const rating = this.deliveryInfo.rating;
    const completionRate = this.deliveryInfo.completionRate;

    if (rating >= 4.5 && completionRate >= 95) return 'EXCELLENT';
    if (rating >= 4.0 && completionRate >= 90) return 'GOOD';
    if (rating >= 3.5 && completionRate >= 85) return 'AVERAGE';
    if (rating >= 3.0 && completionRate >= 80) return 'BELOW_AVERAGE';
    return 'POOR';
  }
}

// ==================== SCHEMA FACTORY ====================

export const UserSchema = SchemaFactory.createForClass(User);

// ==================== ÍNDICES ====================

// Índices básicos
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Índices para repartidores
UserSchema.index({ 'deliveryInfo.isAvailable': 1, role: 1 });
UserSchema.index({ 'deliveryInfo.isOnline': 1, role: 1 });
UserSchema.index({ 'deliveryInfo.status': 1, role: 1 });
UserSchema.index({ 'deliveryInfo.rating': -1 });
UserSchema.index({ 'deliveryInfo.currentActiveOrders': 1 });

// Índice geoespacial para ubicación de repartidores (CRÍTICO)
UserSchema.index({ 'deliveryInfo.currentLocation': '2dsphere' });

// Índice geoespacial para dirección del usuario
UserSchema.index({ 'address.coordinates': '2dsphere' });

// Índices para búsqueda
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Índices compuestos
UserSchema.index({ role: 1, isActive: 1, 'deliveryInfo.isAvailable': 1 });
UserSchema.index({ email: 1, isActive: 1 });

// Índices para seguridad
UserSchema.index({ emailVerificationToken: 1 }, { sparse: true });
UserSchema.index({ phoneVerificationCode: 1 }, { sparse: true });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true });
UserSchema.index({ refreshToken: 1 }, { sparse: true});

// ==================== VIRTUALS ====================

// Virtual para fullName
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual para isDelivery
UserSchema.virtual('isDelivery').get(function () {
  return this.role === UserRole.DELIVERY;
});

// Virtual para canDeliverNow
UserSchema.virtual('canDeliverNow').get(function () {
  if (this.role !== UserRole.DELIVERY || !this.deliveryInfo) {
    return false;
  }

  return (
    this.isActive &&
    this.deliveryInfo.isAvailable &&
    this.deliveryInfo.isOnline &&
    this.deliveryInfo.status === 'ACTIVE' &&
    this.deliveryInfo.currentActiveOrders < this.deliveryInfo.maxOrdersCapacity
  );
});

// Virtual para serviceQuality
UserSchema.virtual('serviceQuality').get(function () {
  if (this.role !== UserRole.DELIVERY || !this.deliveryInfo) {
    return null;
  }

  const rating = this.deliveryInfo.rating;
  const completionRate = this.deliveryInfo.completionRate;

  if (rating >= 4.5 && completionRate >= 95) return 'EXCELLENT';
  if (rating >= 4.0 && completionRate >= 90) return 'GOOD';
  if (rating >= 3.5 && completionRate >= 85) return 'AVERAGE';
  if (rating >= 3.0 && completionRate >= 80) return 'BELOW_AVERAGE';
  return 'POOR';
});

// ==================== MÉTODOS DE INSTANCIA ====================

// Método para verificar si el usuario puede iniciar sesión
UserSchema.methods.canLogin = function (): boolean {
  if (!this.isActive) return false;
  if (this.lockedUntil && this.lockedUntil > new Date()) return false;
  return true;
};

// Método para incrementar intentos de login
UserSchema.methods.incLoginAttempts = async function (): Promise<void> {
  // Si la cuenta está bloqueada y el tiempo ha expirado, reset
  if (this.lockedUntil && this.lockedUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockedUntil: 1 },
    });
    return;
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Bloquear cuenta después de 5 intentos fallidos
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 horas

  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    updates.$set = { lockedUntil: new Date(Date.now() + LOCK_TIME) };
  }

  await this.updateOne(updates);
};

// Método para resetear intentos de login
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockedUntil: 1 },
  });
};

// ==================== HOOKS/MIDDLEWARE ====================

// Pre-save hook: Convertir email a lowercase
UserSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-save hook: Actualizar fullName en metadata si existe
UserSchema.pre('save', function (next) {
  // Aquí podrías agregar lógica adicional antes de guardar
  next();
});

// ==================== CONFIGURACIÓN toJSON ====================

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Eliminar campos sensibles
    delete (ret as any).password;
    delete ret.refreshToken;
    delete ret.passwordHistory;
    delete ret.emailVerificationToken;
    delete ret.phoneVerificationCode;
    delete ret.passwordResetToken;
    delete (ret as any).__v;

    // Si es un repartidor, ocultar información sensible para clientes
    if (ret.deliveryInfo && ret.deliveryInfo.bankInfo) {
      // Solo ocultar si no es una petición del propio usuario o admin
      // Esta lógica se puede manejar mejor en el controller/service
      // ret.deliveryInfo.bankInfo = undefined;
    }

    return ret;
  },
});

// ==================== CONFIGURACIÓN toObject ====================

UserSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).password;
    delete ret.refreshToken;
    delete ret.passwordHistory;
    delete (ret as any).__v;
    return ret;
  },
});

// ==================== MÉTODOS ESTÁTICOS ====================

// Método estático para encontrar repartidores disponibles cerca de una ubicación
UserSchema.statics.findNearbyAvailableDeliveries = async function (
  lat: number,
  lng: number,
  maxDistanceKm: number = 10,
  limit: number = 20
) {
  return this.find({
    role: UserRole.DELIVERY,
    isActive: true,
    'deliveryInfo.isAvailable': true,
    'deliveryInfo.isOnline': true,
    'deliveryInfo.status': 'ACTIVE',
    'deliveryInfo.currentLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB usa [lng, lat]
        },
        $maxDistance: maxDistanceKm * 1000, // convertir a metros
      },
    },
    $expr: {
      $lt: [
        '$deliveryInfo.currentActiveOrders',
        '$deliveryInfo.maxOrdersCapacity',
      ],
    },
  })
    .limit(limit)
    .sort({ 'deliveryInfo.rating': -1 });
};

// Método estático para obtener estadísticas de repartidores
UserSchema.statics.getDeliveryStats = async function () {
  return this.aggregate([
    {
      $match: {
        role: UserRole.DELIVERY,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalDeliveries: { $sum: 1 },
        activeDeliveries: {
          $sum: {
            $cond: [{ $eq: ['$deliveryInfo.isOnline', true] }, 1, 0],
          },
        },
        availableDeliveries: {
          $sum: {
            $cond: [{ $eq: ['$deliveryInfo.isAvailable', true] }, 1, 0],
          },
        },
        averageRating: { $avg: '$deliveryInfo.rating' },
        totalCompletedDeliveries: { $sum: '$deliveryInfo.completedDeliveries' },
        totalEarnings: { $sum: '$deliveryInfo.totalEarnings' },
      },
    },
  ]);
};