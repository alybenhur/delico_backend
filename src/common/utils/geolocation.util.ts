// src/common/utils/geolocation.util.ts

/**
 * Calcular distancia entre dos puntos usando fórmula de Haversine
 * @param lat1 Latitud del punto 1
 * @param lng1 Longitud del punto 1
 * @param lat2 Latitud del punto 2
 * @param lng2 Longitud del punto 2
 * @returns Distancia en metros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Validar si un punto está dentro del rango permitido
 * @param deliveryLat Latitud del delivery
 * @param deliveryLng Longitud del delivery
 * @param targetLat Latitud del destino
 * @param targetLng Longitud del destino
 * @param maxDistanceMeters Distancia máxima permitida en metros (default: 5)
 * @returns { isValid, distance }
 */
export function validateDeliveryLocation(
  deliveryLat: number,
  deliveryLng: number,
  targetLat: number,
  targetLng: number,
  maxDistanceMeters: number = 5,
): { isValid: boolean; distance: number } {
  const distance = calculateDistance(
    deliveryLat,
    deliveryLng,
    targetLat,
    targetLng,
  );

  return {
    isValid: distance <= maxDistanceMeters,
    distance: Math.round(distance * 100) / 100, // Redondear a 2 decimales
  };
}

/**
 * Formatear distancia para mostrar al usuario
 * @param meters Distancia en metros
 * @returns String formateado (ej: "2.5m" o "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)}m`;
  } else {
    return `${(meters / 1000).toFixed(2)}km`;
  }
}