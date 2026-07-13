import { createApp } from './app';
import { env } from './config/env';
import { checkSupabaseConnection } from './config/supabase';

const app = createApp();

app.listen(env.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`BrickBase API listening on http://localhost:${env.port}`);
  await checkSupabaseConnection();
});
