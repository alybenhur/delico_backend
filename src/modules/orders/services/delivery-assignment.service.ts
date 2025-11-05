// src/modules/orders/services/delivery-assignment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { OrderGroup } from '../schemas/order-group.schema';
import { User } from '../../users/schemas/user.schema';
import { Tracking } from '../../tracking/schemas/tracking.schema';
import { UserRole, OrderStatus, TrackingStatus } from '../../../common/enums/common.enums';

// ==================== INTERFACES ====================

interface DeliveryLocation {
  lat: number;
  lng: number;
}

interface BusinessPickupPoint {
  businessId: Types.ObjectId;
  orderId: Types.ObjectId;
  orderNumber: string;
  location: DeliveryLocation;
  estimatedPrepTime: number;
  itemCount: number;
}

interface DeliveryCluster {
  orders: Types.ObjectId[];
  businesses: BusinessPickupPoint[];
  centroid: DeliveryLocation;
  maxDistance: number;
  totalEstimatedTime: number;
  recommendedDelivery?: Types.ObjectId;
}

export enum AssignmentStrategy {
  INDIVIDUAL = 'INDIVIDUAL',     // 1 orden = 1 repartidor
  GROUPED = 'GROUPED',            // Todas las órdenes = 1 repartidor
  HYBRID = 'HYBRID',              // Clusters inteligentes
  SEQUENTIAL = 'SEQUENTIAL',      // Asignación secuencial (cuando no hay suficientes repartidores)
}

interface AssignmentResult {
  strategy: AssignmentStrategy;
  assignments: DeliveryAssignment[];
  reason: string;
  metrics: {
    totalOrders: number;
    deliveriesUsed: number;
    averageOrdersPerDelivery: number;
    estimatedTotalTime: number;
    costEfficiency: number; // 0-100
  };
}

interface DeliveryAssignment {
  deliveryId: Types.ObjectId;
  orders: Types.ObjectId[];
  route: {
    pickupPoints: BusinessPickupPoint[];
    deliveryPoint: DeliveryLocation;
    optimizedSequence: number[];
    totalDistance: number;
    estimatedTime: number;
  };
  priority: number; // 1-5
}

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  MAX_ORDERS_PER_DELIVERY: 4,           // Máximo de órdenes por repartidor
  MAX_DISTANCE_FOR_GROUPING: 3,         // km - distancia máxima entre negocios
  MAX_ADDITIONAL_WAIT_TIME: 20,         // minutos - tiempo adicional tolerado
  MAX_DELIVERY_RADIUS: 10,              // km - radio máximo de entrega
  MIN_ORDERS_FOR_HYBRID: 3,             // Mínimo de órdenes para considerar híbrido
  DELIVERY_SEARCH_RADIUS: 15,           // km - radio para buscar repartidores
  PRIORITY_WEIGHT: {
    DISTANCE: 0.4,                      // Peso de distancia en priorización
    TIME: 0.3,                          // Peso de tiempo de preparación
    ORDER_COUNT: 0.2,                   // Peso de cantidad de órdenes
    DELIVERY_WORKLOAD: 0.1,             // Peso de carga actual del repartidor
  },
};

