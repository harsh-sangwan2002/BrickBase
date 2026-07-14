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
}

export interface PropertyImage {
  id?: number;
  image_url: string;
  is_cover: boolean;
  sort_order?: number;
}

export interface PropertySummary {
  id: number;
  title: string;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number;
  area_value: number;
  area_unit: AreaUnit;
  city: string;
  bhk?: number | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  property_images: PropertyImage[];
}

export interface PropertyDetail extends PropertySummary {
  owner_id: string;
  description: string;
  price_negotiable: boolean;
  address: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  bathrooms?: number | null;
  furnishing_status?: FurnishingStatus | null;
  possession_status?: PossessionStatus | null;
  age_of_property_years?: number | null;
  attributes: Record<string, unknown>;
  status: PropertyStatus;
  rejection_reason?: string | null;
  views_count: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
}

export interface Enquiry {
  id: number;
  property_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  properties?: { id: number; title: string };
}

export interface NearbyPlace {
  name: string;
  vicinity: string;
  distanceMeters: number;
}

export interface NearbyCategory {
  type: string;
  label: string;
  places: NearbyPlace[];
}

export interface NearbyAmenities {
  latitude: number;
  longitude: number;
  categories: NearbyCategory[];
}

export interface Conversation {
  id: number;
  property_id: number | null;
  buyer_id: string;
  owner_id: string;
  last_message_at: string;
  created_at: string;
  properties?: { id: number; title: string } | null;
  buyer?: { id: string; full_name: string; avatar_url: string | null };
  owner?: { id: string; full_name: string; avatar_url: string | null };
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface SavedSearch {
  id: number;
  user_id: string;
  filters: Record<string, unknown>;
  alert_enabled: boolean;
  last_notified_at: string;
  created_at: string;
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

export interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}
