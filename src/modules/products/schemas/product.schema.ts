// src/modules/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  ProductType,
  ProductStatus,
  MeasurementUnit,
} from '../../../common/enums/common.enums';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ required: true, enum: ProductType })
  type: ProductType;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ required: true, enum: MeasurementUnit, default: MeasurementUnit.UNIT })
  measurementUnit: MeasurementUnit;

  @Prop({ default: 1, min: 0 })
  quantity?: number; // Cantidad por unidad (ej: 1 litro, 0.5 kg)

  @Prop({ required: true })
  image: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({
    required: true,
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  status: ProductStatus;

  @Prop({ default: false })
  isCustomizable: boolean;

  @Prop({ default: 0, min: 0, max: 5 })
  rating?: number;

  @Prop({ default: 0, min: 0 })
  totalReviews?: number;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: 0 })
  order?: number; // Para ordenar productos en el menú

  // Información nutricional (opcional)
  @Prop({ type: Object })
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };

  // Para control de inventario (opcional)
  @Prop({ type: Number })
  stock?: number;

  @Prop({ default: false })
  trackInventory?: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índices
ProductSchema.index({ business: 1, category: 1 });
ProductSchema.index({ business: 1, status: 1 });
ProductSchema.index({ business: 1, type: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ rating: -1 });

// Configurar toJSON
ProductSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});