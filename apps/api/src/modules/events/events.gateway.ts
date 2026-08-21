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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'ws/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || (client.handshake.headers?.authorization?.replace('Bearer ', ''));
    let userId = client.handshake.query?.userId as string;

    if (!userId && token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub || payload.userId || payload.id;
      } catch {
        // ignore decoding error
      }
    }

    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} joined personal room user:${userId}`);
    } else {
      this.logger.log(`Client ${client.id} connected to /ws/events`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected from /ws/events`);
  }

  sendToUser(userId: string, event: 'message:new' | 'notification:new', payload: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId: string; recipientId: string; senderName?: string },
  ) {
    if (payload?.recipientId) {
      this.server.to(`user:${payload.recipientId}`).emit('typing_status', {
        threadId: payload.threadId,
        isTyping: true,
        senderName: payload.senderName,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId: string; recipientId: string },
  ) {
    if (payload?.recipientId) {
      this.server.to(`user:${payload.recipientId}`).emit('typing_status', {
        threadId: payload.threadId,
        isTyping: false,
      });
    }
  }
}
