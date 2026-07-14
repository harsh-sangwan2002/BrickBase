import { env } from '../config/env';

export const isGroqConfigured = Boolean(env.groqApiKey);

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const groqService = {
  isConfigured: isGroqConfigured,

  async chat(messages: GroqChatMessage[]): Promise<string> {
    if (!isGroqConfigured) {
      throw new Error('Groq API is not configured — set GROQ_API_KEY in backend/.env');
    }

    const res = await fetch(`${env.groqApiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groqApiKey}` },
      body: JSON.stringify({ model: env.groqModel, messages, temperature: 0.3 }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Groq API error (${res.status}): ${text}`);
    }

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return body.choices?.[0]?.message?.content ?? '';
  },
};
