// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductsModule } from '../products/products.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { UsersModule } from '../users/users.module';
// import { OrderGroup, OrderGroupSchema } from './schemas/order-group.schema';
 //{ name: OrderGroup.name, schema: OrderGroupSchema },
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }
      
    ]),
    ProductsModule,
    BusinessesModule,
    IngredientsModule,
    PromotionsModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}