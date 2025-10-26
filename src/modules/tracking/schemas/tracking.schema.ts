// src/modules/tracking/schemas/tracking.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackingStatus } from '../../../common/enums/common.enums';

@Schema({ _id: false })
export class LocationPoint {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: 0 })
  accuracy?: number;

  @Prop({ default: 0 })
  speed?: number;

  @Prop({ default: 0 })
  heading?: number;
}

@Schema({ _id: false })
export class Route {
  @Prop({ type: { lat: Number, lng: Number }, required: true })
  origin: { lat: number; lng: number };

  @Prop({ type: { lat: Number, lng: Number }, required: true })
  destination: { lat: number; lng: number };

  @Prop({ required: true })
  distance: number;

  @Prop({ required: true })
  estimatedDuration: number;

  @Prop({ default: '' })
  polyline?: string;
}

@Schema({ timestamps: true })
export class Tracking extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  delivery: Types.ObjectId;

  @Prop({ type: Route, required: true })
  route: Route;

  @Prop({ type: [LocationPoint], default: [] })
  locations: LocationPoint[];

  @Prop({
    required: true,
    enum: TrackingStatus,
    default: TrackingStatus.GOING_TO_BUSINESS,
  })
  status: TrackingStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  arrivedAtBusinessAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  arrivedAtClientAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const TrackingSchema = SchemaFactory.createForClass(Tracking);

// Índices
TrackingSchema.index({ order: 1 });
TrackingSchema.index({ delivery: 1, status: 1 });
TrackingSchema.index({ 'locations.timestamp': -1 });

// Configurar toJSON
TrackingSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});