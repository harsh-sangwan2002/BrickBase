import { propertyRepository, SearchPropertiesParams } from '../repositories/property.repository';
import { Profile } from '../types';
import { ApiException } from '../middleware/errorHandler.middleware';

function assertOwnerOrAdmin(property: { owner_id: string }, actor: Profile) {
  if (actor.role === 'admin') return;
  if (property.owner_id !== actor.id) {
    throw new ApiException(403, 'FORBIDDEN', 'You do not own this listing');
  }
}

export const propertyService = {
  search(params: SearchPropertiesParams) {
    return propertyRepository.search(params);
  },

  async getDetail(id: number) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    propertyRepository.incrementViews(id).catch(() => undefined);
    return property;
  },

  async compare(ids: number[]) {
    if (ids.length === 0 || ids.length > 4) {
      throw new ApiException(400, 'VALIDATION_ERROR', 'Provide between 1 and 4 property ids');
    }
    return propertyRepository.findByIds(ids);
  },

  async similar(id: number) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    return propertyRepository.findSimilar(property);
  },

  create(actor: Profile, payload: Record<string, unknown>) {
    return propertyRepository.create(actor.id, payload);
  },

  async update(id: number, actor: Profile, payload: Record<string, unknown>) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    assertOwnerOrAdmin(existing, actor);
    return propertyRepository.update(id, payload);
  },

  async submitForReview(id: number, actor: Profile) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    assertOwnerOrAdmin(existing, actor);
    if (existing.status !== 'draft') {
      throw new ApiException(400, 'INVALID_STATE', 'Only draft listings can be submitted for review');
    }
    return propertyRepository.setStatus(id, 'pending_review');
  },

  async remove(id: number, actor: Profile) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    assertOwnerOrAdmin(existing, actor);
    return propertyRepository.setStatus(id, 'inactive');
  },

  async myListings(actor: Profile) {
    return propertyRepository.listByOwner(actor.id);
  },

  async addImage(id: number, actor: Profile, imageUrl: string, isCover: boolean, sortOrder: number) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    assertOwnerOrAdmin(existing, actor);
    return propertyRepository.addImage(id, imageUrl, isCover, sortOrder);
  },

  async removeImage(id: number, imageId: number, actor: Profile) {
    const existing = await propertyRepository.findById(id);
    if (!existing) throw new ApiException(404, 'NOT_FOUND', 'Property not found');
    assertOwnerOrAdmin(existing, actor);
    return propertyRepository.removeImage(id, imageId);
  },
};
