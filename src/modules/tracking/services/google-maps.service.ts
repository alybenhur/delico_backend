// src/modules/tracking/services/google-maps.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  DirectionsRequest,
  TravelMode,
} from '@googlemaps/google-maps-services-js';

export interface RouteInfo {
  distance: number; // metros
  duration: number; // segundos
  polyline: string; // Ruta codificada
}

@Injectable()
export class GoogleMapsService {
  private client: Client;
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
  }

  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteInfo> {
    try {
      const request: DirectionsRequest = {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: TravelMode.driving,
          key: this.apiKey,
        },
      };

      const response = await this.client.directions(request);

      if (response.data.routes.length === 0) {
        throw new Error('No se encontró ruta');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value, // metros
        duration: leg.duration.value, // segundos
        polyline: route.overview_polyline.points,
      };
    } catch (error) {
      console.error('Error calculando ruta:', error);
      // Fallback: cálculo simple en línea recta
      const distance = this.calculateDistanceInMeters(origin, destination);
      const duration = Math.ceil(distance / 8.33); // Asumiendo 30 km/h promedio

      return {
        distance,
        duration,
        polyline: '',
      };
    }
  }

  calculateDistanceInMeters(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  calculateETA(distanceInMeters: number, averageSpeedKmh: number = 30): number {
    // Retorna minutos
    const distanceInKm = distanceInMeters / 1000;
    const timeInHours = distanceInKm / averageSpeedKmh;
    return Math.ceil(timeInHours * 60);
  }
}