import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { filterMessage } from './content-filter';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // All job conversations the user is a participant of
  async getConversations(userId: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        OR: [
          { clientId: userId },
          {
            applications: {
              some: {
                status: { in: ['ACCEPTED', 'NOTIFIED'] },
                worker: { userId },
              },
            },
          },
        ],
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] },
      },
      include: {
        category: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                clientProfile: { select: { firstName: true } },
                workerProfile: { select: { firstName: true } },
              },
            },
          },
        },
        applications: {
          where: { status: { in: ['ACCEPTED', 'NOTIFIED'] } },
          include: {
            worker: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            clientProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['jobId'],
      where: {
        job: {
          OR: [
            { clientId: userId },
            { applications: { some: { worker: { userId } } } },
          ],
        },
        senderId: { not: userId },
        readAt: null,
      },
      _count: true,
    });

    const unreadMap: Record<string, number> = {};
    for (const u of unreadCounts) unreadMap[u.jobId] = u._count;

    return jobs.map(job => {
      const lastMsg = job.messages[0];
      const worker = job.applications[0]?.worker;
      const otherPerson = job.clientId === userId
        ? (worker ? `${worker.firstName} ${worker.lastName}` : 'Worker')
        : (job.client.clientProfile
            ? `${job.client.clientProfile.firstName} ${job.client.clientProfile.lastName}`
            : 'Client');

      return {
        jobId: job.id,
        jobTitle: job.title,
        categoryName: job.category?.name ?? null,
        otherPerson,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          senderName: lastMsg.sender.clientProfile?.firstName
            ?? lastMsg.sender.workerProfile?.firstName
            ?? 'Unknown',
          isMine: lastMsg.sender.id === userId,
          createdAt: lastMsg.createdAt,
        } : null,
        unread: unreadMap[job.id] ?? 0,
      };
    }).sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? new Date(0);
      const bTime = b.lastMessage?.createdAt ?? new Date(0);
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  async getMessages(jobId: string, userId: string) {
    await this.assertParticipant(jobId, userId);

    const messages = await this.prisma.message.findMany({
      where: { jobId },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            clientProfile: { select: { firstName: true, lastName: true } },
            workerProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: { jobId, readAt: null, senderId: { not: userId } },
      data: { readAt: new Date() },
    });

    return messages.map(this.format);
  }

  async saveMessage(jobId: string, senderId: string, content: string) {
    await this.assertParticipant(jobId, senderId);

    const { content: filteredContent, wasFiltered } = filterMessage(content);

    const msg = await this.prisma.message.create({
      data: { jobId, senderId, content: filteredContent, wasFiltered },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            clientProfile: { select: { firstName: true, lastName: true } },
            workerProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Find the recipient
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { status: { in: ['ACCEPTED', 'NOTIFIED'] } },
          include: { worker: { select: { userId: true } } },
        },
      },
    });

    let recipientId: string | null = null;
    if (job) {
      if (job.clientId === senderId) {
        recipientId = job.applications[0]?.worker.userId ?? null;
      } else {
        recipientId = job.clientId;
      }
    }

    return { message: this.format(msg), recipientId };
  }

  private async assertParticipant(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { status: { in: ['ACCEPTED', 'NOTIFIED'] } },
          include: { worker: { select: { userId: true } } },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    const isClient = job.clientId === userId;
    const isWorker = job.applications.some(a => a.worker.userId === userId);
    if (!isClient && !isWorker) throw new ForbiddenException('Not a participant');
  }

  private format(msg: any) {
    const profile = msg.sender.workerProfile ?? msg.sender.clientProfile;
    return {
      id: msg.id,
      jobId: msg.jobId,
      senderId: msg.senderId,
      senderName: profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown',
      senderRole: msg.sender.role,
      content: msg.content,
      wasFiltered: msg.wasFiltered ?? false,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    };
  }
}
