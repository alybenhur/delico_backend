// src/modules/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryProvider],
  exports: [UploadService], // Exportar para usar en otros módulos
})
export class UploadModule {}