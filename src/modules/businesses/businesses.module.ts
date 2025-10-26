// src/modules/businesses/businesses.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { Business, BusinessSchema } from './schemas/business.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService, MongooseModule],
})
export class BusinessesModule {}