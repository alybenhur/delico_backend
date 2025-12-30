// src/modules/orders/schemas/order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../common/enums/common.enums';

@Schema({ _id: false })
export class OrderItemCustomization {
  @Prop({ type: [{ ingredient: Types.ObjectId, name: String }] })
  removedIngredients?: { ingredient: Types.ObjectId; name: string }[];

  @Prop({
    type: [
      {
        ingredient: Types.ObjectId,
        name: String,
        quantity: Number,
        pricePerUnit: Number,
        totalPrice: Number,
      },
    ],
  })
  addedIngredients?: {
    ingredient: Types.ObjectId;
    name: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }[];
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productPrice: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ type: OrderItemCustomization })
  customization?: OrderItemCustomization;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  customizationCost: number;

  @Prop({ required: true })
  itemTotal: number;

  @Prop({ default: '' })
  notes?: string;
}

@Schema({ _id: false })
export class OrderAddress {
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

  @Prop({
    type: { lat: Number, lng: Number },
    required: true,
  })
  coordinates: { lat: number; lng: number };

  @Prop({ default: '' })
  instructions?: string;
}

@Schema({ _id: false })
export class StatusHistory {
  @Prop({ required: true, enum: OrderStatus })
  status: OrderStatus;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ default: '' })
  note?: string;
}

@Schema({ _id: false })
export class OrderRating {
  @Prop({ min: 1, max: 5 })
  food?: number;

  @Prop({ min: 1, max: 5 })
  delivery?: number;

  @Prop({ default: '' })
  comment?: string;

  @Prop()
  ratedAt?: Date;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  delivery?: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  deliveryFee: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  promotionApplied?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ type: OrderAddress, required: true })
  deliveryAddress: OrderAddress;

  @Prop({ type: { lat: Number, lng: Number }, required: true })
  businessLocation: { lat: number; lng: number };

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];

  @Prop({ default: 30 })
  estimatedDeliveryTime: number;

  @Prop()
  estimatedDeliveryDate?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  preparingAt?: Date;

  @Prop()
  readyAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ type: { lat: Number, lng: Number, timestamp: Date } })
  currentLocation?: { lat: number; lng: number; timestamp: Date };

  // ✅ NUEVO: Ubicación donde se realizó la entrega (para auditoría)
  @Prop({
    type: {
      lat: Number,
      lng: Number,
      timestamp: Date,
      distanceFromTarget: Number,
    },
  })
  deliveredLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
    distanceFromTarget?: number; // Distancia en metros desde el punto objetivo
  };

  @Prop({ default: 0 })
  distanceRemaining?: number;

  @Prop({ default: 0 })
  timeRemaining?: number;

  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({ default: '' })
  paymentTransactionId?: string;

  @Prop({ type: OrderRating })
  rating?: OrderRating;

  @Prop({ default: '' })
  cancelledReason?: string;

  @Prop({ default: '' })
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Índices
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ client: 1, status: 1 });
OrderSchema.index({ business: 1, status: 1 });
OrderSchema.index({ delivery: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

// Configurar toJSON
OrderSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});