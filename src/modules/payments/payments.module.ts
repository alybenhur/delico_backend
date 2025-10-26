// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PayUService } from './payu.service';

@Module({
  providers: [PayUService],
  exports: [PayUService],
})
export class PaymentsModule {}