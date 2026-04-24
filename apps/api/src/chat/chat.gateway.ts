import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private chat: ChatService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth['token'] as string;
    if (!token) { socket.disconnect(); return; }
    try {
      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      socket.data['userId'] = payload.sub;
      // Personal notification room
      socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(_socket: Socket) {}

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() socket: Socket, @MessageBody() jobId: string) {
    const userId = socket.data['userId'];
    if (!userId) return;
    try {
      const messages = await this.chat.getMessages(jobId, userId);
      socket.join(`job:${jobId}`);
      socket.emit('history', { jobId, messages });
      socket.emit('unread', { jobId, count: 0 });
    } catch {
      socket.emit('error', 'Cannot join this chat');
    }
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() socket: Socket, @MessageBody() jobId: string) {
    socket.leave(`job:${jobId}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { jobId: string; content: string },
  ) {
    const userId = socket.data['userId'];
    if (!userId || !body?.content?.trim()) return;
    try {
      const { message, recipientId } = await this.chat.saveMessage(body.jobId, userId, body.content.trim());
      this.server.to(`job:${body.jobId}`).emit('message', message);
      if (recipientId) {
        this.server.to(`user:${recipientId}`).emit('notification', {
          jobId: body.jobId,
          senderName: message.senderName,
          preview: message.content.slice(0, 60),
        });
      }
    } catch {
      socket.emit('error', 'Could not send message');
    }
  }
}
