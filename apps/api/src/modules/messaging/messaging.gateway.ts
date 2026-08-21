import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'ws/messages',
})
export class MessagingGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  @SubscribeMessage('join_thread')
  handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId: string },
  ) {
    if (payload?.threadId) {
      client.join(payload.threadId);
      this.logger.log(`Client ${client.id} joined thread ${payload.threadId}`);
    }
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId: string; message: any },
  ) {
    if (payload?.threadId && payload?.message) {
      this.server.to(payload.threadId).emit('new_message', payload.message);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId: string; userId: string; isTyping: boolean },
  ) {
    if (payload?.threadId) {
      client.to(payload.threadId).emit('typing_status', payload);
    }
  }
}
