import { env } from '../config/env';

export const isSearchConfigured = Boolean(env.meilisearchHost);

const INDEX = 'properties';
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${env.meilisearchApiKey}` };

export interface PropertySearchDoc {
  id: number;
  title: string;
  description: string;
  city: string;
  property_type: string;
  listing_type: string;
  price: number;
  area_value: number;
  bhk: number | null;
  status: string;
}

let indexReady: Promise<void> | null = null;

// Configures searchable/filterable attributes once — safe to call repeatedly (idempotent).
function ensureIndexConfigured(): Promise<void> {
  if (!indexReady) {
    indexReady = (async () => {
      await fetch(`${env.meilisearchHost}/indexes/${INDEX}/settings/searchable-attributes`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(['title', 'description', 'city']),
      });
      await fetch(`${env.meilisearchHost}/indexes/${INDEX}/settings/filterable-attributes`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(['status', 'property_type', 'listing_type', 'city', 'bhk', 'price', 'area_value']),
      });
    })().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[search] Failed to configure Meilisearch index:', err);
    });
  }
  return indexReady;
}

export const searchService = {
  isConfigured: isSearchConfigured,

  // Fire-and-forget from the repository layer — indexing failures must never block a
  // property write, since Postgres remains the source of truth.
  async indexProperty(doc: PropertySearchDoc) {
    if (!isSearchConfigured) return;
    try {
      await ensureIndexConfigured();
      if (doc.status === 'active') {
        await fetch(`${env.meilisearchHost}/indexes/${INDEX}/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify([doc]),
        });
      } else {
        await fetch(`${env.meilisearchHost}/indexes/${INDEX}/documents/${doc.id}`, { method: 'DELETE', headers });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[search] Failed to sync property ${doc.id}:`, err);
    }
  },

  async removeProperty(id: number) {
    if (!isSearchConfigured) return;
    try {
      await fetch(`${env.meilisearchHost}/indexes/${INDEX}/documents/${id}`, { method: 'DELETE', headers });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[search] Failed to remove property ${id} from index:`, err);
    }
  },

  // Typo-tolerant, faceted search — returns matching property ids in relevance order.
  async searchIds(query: string, filters: string[], limit: number): Promise<number[]> {
    if (!isSearchConfigured) return [];
    const res = await fetch(`${env.meilisearchHost}/indexes/${INDEX}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: query, filter: filters, limit, attributesToRetrieve: ['id'] }),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { hits: { id: number }[] };
    return body.hits.map((hit) => hit.id);
  },
};
