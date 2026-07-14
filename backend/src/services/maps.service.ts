import { ApiException } from '../middleware/errorHandler.middleware';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Nominatim's usage policy requires a descriptive User-Agent identifying the app —
// see https://operations.osmfoundation.org/policies/nominatim/
const USER_AGENT = 'BrickBase/1.0 (property listing app)';

// Nearby-amenity categories shown on the property detail page, as OpenStreetMap tags.
const AMENITY_CATEGORIES: { type: string; label: string; tag: [string, string] }[] = [
  { type: 'bus_station', label: 'Bus stops', tag: ['highway', 'bus_stop'] },
  { type: 'supermarket', label: 'Shops & supermarkets', tag: ['shop', 'supermarket'] },
  { type: 'hospital', label: 'Hospitals', tag: ['amenity', 'hospital'] },
  { type: 'school', label: 'Schools', tag: ['amenity', 'school'] },
  { type: 'restaurant', label: 'Restaurants', tag: ['amenity', 'restaurant'] },
  { type: 'pharmacy', label: 'Pharmacies', tag: ['amenity', 'pharmacy'] },
];

const SEARCH_RADIUS_METERS = 1500;
const MAX_RESULTS_PER_CATEGORY = 5;

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

interface NearbyPlace {
  name: string;
  vicinity: string;
  distanceMeters: number;
}

interface NearbyCategory {
  type: string;
  label: string;
  places: NearbyPlace[];
}

// Simple in-memory cache for Overpass results — the public instance asks callers to
// cache aggressively and avoid re-querying the same area repeatedly.
const overpassCache = new Map<string, { data: NearbyCategory[]; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function tryGeocode(query: string): Promise<GeocodeResult | null> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const results = (await res.json()) as { lat: string; lon: string }[];
  if (!results.length) return null;
  return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
}

export const mapsService = {
  // Nominatim often can't resolve a made-up/unmapped street address (e.g. "Plot 42, DLF
  // Phase 4") — try candidates from most to least specific so we still land on a usable
  // (if approximate) location instead of failing outright.
  async geocodeFirstMatch(candidates: string[]): Promise<GeocodeResult> {
    for (const candidate of candidates) {
      // Nominatim's usage policy caps public requests at ~1/sec; candidates only run
      // sequentially until the first hit, and results are cached on the property row.
      const result = await tryGeocode(candidate);
      if (result) return result;
    }
    throw new ApiException(404, 'GEOCODE_FAILED', `Could not resolve a location for "${candidates[0]}"`);
  },

  async nearbyAmenities(latitude: number, longitude: number): Promise<NearbyCategory[]> {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = overpassCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const query = `[out:json][timeout:25];(${AMENITY_CATEGORIES.map(
      ({ tag: [key, value] }) => `node["${key}"="${value}"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});`
    ).join('')});out body;`;

    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      throw new ApiException(502, 'OVERPASS_FAILED', 'Could not fetch nearby amenities right now.');
    }

    const body = (await res.json()) as {
      elements: { tags?: Record<string, string>; lat: number; lon: number }[];
    };

    const categories: NearbyCategory[] = AMENITY_CATEGORIES.map(({ type, label, tag: [key, value] }) => {
      const places: NearbyPlace[] = body.elements
        .filter((el) => el.tags?.[key] === value)
        .map((el) => ({
          name: el.tags?.name ?? label.replace(/s$/, ''),
          vicinity: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', '),
          distanceMeters: Math.round(distanceMeters(latitude, longitude, el.lat, el.lon)),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, MAX_RESULTS_PER_CATEGORY);

      return { type, label, places };
    }).filter((c) => c.places.length > 0);

    overpassCache.set(cacheKey, { data: categories, expiresAt: Date.now() + CACHE_TTL_MS });
    return categories;
  },
};
