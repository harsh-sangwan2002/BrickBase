import { supabaseAdmin } from '../config/supabase';
import { ApiException } from '../middleware/errorHandler.middleware';
import { profileRepository } from '../repositories/profile.repository';
import { Profile } from '../types';

export const authService = {
  async signup(payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: 'buyer' | 'owner' | 'agent';
    agency_name?: string;
    license_number?: string;
  }) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name,
        phone: payload.phone,
        role: payload.role,
      },
    });

    if (error || !data.user) {
      throw new ApiException(400, 'SIGNUP_FAILED', error?.message ?? 'Could not create account');
    }

    // handle_new_user trigger inserts the base profile row; patch in agent-only fields if present.
    if (payload.agency_name || payload.license_number) {
      await profileRepository.update(data.user.id, {
        agency_name: payload.agency_name,
        license_number: payload.license_number,
      });
    }

    return profileRepository.findById(data.user.id);
  },

  me(profile: Profile) {
    return profile;
  },

  updateProfile(id: string, payload: Record<string, unknown>) {
    return profileRepository.update(id, payload);
  },

  async publicProfile(id: string) {
    const profile = await profileRepository.findById(id);
    if (!profile) throw new ApiException(404, 'NOT_FOUND', 'User not found');
    return {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      agency_name: profile.agency_name,
      is_license_verified: profile.is_license_verified,
      avatar_url: profile.avatar_url,
    };
  },
};
