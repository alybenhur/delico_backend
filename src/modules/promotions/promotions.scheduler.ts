// src/modules/promotions/promotions.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PromotionsService } from './promotions.service';

@Injectable()
export class PromotionsScheduler {
  private readonly logger = new Logger(PromotionsScheduler.name);

  constructor(private readonly promotionsService: PromotionsService) {}

  /**
   * Tarea programada que se ejecuta cada hora
   * Actualiza automáticamente el estado de las promociones:
   * - Expira promociones vencidas (endDate < now)
   * - Activa promociones programadas (startDate <= now)
   * 
   * Zona horaria: America/Bogota
   * Frecuencia: Cada hora (0 * * * *)
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'update-promotions',
    timeZone: 'America/Bogota',
  })
  async handlePromotionUpdates() {
    const startTime = new Date();
    this.logger.log('🔄 Iniciando actualización automática de promociones...');

    try {
      // 1. Expirar promociones vencidas (ACTIVE/SCHEDULED → EXPIRED)
      const expired = await this.promotionsService.updateExpiredPromotions();
      
      if (expired.modifiedCount > 0) {
        this.logger.log(
          `✅ ${expired.modifiedCount} promoción(es) expirada(s) automáticamente`,
        );
      }

      // 2. Activar promociones programadas (SCHEDULED → ACTIVE)
      const activated = await this.promotionsService.activateScheduledPromotions();
      
      if (activated.modifiedCount > 0) {
        this.logger.log(
          `✅ ${activated.modifiedCount} promoción(es) activada(s) automáticamente`,
        );
      }

      // Resumen si no hubo cambios
      if (expired.modifiedCount === 0 && activated.modifiedCount === 0) {
        this.logger.log('ℹ️  No hay promociones para actualizar');
      }

      const duration = new Date().getTime() - startTime.getTime();
      this.logger.log(`✨ Actualización completada en ${duration}ms`);
      
      return {
        success: true,
        expired: expired.modifiedCount,
        activated: activated.modifiedCount,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        '❌ Error actualizando promociones automáticamente:',
        error,
      );
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Tarea adicional que se ejecuta a medianoche
   * Limpieza diaria para garantizar consistencia
   * 
   * Zona horaria: America/Bogota (medianoche en Colombia)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'daily-promotion-cleanup',
    timeZone: 'America/Bogota',
  })
  async handleDailyCleanup() {
    this.logger.log('🌙 Ejecutando limpieza diaria de promociones (medianoche Colombia)...');
    
    try {
      const [expired, activated] = await Promise.all([
        this.promotionsService.updateExpiredPromotions(),
        this.promotionsService.activateScheduledPromotions(),
      ]);

      this.logger.log(
        `✅ Limpieza completada: ${expired.modifiedCount} expiradas, ${activated.modifiedCount} activadas`,
      );

      return {
        success: true,
        expired: expired.modifiedCount,
        activated: activated.modifiedCount,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('❌ Error en limpieza diaria:', error);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Método público para ejecutar actualización manual
   * Usado por el endpoint de admin
   */
  async executeManualUpdate() {
    this.logger.log('🔧 Ejecución manual solicitada por administrador');
    return this.handlePromotionUpdates();
  }
}