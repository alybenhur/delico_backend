// src/modules/businesses/schemas/business.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusinessType, BusinessStatus } from '../../../common/enums/common.enums';

@Schema({ timestamps: true })
export class Business extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, enum: BusinessType })
  type: BusinessType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ type: Object, required: true })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @Prop({ type: Object })
  schedule?: {
    monday?: { open: string; close: string; isClosed?: boolean };
    tuesday?: { open: string; close: string; isClosed?: boolean };
    wednesday?: { open: string; close: string; isClosed?: boolean };
    thursday?: { open: string; close: string; isClosed?: boolean };
    friday?: { open: string; close: string; isClosed?: boolean };
    saturday?: { open: string; close: string; isClosed?: boolean };
    sunday?: { open: string; close: string; isClosed?: boolean };
  };

  @Prop({ default: '' })
  logo?: string;

  @Prop({ default: '' })
  banner?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ required: true, enum: BusinessStatus, default: BusinessStatus.PENDING })
  status: BusinessStatus;

  @Prop({ default: 0, min: 0, max: 5 })
  rating?: number;

  @Prop({ default: 0, min: 0 })
  totalReviews?: number;

  @Prop({ default: 0, min: 0 })
  deliveryFee?: number;

  @Prop({ default: 0, min: 0 })
  minimumOrder?: number;

  @Prop({ default: 30, min: 0 })
  estimatedDeliveryTime?: number; // en minutos

  @Prop({ type: [String], default: [] })
  tags?: string[]; // ej: ['Pizza', 'Italiana', 'Delivery Rápido']
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

// Índices
BusinessSchema.index({ name: 'text', description: 'text' });
BusinessSchema.index({ owner: 1 });
BusinessSchema.index({ type: 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ 'address.city': 1 });
BusinessSchema.index({ rating: -1 });

// Configurar toJSON
BusinessSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});