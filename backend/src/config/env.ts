import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Missing env var ${name} — set it in backend/.env before going to production.`);
    return '';
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'BrickBase <no-reply@brickbase.app>',
  meilisearchHost: process.env.MEILISEARCH_HOST ?? '',
  meilisearchApiKey: process.env.MEILI_MASTER_KEY ?? '',
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqApiBase: process.env.GROQ_API_BASE ?? 'https://api.groq.com/openai/v1',
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
};
