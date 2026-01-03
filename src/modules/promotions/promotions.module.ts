// src/modules/promotions/promotions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { Promotion, PromotionSchema } from './schemas/promotion.schema';
import { ProductsModule } from '../products/products.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PromotionsScheduler } from './promotions.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
    ]),
    ProductsModule,
    BusinessesModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService,PromotionsScheduler,],
  exports: [PromotionsService, MongooseModule],
})
export class PromotionsModule {}