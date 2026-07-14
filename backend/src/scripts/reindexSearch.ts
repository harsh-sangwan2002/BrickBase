import { supabaseAdmin } from '../config/supabase';
import { searchService } from '../services/search.service';

async function main() {
  if (!searchService.isConfigured) {
    console.log('MEILISEARCH_HOST is not set — nothing to do.');
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('id, title, description, city, property_type, listing_type, price, area_value, bhk, status')
    .eq('status', 'active');

  if (error) throw error;

  console.log(`Reindexing ${data?.length ?? 0} active properties into Meilisearch...`);
  for (const row of data ?? []) {
    await searchService.indexProperty(row);
  }
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
