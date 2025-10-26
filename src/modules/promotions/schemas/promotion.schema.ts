// src/modules/promotions/schemas/promotion.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PromotionType,
  PromotionStatus,
} from '../../../common/enums/common.enums';

@Schema({ timestamps: true })
export class Promotion extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Product' }],
    required: true,
  })
  products: Types.ObjectId[];

  @Prop({ required: true, enum: PromotionType })
  type: PromotionType;

  @Prop({ required: true, min: 0 })
  value: number; // Porcentaje (0-100) o valor fijo según el tipo

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: PromotionStatus,
    default: PromotionStatus.SCHEDULED,
  })
  status: PromotionStatus;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: '' })
  code?: string; // Código promocional opcional

  @Prop({ default: 0, min: 0 })
  minPurchase?: number; // Compra mínima requerida

  @Prop({ default: 0, min: 0 })
  maxDiscount?: number; // Descuento máximo (para porcentajes)

  @Prop({ default: 0, min: 0 })
  usageLimit?: number; // Límite de usos (0 = ilimitado)

  @Prop({ default: 0, min: 0 })
  usageCount?: number; // Contador de usos

  @Prop({ type: [String], default: [] })
  daysOfWeek?: string[]; // Días de la semana aplicables ['monday', 'tuesday', ...]

  @Prop({ type: String })
  startTime?: string; // Hora de inicio (HH:MM)

  @Prop({ type: String })
  endTime?: string; // Hora de fin (HH:MM)
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

// Índices
PromotionSchema.index({ business: 1, status: 1 });
PromotionSchema.index({ products: 1, status: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ code: 1 });
PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });

// Configurar toJSON
PromotionSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});