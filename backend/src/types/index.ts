export type UserRole = 'buyer' | 'owner' | 'agent' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type PropertyType = 'land' | 'residential' | 'commercial';
export type ListingType = 'sale' | 'rent';
export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'furnished';
export type PossessionStatus = 'ready_to_move' | 'under_construction';
export type AreaUnit = 'sqft' | 'sqyd' | 'acre' | 'sqm';
export type PropertyStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'rejected'
  | 'sold'
  | 'rented'
  | 'inactive';
export type EnquiryStatus = 'new' | 'contacted' | 'closed' | 'spam';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  agency_name: string | null;
  license_number: string | null;
  is_license_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthedRequestUser {
  id: string;
  email?: string;
  profile: Profile;
}

// Augment Express Request with the authenticated user, attached by auth.middleware.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
    }
  }
}

export interface AiChatAction {
  type: 'navigate';
  path: string;
  label?: string;
}

export interface AiChatSession {
  id: number;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  action: AiChatAction | null;
  created_at: string;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: { code: string; message: string };
}
