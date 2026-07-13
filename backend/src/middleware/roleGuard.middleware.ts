import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../types';
import { ApiException } from './errorHandler.middleware';

export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiException(401, 'UNAUTHENTICATED', 'Authentication required');
    }
    if (!allowedRoles.includes(req.user.profile.role)) {
      throw new ApiException(403, 'FORBIDDEN', 'You do not have permission to perform this action');
    }
    next();
  };
}
