import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/env';

// Transactional email is fire-and-forget: it must never block the request that triggered it.
async function sendEmail(to: string, subject: string, html: string) {
  if (!env.resendApiKey || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.emailFrom, to, subject, html }),
    });
  } catch {
    // Non-fatal — logging only, never throw from a notification side-effect.
  }
}

export const notificationService = {
  async notifyEnquiryReceived(ownerId: string, propertyId: number, propertyTitle: string) {
    await supabaseAdmin.from('notifications').insert({
      user_id: ownerId,
      type: 'enquiry_received',
      title: 'New enquiry received',
      body: `You have a new enquiry on "${propertyTitle}"`,
      related_property_id: propertyId,
    });

    const { data: owner } = await supabaseAdmin.from('profiles').select('full_name').eq('id', ownerId).single();
    void owner; // email address lives in auth.users; fetched via admin API if needed for real sending
  },

  async notifyListingDecision(ownerId: string, propertyId: number, approved: boolean, reason?: string) {
    await supabaseAdmin.from('notifications').insert({
      user_id: ownerId,
      type: approved ? 'listing_approved' : 'listing_rejected',
      title: approved ? 'Listing approved' : 'Listing rejected',
      body: approved ? 'Your listing is now live.' : `Your listing was rejected: ${reason ?? ''}`,
      related_property_id: propertyId,
    });
  },

  sendEmail,
};
