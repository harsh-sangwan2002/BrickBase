import cron from 'node-cron';
import { savedSearchRepository } from '../repositories/savedSearch.repository';
import { propertyRepository } from '../repositories/property.repository';
import { supabaseAdmin } from '../config/supabase';
import { notificationService } from '../services/notification.service';
import { formatPrice } from '../utils/format';

// Diffs each saved search against newly created listings since it was last checked, and
// emails + notifies the subscriber if there are new matches. Runs inside the same process —
// no separate deployment needed (see README §13, "Saved-search email alerts").
async function runSavedSearchAlerts() {
  const savedSearches = await savedSearchRepository.listEnabledForAlerts();

  for (const saved of savedSearches) {
    try {
      const matches = await propertyRepository.findNewMatches(saved.filters ?? {}, saved.last_notified_at);
      if (matches.length === 0) continue;

      await supabaseAdmin.from('notifications').insert({
        user_id: saved.user_id,
        type: 'saved_search_alert',
        title: `${matches.length} new listing${matches.length > 1 ? 's' : ''} match your saved search`,
        body: matches.map((m) => `${m.title} — ${formatPrice(m.price)} (${m.city})`).join('\n'),
      });

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(saved.user_id);
      if (authUser.user?.email) {
        const listHtml = matches.map((m) => `<li>${m.title} — ${formatPrice(m.price)} (${m.city})</li>`).join('');
        await notificationService.sendEmail(
          authUser.user.email,
          `${matches.length} new listing${matches.length > 1 ? 's' : ''} match your saved search`,
          `<p>New listings matching your saved search on BrickBase:</p><ul>${listHtml}</ul>`
        );
      }

      await savedSearchRepository.updateLastNotified(saved.id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[saved-search-alerts] Failed for saved_search ${saved.id}:`, err);
    }
  }
}

export function startSavedSearchAlertsJob() {
  // Every 15 minutes — frequent enough to feel timely, infrequent enough to stay well
  // within Nominatim/Overpass/DB fair-use limits for a small-scale deployment.
  cron.schedule('*/15 * * * *', () => {
    runSavedSearchAlerts().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[saved-search-alerts] Job run failed:', err);
    });
  });
}

// Exported for manual/testing invocation (e.g. `npm run alerts:run-once`).
export { runSavedSearchAlerts };
