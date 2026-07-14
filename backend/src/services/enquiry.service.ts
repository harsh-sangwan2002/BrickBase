import { enquiryRepository } from '../repositories/enquiry.repository';
import { propertyRepository } from '../repositories/property.repository';
import { Profile } from '../types';
import { ApiException } from '../middleware/errorHandler.middleware';
import { notificationService } from './notification.service';
import { conversationService } from './conversation.service';

export const enquiryService = {
  async create(propertyId: number, buyerId: string | null, payload: Record<string, unknown>) {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.status !== 'active') {
      throw new ApiException(404, 'NOT_FOUND', 'Property not found or not currently listed');
    }
    const enquiry = await enquiryRepository.create(propertyId, buyerId, payload);
    await notificationService.notifyEnquiryReceived(property.owner_id, property.id, property.title);

    // Logged-in enquiries also open (or reuse) an in-app conversation with the owner/agent —
    // the enquiry message becomes the first chat message.
    if (buyerId && buyerId !== property.owner_id) {
      const message = (payload as { message?: string }).message ?? 'New enquiry';
      await conversationService.startFromEnquiry(propertyId, property.owner_id, buyerId, message).catch(() => undefined);
    }

    return enquiry;
  },

  list(actor: Profile) {
    if (actor.role === 'admin') return enquiryRepository.listAll();
    return enquiryRepository.listForOwner(actor.id);
  },

  async updateStatus(id: number, actor: Profile, status: string) {
    const enquiry = await enquiryRepository.findById(id);
    if (!enquiry) throw new ApiException(404, 'NOT_FOUND', 'Enquiry not found');
    const property = (enquiry as { properties: { owner_id: string } }).properties;
    if (actor.role !== 'admin' && property.owner_id !== actor.id) {
      throw new ApiException(403, 'FORBIDDEN', 'You do not manage this listing');
    }
    return enquiryRepository.updateStatus(id, status);
  },
};
