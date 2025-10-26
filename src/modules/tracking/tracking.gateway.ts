// src/modules/tracking/tracking.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/tracking.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especificar dominio específico
  },
  namespace: 'tracking',
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    console.log(`Cliente desconectado: ${client.id}, User: ${userId}`);
  }

  @SubscribeMessage('join-order')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string; role: string },
  ) {
    // Unirse a la room de la orden
    client.join(`order-${data.orderId}`);
    this.connectedUsers.set(client.id, data.userId);

    console.log(
      `Usuario ${data.userId} (${data.role}) se unió a order-${data.orderId}`,
    );

    // Enviar tracking actual
    try {
      const tracking = await this.trackingService.getTracking(data.orderId);
      client.emit('tracking-update', tracking);
    } catch (error) {
      client.emit('error', { message: 'Tracking no encontrado' });
    }

    return { success: true, message: 'Unido a la orden' };
  }

  @SubscribeMessage('leave-order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.leave(`order-${data.orderId}`);
    console.log(`Cliente ${client.id} salió de order-${data.orderId}`);
    return { success: true, message: 'Saliste de la orden' };
  }

  @SubscribeMessage('update-location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderId: string;
      deliveryId: string;
      location: UpdateLocationDto;
    },
  ) {
    try {
      // Actualizar ubicación en la base de datos
      await this.trackingService.updateLocation(
        data.orderId,
        data.deliveryId,
        data.location,
      );

      // Obtener tracking actualizado
      const tracking = await this.trackingService.getTracking(data.orderId);

      // Emitir actualización a todos los clientes en la room (cliente y negocio)
      this.server.to(`order-${data.orderId}`).emit('tracking-update', tracking);

      return { success: true };
    } catch (error: any) {
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  // Método para emitir eventos desde otros servicios
  emitTrackingUpdate(orderId: string, tracking: any) {
    this.server.to(`order-${orderId}`).emit('tracking-update', tracking);
  }

  emitOrderStatusUpdate(orderId: string, status: string) {
    this.server.to(`order-${orderId}`).emit('order-status-update', { status });
  }

  emitNotification(orderId: string, notification: any) {
    this.server.to(`order-${orderId}`).emit('notification', notification);
  }
}