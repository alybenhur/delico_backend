// src/modules/tracking/tracking.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TrackingGateway } from './tracking.gateway';
import { Tracking, TrackingSchema } from './schemas/tracking.schema';
import { GoogleMapsService } from './services/google-maps.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tracking.name, schema: TrackingSchema },
    ]),
    OrdersModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway, GoogleMapsService],
  exports: [TrackingService, TrackingGateway, GoogleMapsService],
})
export class TrackingModule {}