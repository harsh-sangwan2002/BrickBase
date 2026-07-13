import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiException, asyncHandler } from './errorHandler.middleware';

// Verifies the Supabase JWT via the Auth server (supports both legacy HS256 and the
// newer asymmetric signing keys — no static secret to keep in sync) and re-fetches the
// profile/role from the DB — role is never trusted from the token claim alone (README §3.3).
async function resolveUser(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) return null;
  return { id: data.user.id, email: data.user.email ?? undefined, profile };
}

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiException(401, 'UNAUTHENTICATED', 'Missing bearer token');
  }

  const user = await resolveUser(header.slice('Bearer '.length));
  if (!user) throw new ApiException(401, 'UNAUTHENTICATED', 'Invalid or expired token');
  if (user.profile.status === 'suspended') {
    throw new ApiException(403, 'FORBIDDEN', 'This account has been suspended');
  }

  req.user = user;
  next();
});

// Attaches req.user if a valid token is present, but doesn't reject the request otherwise.
export const optionalAuthMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const user = await resolveUser(header.slice('Bearer '.length));
  if (user) req.user = user;
  next();
});
