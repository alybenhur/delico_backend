// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Schedule para tareas automáticas (cron jobs)
    ScheduleModule.forRoot(),

    // Configuración de MongoDB con Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Módulo de Health Check


    // Módulos de autenticación y usuarios
    UsersModule,
    AuthModule,

    // Módulo de Negocios
    BusinessesModule,

    // Módulos de Productos y Categorías
    CategoriesModule,
    ProductsModule,

    // Módulo de Ingredientes
    IngredientsModule,

    // Módulo de Promociones
    PromotionsModule,

    // Módulo de Pedidos
    OrdersModule,

    // Módulo de Tracking y Geolocalización
    TrackingModule,

    // Módulo de Pagos
    PaymentsModule,

    // 🎉 ¡Sistema completo implementado!
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}