import { adminRepository } from '../repositories/admin.repository';
import { profileRepository } from '../repositories/profile.repository';
import { propertyRepository } from '../repositories/property.repository';
import { notificationService } from './notification.service';
import { Profile } from '../types';
import { ApiException } from '../middleware/errorHandler.middleware';

export const moderationService = {
  listUsers(filters: { role?: string; status?: string; q?: string; page: number; page_size: number }) {
    return profileRepository.list(filters);
  },

  async setUserStatus(admin: Profile, userId: string, status: string) {
    const profile = await profileRepository.setStatus(userId, status);
    await adminRepository.logAction(admin.id, `user_${status}`, 'profiles', userId);
    return profile;
  },

  async verifyAgent(admin: Profile, userId: string) {
    const profile = await profileRepository.verifyAgent(userId);
    await adminRepository.logAction(admin.id, 'verify_agent', 'profiles', userId);
    return profile;
  },

  pendingProperties() {
    return propertyRepository.listPendingReview();
  },

  async approveProperty(admin: Profile, propertyId: number) {
    const property = await propertyRepository.setStatus(propertyId, 'active', {
      approved_by: admin.id,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    });
    await adminRepository.logAction(admin.id, 'approve_listing', 'properties', String(propertyId));
    await notificationService.notifyListingDecision(property.owner_id, propertyId, true);
    return property;
  },

  async rejectProperty(admin: Profile, propertyId: number, reason: string) {
    if (!reason) throw new ApiException(400, 'VALIDATION_ERROR', 'Rejection reason is required');
    const property = await propertyRepository.setStatus(propertyId, 'rejected', { rejection_reason: reason });
    await adminRepository.logAction(admin.id, 'reject_listing', 'properties', String(propertyId), { reason });
    await notificationService.notifyListingDecision(property.owner_id, propertyId, false, reason);
    return property;
  },

  reports() {
    return adminRepository.listReports();
  },

  async resolveReport(admin: Profile, reportId: number, status: string) {
    const report = await adminRepository.updateReportStatus(reportId, status);
    await adminRepository.logAction(admin.id, `report_${status}`, 'reported_listings', String(reportId));
    return report;
  },

  analytics() {
    return adminRepository.analyticsSummary();
  },
};
