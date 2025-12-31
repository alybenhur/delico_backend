// src/modules/upload/upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  private readonly folder: string;

  constructor(private configService: ConfigService) {
    this.folder = this.configService.get<string>('CLOUDINARY_FOLDER') || 'delico/products';
  }

  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo de imagen (Express.Multer.File)
   * @returns URL de la imagen subida y public_id
   */
  async uploadProductImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WEBP',
      );
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es demasiado grande. Tamaño máximo: 5MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: 'image',
          // Transformaciones automáticas
          transformation: [
            { width: 1024, height: 1024, crop: 'limit' }, // Máximo 1024x1024
            { quality: 'auto' }, // Calidad automática
            { fetch_format: 'auto' }, // Formato automático (WebP cuando sea posible)
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(new BadRequestException(`Error al subir imagen: ${error.message}`));
          }
          
          // ✅ Validar que result no sea undefined
          if (!result) {
            return reject(new BadRequestException('Error al subir imagen: respuesta vacía de Cloudinary'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      // Convertir buffer a stream y subir
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId - ID público de la imagen en Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Error al eliminar imagen de Cloudinary: ${error.message}`);
      // No lanzamos error para no bloquear otras operaciones
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param url - URL de Cloudinary
   * @returns public_id o null
   */
  extractPublicId(url: string): string | null {
    try {
      // URL típica: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
}