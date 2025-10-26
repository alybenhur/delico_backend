// src/modules/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order?: number; // Para ordenar las categorías en el menú
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Índices
CategorySchema.index({ business: 1, name: 1 }, { unique: true });
CategorySchema.index({ business: 1, isActive: 1 });
CategorySchema.index({ business: 1, order: 1 });

// Configurar toJSON
CategorySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});