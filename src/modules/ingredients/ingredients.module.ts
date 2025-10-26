// src/modules/ingredients/ingredients.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { Ingredient, IngredientSchema } from './schemas/ingredient.schema';
import { ProductsModule } from '../products/products.module';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ingredient.name, schema: IngredientSchema },
    ]),
    ProductsModule,
    BusinessesModule,
  ],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService, MongooseModule],
})
export class IngredientsModule {}