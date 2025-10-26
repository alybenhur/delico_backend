// src/modules/tracking/tracking.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import {
  UpdateLocationDto,
  UpdateTrackingStatusDto,
  TrackingResponseDto,
} from './dto/tracking.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../../common/enums/common.enums';

@ApiTags('tracking')
@ApiBearerAuth('JWT-auth')
@Controller('tracking')
@UseGuards(RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post(':orderId/start')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: 'Iniciar tracking (DELIVERY)' })
  @ApiResponse({
    status: 201,
    description: 'Tracking iniciado',
    type: TrackingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  startTracking(
    @Param('orderId') orderId: string,
    @CurrentUser('userId') deliveryId: string,
  ) {
    return this.trackingService.startTracking(orderId, deliveryId);
  }

  @Patch(':orderId/location')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: 'Actualizar ubicación (DELIVERY)' })
  @ApiResponse({ status: 200, description: 'Ubicación actualizada' })
  @ApiResponse({ status: 404, description: 'Tracking no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateLocation(
    @Param('orderId') orderId: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser('userId') deliveryId: string,
  ) {
    return this.trackingService.updateLocation(
      orderId,
      deliveryId,
      updateLocationDto,
    );
  }

  @Patch(':orderId/status')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: 'Actualizar estado del tracking (DELIVERY)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Tracking no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateTrackingStatusDto,
    @CurrentUser('userId') deliveryId: string,
  ) {
    return this.trackingService.updateStatus(orderId, deliveryId, updateStatusDto);
  }

  @Get(':orderId')
  @Public()
  @ApiOperation({ summary: 'Obtener tracking de una orden (público)' })
  @ApiResponse({
    status: 200,
    description: 'Tracking encontrado',
    type: TrackingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tracking no encontrado' })
  getTracking(@Param('orderId') orderId: string) {
    return this.trackingService.getTracking(orderId);
  }

  @Get(':orderId/route')
  @Public()
  @ApiOperation({ summary: 'Obtener ruta calculada (público)' })
  @ApiResponse({ status: 200, description: 'Ruta encontrada' })
  @ApiResponse({ status: 404, description: 'Tracking no encontrado' })
  getRoute(@Param('orderId') orderId: string) {
    return this.trackingService.getRoute(orderId);
  }
}