// src/modules/upload/upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../common/enums/common.enums';

@ApiTags('upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
@UseGuards(RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('product-image')
  @Roles(UserRole.BUSINESS, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({
    summary: 'Subir imagen de producto (BUSINESS o ADMIN)',
    description: 'Sube una imagen a Cloudinary y retorna la URL. Solo usuarios BUSINESS o ADMIN.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPG, PNG, WEBP - Máx 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imagen subida exitosamente',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido (tipo no permitido o tamaño excedido)',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para subir imágenes',
  })
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const result = await this.uploadService.uploadProductImage(file);

    return {
      url: result.url,
      publicId: result.publicId,
      message: 'Imagen subida exitosamente',
    };
  }
}