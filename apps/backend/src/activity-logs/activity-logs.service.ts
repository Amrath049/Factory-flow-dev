import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateLogParams {
  businessId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: any;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(params: CreateLogParams) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          businessId: params.businessId,
          userId: params.userId,
          userName: params.userName || params.userEmail || 'Unknown User',
          userEmail: params.userEmail || 'unknown@system.local',
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          description: params.description,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Failed to record activity log:', error);
      // Non-blocking catch to ensure main actions don't fail if logging has issue
    }
  }

  async findAll(businessId: string, query?: { search?: string; entity?: string; page?: number; limit?: number }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (query?.entity) {
      where.entity = query.entity;
    }

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { userName: { contains: s, mode: 'insensitive' } },
        { userEmail: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { action: { contains: s, mode: 'insensitive' } },
        { entity: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
