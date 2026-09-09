import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  email: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'STAFF' | string;
  businessId?: string;
  businessName?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) return null;
    return data ? user[data] : user;
  },
);
