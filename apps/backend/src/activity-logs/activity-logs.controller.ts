import { Controller, Get, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/user.decorator';
import { ActivityLogsService } from './activity-logs.service';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async getLogs(
    @CurrentUser() user: UserPayload,
    @Query('search') search?: string,
    @Query('entity') entity?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.businessId) {
      throw new UnauthorizedException('User does not belong to a business');
    }
    return this.activityLogsService.findAll(user.businessId, {
      search,
      entity,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