@Injectable()
export class DeliveryAssignmentService {
  private readonly logger = new Logger(DeliveryAssignmentService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(OrderGroup.name) private orderGroupModel: Model<OrderGroup>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tracking.name) private trackingModel: Model<Tracking>,
  ) {}

  // ==================== MÉTODO PRINCIPAL ====================

  /**
   * Asigna repartidores a un grupo de órdenes de manera inteligente
   */
  async assignDeliveriesForOrderGroup(
    orderGroupId: string,
  ): Promise<AssignmentResult> {
    this.logger.log(`Iniciando asignación para OrderGroup: ${orderGroupId}`);

    // 1. Obtener el grupo de órdenes y las órdenes individuales
    const orderGroup = await this.orderGroupModel
      .findById(orderGroupId)
      .populate('client');

    if (!orderGroup) {
      throw new Error('OrderGroup no encontrado');
    }

    const orders = await this.orderModel
      .find({ _id: { $in: orderGroup.orders.map(o => o.orderId) } })
      .populate('business');

    if (orders.length === 0) {
      throw new Error('No se encontraron órdenes');
    }

    // 2. Analizar el escenario y decidir estrategia
    const scenario = await this.analyzeScenario(orders);
    this.logger.debug(`Escenario analizado:`, scenario);

    // 3. Buscar repartidores disponibles
    const deliveryPoint = orders[0].deliveryAddress.coordinates;
    const availableDeliveries = await this.findAvailableDeliveries(
      deliveryPoint,
      scenario.totalOrders,
    );

    if (availableDeliveries.length === 0) {
      throw new Error('No hay repartidores disponibles en este momento');
    }

    // 4. Aplicar estrategia de asignación
    let assignmentResult: AssignmentResult;

    switch (scenario.recommendedStrategy) {
      case AssignmentStrategy.INDIVIDUAL:
        assignmentResult = await this.assignIndividual(orders, availableDeliveries);
        break;
      case AssignmentStrategy.GROUPED:
        assignmentResult = await this.assignGrouped(orders, availableDeliveries);
        break;
      case AssignmentStrategy.HYBRID:
        assignmentResult = await this.assignHybrid(orders, availableDeliveries);
        break;
      default:
        assignmentResult = await this.assignSequential(orders, availableDeliveries);
    }

    // 5. Guardar asignaciones en la base de datos
    await this.saveAssignments(assignmentResult.assignments);

    this.logger.log(
      `Asignación completada: ${assignmentResult.strategy} - ${assignmentResult.assignments.length} repartidores`,
    );

    return assignmentResult;
  }

  // ==================== ANÁLISIS DE ESCENARIO ====================

  private async analyzeScenario(orders: Order[]) {
    const businessLocations = orders.map(order => ({
      businessId: order.business._id as Types.ObjectId,
      orderId: order._id as Types.ObjectId,
      orderNumber: order.orderNumber,
      location: order.businessLocation,
      estimatedPrepTime: order.estimatedDeliveryTime || 30,
      itemCount: order.items.length,
    }));

    // Calcular distancias entre todos los negocios
    const distances = this.calculateDistanceMatrix(businessLocations);
    const maxDistance = Math.max(...distances.flat());
    const avgDistance = distances.flat().reduce((a, b) => a + b, 0) / distances.flat().length;

    // Calcular diferencias de tiempo de preparación
    const prepTimes = businessLocations.map(b => b.estimatedPrepTime);
    const maxPrepTime = Math.max(...prepTimes);
    const minPrepTime = Math.min(...prepTimes);
    const prepTimeDiff = maxPrepTime - minPrepTime;

    // Decidir estrategia
    let recommendedStrategy: AssignmentStrategy;
    let reason: string;

    if (orders.length === 1) {
      recommendedStrategy = AssignmentStrategy.INDIVIDUAL;
      reason = 'Una sola orden - asignación directa';
    } else if (
      maxDistance > CONFIG.MAX_DISTANCE_FOR_GROUPING ||
      prepTimeDiff > CONFIG.MAX_ADDITIONAL_WAIT_TIME
    ) {
      recommendedStrategy = AssignmentStrategy.INDIVIDUAL;
      reason = `Negocios muy dispersos (${maxDistance.toFixed(2)}km) o tiempos muy diferentes (${prepTimeDiff}min)`;
    } else if (
      orders.length <= CONFIG.MIN_ORDERS_FOR_HYBRID &&
      avgDistance <= CONFIG.MAX_DISTANCE_FOR_GROUPING
    ) {
      recommendedStrategy = AssignmentStrategy.GROUPED;
      reason = `Pocos negocios cercanos (${orders.length} órdenes, ${avgDistance.toFixed(2)}km promedio)`;
    } else {
      recommendedStrategy = AssignmentStrategy.HYBRID;
      reason = `Múltiples órdenes con posibilidad de agrupación inteligente (${orders.length} órdenes)`;
    }

    return {
      totalOrders: orders.length,
      businessLocations,
      maxDistance,
      avgDistance,
      prepTimeDiff,
      recommendedStrategy,
      reason,
    };
  }

  // ==================== ESTRATEGIAS DE ASIGNACIÓN ====================

  /**
   * Estrategia INDIVIDUAL: 1 orden = 1 repartidor
   */
  private async assignIndividual(
    orders: Order[],
    availableDeliveries: User[],
  ): Promise<AssignmentResult> {
    const assignments: DeliveryAssignment[] = [];

    for (let i = 0; i < orders.length && i < availableDeliveries.length; i++) {
      const order = orders[i];
      const delivery = availableDeliveries[i];

      const assignment: DeliveryAssignment = {
        deliveryId: delivery._id as Types.ObjectId,
        orders: [order._id as Types.ObjectId],
        route: {
          pickupPoints: [{
            businessId: order.business._id as Types.ObjectId,
            orderId: order._id as Types.ObjectId,
            orderNumber: order.orderNumber,
            location: order.businessLocation,
            estimatedPrepTime: order.estimatedDeliveryTime || 30,
            itemCount: order.items.length,
          }],
          deliveryPoint: order.deliveryAddress.coordinates,
          optimizedSequence: [0],
          totalDistance: this.calculateDistance(
            order.businessLocation,
            order.deliveryAddress.coordinates,
          ),
          estimatedTime: order.estimatedDeliveryTime || 30,
        },
        priority: this.calculatePriority(order, delivery, 1),
      };

      assignments.push(assignment);
    }

    return {
      strategy: AssignmentStrategy.INDIVIDUAL,
      assignments,
      reason: 'Asignación individual por dispersión geográfica o diferencias de tiempo',
      metrics: this.calculateMetrics(assignments, orders.length),
    };
  }

  /**
   * Estrategia GROUPED: Todas las órdenes a 1 repartidor
   */
  private async assignGrouped(
    orders: Order[],
    availableDeliveries: User[],
  ): Promise<AssignmentResult> {
    const delivery = await this.selectBestDeliveryForCluster(
      orders,
      availableDeliveries,
    );

    const pickupPoints: BusinessPickupPoint[] = orders.map(order => ({
      businessId: order.business._id as Types.ObjectId,
      orderId: order._id as Types.ObjectId,
      orderNumber: order.orderNumber,
      location: order.businessLocation,
      estimatedPrepTime: order.estimatedDeliveryTime || 30,
      itemCount: order.items.length,
    }));

    const optimizedRoute = this.optimizeRoute(
      pickupPoints,
      orders[0].deliveryAddress.coordinates,
    );

    const assignment: DeliveryAssignment = {
      deliveryId: delivery._id as Types.ObjectId,
      orders: orders.map(o => o._id as Types.ObjectId),
      route: optimizedRoute,
      priority: this.calculatePriority(orders[0], delivery, orders.length),
    };

    return {
      strategy: AssignmentStrategy.GROUPED,
      assignments: [assignment],
      reason: 'Negocios cercanos - agrupación eficiente en un solo repartidor',
      metrics: this.calculateMetrics([assignment], orders.length),
    };
  }

  /**
   * Estrategia HYBRID: Clustering inteligente
   */
  private async assignHybrid(
    orders: Order[],
    availableDeliveries: User[],
  ): Promise<AssignmentResult> {
    // 1. Crear clusters usando K-means espacial
    const clusters = this.createClusters(orders, Math.min(
      Math.ceil(orders.length / 2),
      availableDeliveries.length,
      CONFIG.MAX_ORDERS_PER_DELIVERY,
    ));

    // 2. Asignar un repartidor a cada cluster
    const assignments: DeliveryAssignment[] = [];

    for (const cluster of clusters) {
      const clusterOrders = orders.filter(o => 
        cluster.orders.some(orderId => orderId.equals(o._id as Types.ObjectId))
      );

      const delivery = await this.selectBestDeliveryForCluster(
        clusterOrders,
        availableDeliveries.filter(d => 
          !assignments.some(a => a.deliveryId.equals(d._id as Types.ObjectId))
        ),
      );

      const pickupPoints: BusinessPickupPoint[] = clusterOrders.map(order => ({
        businessId: order.business._id as Types.ObjectId,
        orderId: order._id as Types.ObjectId,
        orderNumber: order.orderNumber,
        location: order.businessLocation,
        estimatedPrepTime: order.estimatedDeliveryTime || 30,
        itemCount: order.items.length,
      }));

      const optimizedRoute = this.optimizeRoute(
        pickupPoints,
        clusterOrders[0].deliveryAddress.coordinates,
      );

      assignments.push({
        deliveryId: delivery._id as Types.ObjectId,
        orders: cluster.orders,
        route: optimizedRoute,
        priority: this.calculatePriority(clusterOrders[0], delivery, clusterOrders.length),
      });
    }

    return {
      strategy: AssignmentStrategy.HYBRID,
      assignments,
      reason: `Agrupación inteligente en ${clusters.length} clusters`,
      metrics: this.calculateMetrics(assignments, orders.length),
    };
  }

  /**
   * Estrategia SEQUENTIAL: Cuando no hay suficientes repartidores
   */
  private async assignSequential(
    orders: Order[],
    availableDeliveries: User[],
  ): Promise<AssignmentResult> {
    // Similar a GROUPED pero puede asignar más órdenes de las recomendadas
    return this.assignGrouped(orders, availableDeliveries);
  }

  // ==================== OPTIMIZACIÓN DE RUTAS ====================

  /**
   * Optimiza la secuencia de recogida usando algoritmo del vecino más cercano
   */
  private optimizeRoute(
    pickupPoints: BusinessPickupPoint[],
    deliveryPoint: DeliveryLocation,
  ) {
    if (pickupPoints.length === 1) {
      return {
        pickupPoints,
        deliveryPoint,
        optimizedSequence: [0],
        totalDistance: this.calculateDistance(pickupPoints[0].location, deliveryPoint),
        estimatedTime: pickupPoints[0].estimatedPrepTime + 15, // +15 min para entrega
      };
    }

    // Algoritmo del vecino más cercano
    const unvisited = [...pickupPoints];
    const sequence: number[] = [];
    let currentLocation = unvisited[0].location;
    let totalDistance = 0;
    let totalTime = 0;

    while (unvisited.length > 0) {
      // Encontrar el punto más cercano
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      unvisited.forEach((point, index) => {
        const distance = this.calculateDistance(currentLocation, point.location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nearestPoint = unvisited[nearestIndex];
      sequence.push(pickupPoints.indexOf(nearestPoint));
      totalDistance += nearestDistance;
      totalTime += nearestPoint.estimatedPrepTime;
      currentLocation = nearestPoint.location;
      unvisited.splice(nearestIndex, 1);
    }

    // Agregar distancia final al punto de entrega
    totalDistance += this.calculateDistance(currentLocation, deliveryPoint);
    totalTime += 15; // Tiempo de entrega

    return {
      pickupPoints: sequence.map(i => pickupPoints[i]),
      deliveryPoint,
      optimizedSequence: sequence,
      totalDistance,
      estimatedTime: totalTime,
    };
  }

  /**
   * Crea clusters usando K-means simplificado
   */
  private createClusters(orders: Order[], k: number): DeliveryCluster[] {
    if (k >= orders.length) {
      // Si K >= número de órdenes, cada orden es su propio cluster
      return orders.map(order => ({
        orders: [order._id as Types.ObjectId],
        businesses: [{
          businessId: order.business._id as Types.ObjectId,
          orderId: order._id as Types.ObjectId,
          orderNumber: order.orderNumber,
          location: order.businessLocation,
          estimatedPrepTime: order.estimatedDeliveryTime || 30,
          itemCount: order.items.length,
        }],
        centroid: order.businessLocation,
        maxDistance: 0,
        totalEstimatedTime: order.estimatedDeliveryTime || 30,
      }));
    }

    // Inicializar centroides aleatoriamente
    const centroids: DeliveryLocation[] = [];
    const selectedIndices = new Set<number>();

    while (centroids.length < k) {
      const randomIndex = Math.floor(Math.random() * orders.length);
      if (!selectedIndices.has(randomIndex)) {
        centroids.push(orders[randomIndex].businessLocation);
        selectedIndices.add(randomIndex);
      }
    }

    // Iterar hasta convergencia (máx 10 iteraciones)
    let iterations = 0;
    const maxIterations = 10;
    let clusters: DeliveryCluster[] = [];

    while (iterations < maxIterations) {
      // Asignar órdenes a clusters
      clusters = centroids.map(() => ({
        orders: [],
        businesses: [],
        centroid: { lat: 0, lng: 0 },
        maxDistance: 0,
        totalEstimatedTime: 0,
      }));

      orders.forEach(order => {
        let nearestClusterIndex = 0;
        let nearestDistance = Infinity;

        centroids.forEach((centroid, index) => {
          const distance = this.calculateDistance(order.businessLocation, centroid);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestClusterIndex = index;
          }
        });

        clusters[nearestClusterIndex].orders.push(order._id as Types.ObjectId);
        clusters[nearestClusterIndex].businesses.push({
          businessId: order.business._id as Types.ObjectId,
          orderId: order._id as Types.ObjectId,
          orderNumber: order.orderNumber,
          location: order.businessLocation,
          estimatedPrepTime: order.estimatedDeliveryTime || 30,
          itemCount: order.items.length,
        });
      });

      // Recalcular centroides
      let hasChanged = false;
      clusters.forEach((cluster, index) => {
        if (cluster.businesses.length > 0) {
          const newCentroid = {
            lat: cluster.businesses.reduce((sum, b) => sum + b.location.lat, 0) / cluster.businesses.length,
            lng: cluster.businesses.reduce((sum, b) => sum + b.location.lng, 0) / cluster.businesses.length,
          };

          if (
            Math.abs(newCentroid.lat - centroids[index].lat) > 0.0001 ||
            Math.abs(newCentroid.lng - centroids[index].lng) > 0.0001
          ) {
            hasChanged = true;
            centroids[index] = newCentroid;
            cluster.centroid = newCentroid;
          }

          // Calcular métricas del cluster
          cluster.maxDistance = Math.max(
            ...cluster.businesses.map(b =>
              this.calculateDistance(b.location, newCentroid)
            )
          );
          cluster.totalEstimatedTime = cluster.businesses.reduce(
            (sum, b) => sum + b.estimatedPrepTime,
            0
          );
        }
      });

      if (!hasChanged) break;
      iterations++;
    }

    // Filtrar clusters vacíos
    return clusters.filter(c => c.orders.length > 0);
  }

  // ==================== SELECCIÓN DE REPARTIDORES ====================

  /**
   * Busca repartidores disponibles cerca del punto de entrega
   */
  private async findAvailableDeliveries(
    deliveryPoint: DeliveryLocation,
    requiredCount: number,
  ): Promise<User[]> {
    // Buscar repartidores activos
    const allDeliveries = await this.userModel.find({
      role: UserRole.DELIVERY,
      isActive: true,
    });

    // Obtener repartidores que NO están ocupados
    const busyDeliveryIds = await this.trackingModel.distinct('delivery', {
      status: {
        $in: [
          TrackingStatus.GOING_TO_BUSINESS,
          TrackingStatus.AT_BUSINESS,
          TrackingStatus.GOING_TO_CLIENT,
        ],
      },
    });

    const availableDeliveries = allDeliveries.filter(
      d => !busyDeliveryIds.some(busy => busy.equals(d._id as Types.ObjectId))
    );

    // Si hay coordenadas en el perfil del repartidor, ordenar por proximidad
    const deliveriesWithDistance = availableDeliveries.map(delivery => {
      let distance = Infinity;
      if (delivery.address?.coordinates) {
        distance = this.calculateDistance(
          delivery.address.coordinates,
          deliveryPoint,
        );
      }
      return { delivery, distance };
    });

    // Ordenar por distancia y limitar
    deliveriesWithDistance.sort((a, b) => a.distance - b.distance);

    return deliveriesWithDistance
      .slice(0, Math.max(requiredCount, CONFIG.MAX_ORDERS_PER_DELIVERY))
      .map(d => d.delivery);
  }

  /**
   * Selecciona el mejor repartidor para un cluster de órdenes
   */
  private async selectBestDeliveryForCluster(
    orders: Order[],
    availableDeliveries: User[],
  ): Promise<User> {
    if (availableDeliveries.length === 0) {
      throw new Error('No hay repartidores disponibles');
    }

    if (availableDeliveries.length === 1) {
      return availableDeliveries[0];
    }

    // Calcular centroide del cluster
    const centroid: DeliveryLocation = {
      lat: orders.reduce((sum, o) => sum + o.businessLocation.lat, 0) / orders.length,
      lng: orders.reduce((sum, o) => sum + o.businessLocation.lng, 0) / orders.length,
    };

    // Calcular score para cada repartidor
    const scores = await Promise.all(
      availableDeliveries.map(async delivery => {
        let score = 100; // Score base

        // Factor 1: Distancia al centroid (40%)
        if (delivery.address?.coordinates) {
          const distance = this.calculateDistance(delivery.address.coordinates, centroid);
          score -= (distance / CONFIG.DELIVERY_SEARCH_RADIUS) * 100 * CONFIG.PRIORITY_WEIGHT.DISTANCE;
        }

        // Factor 2: Carga actual de trabajo (10%)
        const currentOrders = await this.trackingModel.countDocuments({
          delivery: delivery._id as Types.ObjectId,
          status: { $ne: TrackingStatus.ARRIVED },
        });
        score -= (currentOrders / CONFIG.MAX_ORDERS_PER_DELIVERY) * 100 * CONFIG.PRIORITY_WEIGHT.DELIVERY_WORKLOAD;

        return { delivery, score };
      })
    );

    // Retornar el repartidor con mejor score
    scores.sort((a, b) => b.score - a.score);
    return scores[0].delivery;
  }

  // ==================== UTILIDADES ====================

  /**
   * Calcula la distancia haversine entre dos puntos (en km)
   */
  private calculateDistance(point1: DeliveryLocation, point2: DeliveryLocation): number {
    const R = 6371; // Radio de la Tierra en km
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

  /**
   * Calcula matriz de distancias entre todos los puntos
   */
  private calculateDistanceMatrix(points: BusinessPickupPoint[]): number[][] {
    return points.map(p1 =>
      points.map(p2 => this.calculateDistance(p1.location, p2.location))
    );
  }

  /**
   * Calcula prioridad de una asignación
   */
  private calculatePriority(
    order: Order,
    delivery: User,
    orderCount: number,
  ): number {
    let priority = 3; // Prioridad media por defecto

    // Aumentar prioridad si hay muchas órdenes
    if (orderCount > 2) priority += 1;

    // Aumentar prioridad si el tiempo de preparación es corto
    if (order.estimatedDeliveryTime < 20) priority += 1;

    return Math.min(priority, 5);
  }

  /**
   * Calcula métricas de eficiencia
   */
  private calculateMetrics(
    assignments: DeliveryAssignment[],
    totalOrders: number,
  ) {
    const deliveriesUsed = assignments.length;
    const averageOrdersPerDelivery = totalOrders / deliveriesUsed;
    const estimatedTotalTime = Math.max(
      ...assignments.map(a => a.route.estimatedTime)
    );

    // Eficiencia de costo: más órdenes por repartidor = más eficiente
    const costEfficiency = Math.min(
      (averageOrdersPerDelivery / CONFIG.MAX_ORDERS_PER_DELIVERY) * 100,
      100
    );

    return {
      totalOrders,
      deliveriesUsed,
      averageOrdersPerDelivery,
      estimatedTotalTime,
      costEfficiency,
    };
  }

  /**
   * Guarda las asignaciones en la base de datos
   */
  private async saveAssignments(assignments: DeliveryAssignment[]) {
    const updates: Promise<any>[] = [];

    for (const assignment of assignments) {
      // Actualizar órdenes con el delivery asignado
      updates.push(
        this.orderModel.updateMany(
          { _id: { $in: assignment.orders } },
          {
            $set: {
              delivery: assignment.deliveryId,
              status: OrderStatus.CONFIRMED,
              confirmedAt: new Date(),
            },
            $push: {
              statusHistory: {
                status: OrderStatus.CONFIRMED,
                timestamp: new Date(),
                note: `Asignado al repartidor - ${assignment.orders.length} orden(es)`,
              },
            },
          }
        ).exec()
      );

      // Crear tracking para cada orden
      for (const orderId of assignment.orders) {
        const order = await this.orderModel.findById(orderId);
        if (order) {
          const pickupPoint = assignment.route.pickupPoints.find(
            p => p.orderId.equals(orderId)
          );

          if (pickupPoint) {
            updates.push(
              this.trackingModel.create({
                order: orderId,
                delivery: assignment.deliveryId,
                route: {
                  origin: pickupPoint.location,
                  destination: order.deliveryAddress.coordinates,
                  distance: assignment.route.totalDistance,
                  estimatedDuration: assignment.route.estimatedTime,
                },
                status: TrackingStatus.GOING_TO_BUSINESS,
                startedAt: new Date(),
              })
            );
          }
        }
      }
    }

    await Promise.all(updates);
  }
}