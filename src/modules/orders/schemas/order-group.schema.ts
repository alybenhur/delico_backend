// src/modules/orders/schemas/order-group.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/common.enums';

@Schema({ _id: false })
export class OrderSummary {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  itemCount: number;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  status: string;
}

@Schema({ timestamps: true })
export class OrderGroup extends Document {
  @Prop({ required: true, unique: true })
  groupNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client: Types.ObjectId;

  @Prop({ type: [OrderSummary], required: true })
  orders: OrderSummary[];

  @Prop({ required: true })
  totalItems: number;

  @Prop({ required: true })
  totalAmount: number;

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

  @Prop({ default: '' })
  notes?: string;

  @Prop({ default: false })
  allDelivered: boolean;

  @Prop({ default: false })
  hasFailedOrders: boolean;
}

export const OrderGroupSchema = SchemaFactory.createForClass(OrderGroup);

// Índices
OrderGroupSchema.index({ groupNumber: 1 });
OrderGroupSchema.index({ client: 1, createdAt: -1 });
OrderGroupSchema.index({ paymentStatus: 1 });

// Configurar toJSON
OrderGroupSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});