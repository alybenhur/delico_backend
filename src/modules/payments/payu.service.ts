// src/modules/payments/payu.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  buyerEmail: string;
  buyerFullName: string;
  referenceCode: string;
}

export interface PaymentResponse {
  transactionId: string;
  state: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';
  responseCode: string;
  responseMessage: string;
  paymentUrl?: string;
}

@Injectable()
export class PayUService {
  private merchantId: string;
  private apiKey: string;
  private apiLogin: string;
  private accountId: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>('PAYU_MERCHANT_ID') || '';
    this.apiKey = this.configService.get<string>('PAYU_API_KEY') || '';
    this.apiLogin = this.configService.get<string>('PAYU_API_LOGIN') || '';
    this.accountId = this.configService.get<string>('PAYU_ACCOUNT_ID') || '';
    this.baseUrl = this.configService.get<string>('PAYU_BASE_URL') || '';
  }

  generateSignature(
    referenceCode: string,
    amount: number,
    currency: string = 'COP',
  ): string {
    const signatureString = `${this.apiKey}~${this.merchantId}~${referenceCode}~${amount}~${currency}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  async createPayment(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentResponse> {
    try {
      const signature = this.generateSignature(
        paymentRequest.referenceCode,
        paymentRequest.amount,
      );

      const payload = {
        language: 'es',
        command: 'SUBMIT_TRANSACTION',
        merchant: {
          apiKey: this.apiKey,
          apiLogin: this.apiLogin,
        },
        transaction: {
          order: {
            accountId: this.accountId,
            referenceCode: paymentRequest.referenceCode,
            description: paymentRequest.description,
            language: 'es',
            signature: signature,
            notifyUrl: `${process.env.APP_URL}/api/v1/payments/webhook`,
            additionalValues: {
              TX_VALUE: {
                value: paymentRequest.amount,
                currency: 'COP',
              },
            },
            buyer: {
              emailAddress: paymentRequest.buyerEmail,
              fullName: paymentRequest.buyerFullName,
            },
          },
          type: 'AUTHORIZATION_AND_CAPTURE',
          paymentMethod: 'PSE', // Método de pago por defecto
          paymentCountry: 'CO',
        },
        test: this.baseUrl.includes('sandbox'), // true si es sandbox
      };

      const response = await axios.post(
        `${this.baseUrl}/payments-api/4.0/service.cgi`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      const transactionResponse = response.data.transactionResponse;

      return {
        transactionId: transactionResponse.transactionId,
        state: transactionResponse.state,
        responseCode: transactionResponse.responseCode,
        responseMessage: transactionResponse.responseMessage,
        paymentUrl: transactionResponse.extraParameters?.BANK_URL,
      };
    } catch (error: any) {
      console.error('Error en PayU:', error.response?.data || error.message);
      return {
        transactionId: '',
        state: 'ERROR',
        responseCode: 'ERROR',
        responseMessage: error.message,
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const payload = {
        language: 'es',
        command: 'ORDER_DETAIL_BY_REFERENCE_CODE',
        merchant: {
          apiKey: this.apiKey,
          apiLogin: this.apiLogin,
        },
        details: {
          referenceCode: transactionId,
        },
        test: this.baseUrl.includes('sandbox'),
      };

      const response = await axios.post(
        `${this.baseUrl}/payments-api/4.0/service.cgi`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      const result = response.data.result;
      const transaction = result?.payload?.[0]?.transactions?.[0];

      if (!transaction) {
        throw new Error('Transacción no encontrada');
      }

      return {
        transactionId: transaction.id,
        state: transaction.transactionResponse.state,
        responseCode: transaction.transactionResponse.responseCode,
        responseMessage: transaction.transactionResponse.responseMessage,
      };
    } catch (error: any) {
      console.error('Error verificando pago:', error);
      return {
        transactionId: '',
        state: 'ERROR',
        responseCode: 'ERROR',
        responseMessage: error.message,
      };
    }
  }

  validateSignature(
    signature: string,
    referenceCode: string,
    amount: number,
    state: string,
  ): boolean {
    const expectedSignature = crypto
      .createHash('md5')
      .update(
        `${this.apiKey}~${this.merchantId}~${referenceCode}~${amount}~COP~${state}`,
      )
      .digest('hex');

    return signature === expectedSignature;
  }
}