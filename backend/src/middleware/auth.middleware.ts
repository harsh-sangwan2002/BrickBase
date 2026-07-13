import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { ApiException, asyncHandler } from './errorHandler.middleware';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
}

// Verifies the Supabase JWT and re-fetches the profile/role from the DB —
// role is never trusted from the token claim alone (see README §3.3).
export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiException(401, 'UNAUTHENTICATED', 'Missing bearer token');
  }
  const token = header.slice('Bearer '.length);

  let payload: SupabaseJwtPayload;
  try {
    payload = jwt.verify(token, env.supabaseJwtSecret) as SupabaseJwtPayload;
  } catch {
    throw new ApiException(401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', payload.sub)
    .single();

  if (error || !profile) {
    throw new ApiException(401, 'UNAUTHENTICATED', 'No profile found for this user');
  }
  if (profile.status === 'suspended') {
    throw new ApiException(403, 'FORBIDDEN', 'This account has been suspended');
  }

  req.user = { id: payload.sub, email: payload.email, profile };
  next();
});

// Attaches req.user if a valid token is present, but doesn't reject the request otherwise.
export const optionalAuthMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const token = header.slice('Bearer '.length);
    const payload = jwt.verify(token, env.supabaseJwtSecret) as SupabaseJwtPayload;
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', payload.sub).single();
    if (profile) req.user = { id: payload.sub, email: payload.email, profile };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
});
