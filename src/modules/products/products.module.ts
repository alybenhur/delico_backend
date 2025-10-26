import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { Promotion, PromotionSchema } from '../promotions/schemas/promotion.schema';

@Module({
   imports: [
      MongooseModule.forFeature([
        { name: Product.name, schema: ProductSchema },
         { name: Ingredient.name, schema: IngredientSchema },
      { name: Promotion.name, schema: PromotionSchema },
      ]),
      ProductsModule,
    ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService, MongooseModule],
})
export class ProductsModule {}
