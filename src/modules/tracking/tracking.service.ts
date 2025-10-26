// src/modules/tracking/tracking.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tracking } from './schemas/tracking.schema';
import { Order } from '../orders/schemas/order.schema';
import { UpdateLocationDto, UpdateTrackingStatusDto } from './dto/tracking.dto';
import { GoogleMapsService } from './services/google-maps.service';
import { TrackingStatus, OrderStatus } from '../../common/enums/common.enums';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(Tracking.name) private readonly trackingModel: Model<Tracking>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  async startTracking(orderId: string, deliveryId: string): Promise<Tracking> {
    // Validar orden
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Validar que el repartidor es el asignado
    if (order.delivery?.toString() !== deliveryId) {
      throw new BadRequestException(
        'Este repartidor no está asignado a esta orden',
      );
    }

    // Validar estado de la orden
    if (order.status !== OrderStatus.PICKUP) {
      throw new BadRequestException(
        'Solo se puede iniciar tracking cuando el pedido está en estado PICKUP',
      );
    }

    // Verificar si ya existe tracking
    let tracking = await this.trackingModel.findOne({ order: order._id });

    if (tracking) {
      // Ya existe, actualizar
      tracking.status = TrackingStatus.GOING_TO_CLIENT;
      tracking.startedAt = new Date();
    } else {
      // Calcular ruta
      const route = await this.googleMapsService.calculateRoute(
        order.businessLocation,
        order.deliveryAddress.coordinates,
      );

      // Crear nuevo tracking
      tracking = new this.trackingModel({
        order: order._id,
        delivery: new Types.ObjectId(deliveryId),
        route: {
          origin: order.businessLocation,
          destination: order.deliveryAddress.coordinates,
          distance: route.distance,
          estimatedDuration: route.duration,
          polyline: route.polyline,
        },
        status: TrackingStatus.GOING_TO_CLIENT,
        startedAt: new Date(),
        pickedUpAt: new Date(),
      });
    }

    // Actualizar orden
    order.status = OrderStatus.IN_TRANSIT;
    order.distanceRemaining = tracking.route.distance;
    order.timeRemaining = Math.ceil(tracking.route.estimatedDuration / 60);

    order.statusHistory.push({
      status: OrderStatus.IN_TRANSIT,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(deliveryId),
      note: 'Repartidor en camino',
    } as any);

    await Promise.all([tracking.save(), order.save()]);

    return tracking;
  }

  async updateLocation(
    orderId: string,
    deliveryId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Tracking> {
    const tracking = await this.trackingModel.findOne({ order: orderId });

    if (!tracking) {
      throw new NotFoundException('Tracking no encontrado');
    }

    // Validar que es el repartidor correcto
    if (tracking.delivery.toString() !== deliveryId) {
      throw new BadRequestException('No autorizado para actualizar esta ubicación');
    }

    // Agregar nueva ubicación al historial
    tracking.locations.push({
      lat: updateLocationDto.lat,
      lng: updateLocationDto.lng,
      timestamp: new Date(),
      accuracy: updateLocationDto.accuracy,
      speed: updateLocationDto.speed,
      heading: updateLocationDto.heading,
    } as any);

    // Actualizar orden con ubicación actual
    const order = await this.orderModel.findById(orderId);
    if (order) {
      order.currentLocation = {
        lat: updateLocationDto.lat,
        lng: updateLocationDto.lng,
        timestamp: new Date(),
      };

      // Calcular distancia restante
      const distanceRemaining = this.googleMapsService.calculateDistanceInMeters(
        { lat: updateLocationDto.lat, lng: updateLocationDto.lng },
        tracking.route.destination,
      );

      order.distanceRemaining = distanceRemaining;

      // Calcular tiempo restante basado en velocidad actual o promedio
      const speedKmh = updateLocationDto.speed || 30;
      order.timeRemaining = this.googleMapsService.calculateETA(
        distanceRemaining,
        speedKmh,
      );

      await order.save();
    }

    return tracking.save();
  }

  async updateStatus(
    orderId: string,
    deliveryId: string,
    updateStatusDto: UpdateTrackingStatusDto,
  ): Promise<Tracking> {
    const tracking = await this.trackingModel.findOne({ order: orderId });

    if (!tracking) {
      throw new NotFoundException('Tracking no encontrado');
    }

    // Validar que es el repartidor correcto
    if (tracking.delivery.toString() !== deliveryId) {
      throw new BadRequestException('No autorizado');
    }

    tracking.status = updateStatusDto.status;

    // Actualizar timestamps
    const now = new Date();
    switch (updateStatusDto.status) {
      case TrackingStatus.AT_BUSINESS:
        tracking.arrivedAtBusinessAt = now;
        break;
      case TrackingStatus.GOING_TO_CLIENT:
        tracking.pickedUpAt = now;
        break;
      case TrackingStatus.ARRIVED:
        tracking.arrivedAtClientAt = now;
        tracking.completedAt = now;
        break;
    }

    return tracking.save();
  }

  async getTracking(orderId: string): Promise<any> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('ID de orden inválido');
    }

    const tracking = await this.trackingModel
      .findOne({ order: orderId })
      .populate('delivery', 'firstName lastName phone');

    if (!tracking) {
      throw new NotFoundException('Tracking no encontrado para esta orden');
    }

    const order = await this.orderModel.findById(orderId);

    // Obtener última ubicación
    const lastLocation = tracking.locations[tracking.locations.length - 1];

    return {
      _id: tracking.id,
      order: tracking.order,
      delivery: tracking.delivery,
      route: tracking.route,
      currentLocation: lastLocation
        ? {
            lat: lastLocation.lat,
            lng: lastLocation.lng,
            timestamp: lastLocation.timestamp,
            accuracy: lastLocation.accuracy,
            speed: lastLocation.speed,
            heading: lastLocation.heading,
          }
        : null,
      status: tracking.status,
      distanceRemaining: order?.distanceRemaining || 0,
      timeRemaining: order?.timeRemaining || 0,
      startedAt: tracking.startedAt,
      arrivedAtBusinessAt: tracking.arrivedAtBusinessAt,
      pickedUpAt: tracking.pickedUpAt,
      arrivedAtClientAt: tracking.arrivedAtClientAt,
      createdAt: (tracking as any).createdAt,
      updatedAt: (tracking as any).updatedAt,
    };
  }

  async getRoute(orderId: string): Promise<any> {
    const tracking = await this.trackingModel.findOne({ order: orderId });

    if (!tracking) {
      throw new NotFoundException('Tracking no encontrado');
    }

    return {
      route: tracking.route,
      locations: tracking.locations,
    };
  }
}