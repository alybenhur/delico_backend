// src/modules/upload/dto/upload-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/delico/products/abc123.jpg',
    description: 'URL segura de la imagen subida',
  })
  url: string;

  @ApiProperty({
    example: 'delico/products/abc123',
    description: 'ID público de la imagen en Cloudinary',
  })
  publicId: string;

  @ApiProperty({
    example: 'Imagen subida exitosamente',
    description: 'Mensaje de éxito',
  })
  message: string;
}