import { conversationRepository } from '../repositories/conversation.repository';
import { ApiException } from '../middleware/errorHandler.middleware';
import { Profile } from '../types';

function assertParticipant(conversation: { buyer_id: string; owner_id: string }, actor: Profile) {
  if (conversation.buyer_id !== actor.id && conversation.owner_id !== actor.id) {
    throw new ApiException(403, 'FORBIDDEN', 'You are not part of this conversation');
  }
}

export const conversationService = {
  // The enquiry flow is the entry point into a conversation: a logged-in buyer's
  // enquiry seeds (or reuses) a conversation with the listing's owner/agent.
  async startFromEnquiry(propertyId: number, ownerId: string, buyerId: string, firstMessage: string) {
    const conversation = await conversationRepository.findOrCreate(propertyId, buyerId, ownerId);
    await conversationRepository.addMessage(conversation.id, buyerId, firstMessage);
    return conversation;
  },

  list(actor: Profile) {
    return conversationRepository.listForUser(actor.id);
  },

  async messages(conversationId: number, actor: Profile) {
    const conversation = await conversationRepository.findById(conversationId);
    assertParticipant(conversation, actor);
    return conversationRepository.listMessages(conversationId);
  },

  async send(conversationId: number, actor: Profile, body: string) {
    const conversation = await conversationRepository.findById(conversationId);
    assertParticipant(conversation, actor);
    return conversationRepository.addMessage(conversationId, actor.id, body);
  },
};
