import { savedSearchRepository } from '../repositories/savedSearch.repository';
import { ApiException } from '../middleware/errorHandler.middleware';
import { Profile } from '../types';

function assertOwner(savedSearch: { user_id: string }, actor: Profile) {
  if (savedSearch.user_id !== actor.id) {
    throw new ApiException(403, 'FORBIDDEN', 'This is not your saved search');
  }
}

export const savedSearchService = {
  create(actor: Profile, filters: Record<string, unknown>, alertEnabled: boolean) {
    return savedSearchRepository.create(actor.id, filters, alertEnabled);
  },

  list(actor: Profile) {
    return savedSearchRepository.listForUser(actor.id);
  },

  async setAlertEnabled(id: number, actor: Profile, alertEnabled: boolean) {
    const existing = await savedSearchRepository.findById(id);
    assertOwner(existing, actor);
    return savedSearchRepository.setAlertEnabled(id, alertEnabled);
  },

  async remove(id: number, actor: Profile) {
    const existing = await savedSearchRepository.findById(id);
    assertOwner(existing, actor);
    await savedSearchRepository.remove(id);
  },
};
