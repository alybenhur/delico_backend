// src/modules/ingredients/schemas/ingredient.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IngredientStatus } from '../../../common/enums/common.enums';

@Schema({ timestamps: true })
export class Ingredient extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ required: true, default: false })
  isBase: boolean; // Ingrediente incluido por defecto

  @Prop({ required: true, default: true })
  isRemovable: boolean; // Se puede quitar del producto

  @Prop({ required: true, default: false })
  isOptional: boolean; // Se puede agregar al producto

  @Prop({ required: true, default: 0, min: 0 })
  additionalPrice: number; // Precio adicional si se agrega

  @Prop({
    required: true,
    enum: IngredientStatus,
    default: IngredientStatus.AVAILABLE,
  })
  status: IngredientStatus;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: 0 })
  order?: number; // Para ordenar ingredientes en la UI

  // Para ingredientes opcionales con cantidad
  @Prop({ default: 1, min: 0 })
  maxQuantity?: number; // Máximo que se puede agregar (0 = ilimitado)

  @Prop({ default: 1, min: 1 })
  defaultQuantity?: number; // Cantidad por defecto
}

export const IngredientSchema = SchemaFactory.createForClass(Ingredient);

// Índices
IngredientSchema.index({ product: 1, business: 1 });
IngredientSchema.index({ business: 1, status: 1 });
IngredientSchema.index({ product: 1, isBase: 1 });
IngredientSchema.index({ product: 1, isOptional: 1 });
IngredientSchema.index({ product: 1, order: 1 });

// Configurar toJSON
IngredientSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});