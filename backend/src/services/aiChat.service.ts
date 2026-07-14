import { aiChatRepository } from '../repositories/aiChat.repository';
import { groqService } from './groq.service';
import { ApiException } from '../middleware/errorHandler.middleware';
import { AiChatAction } from '../types';

// Paths the assistant is allowed to redirect users to — keeps a malformed or adversarial
// model response from ever producing an off-site or unknown-route navigation.
const ALLOWED_PATH_PREFIXES = [
  '/search',
  '/favorites',
  '/compare',
  '/saved-searches',
  '/messages',
  '/profile',
  '/dashboard/listings',
  '/dashboard/enquiries',
];

const SYSTEM_PROMPT = `You are the BrickBase Assistant, a chat widget embedded on a real-estate marketplace website (BrickBase). Users describe what property they're looking for, or ask to get to a part of the site, and you help them in 1-3 short, friendly sentences.

Respond with ONLY a raw JSON object (no markdown fences, no extra text) matching exactly this shape:
{"reply": string, "action": {"type": "navigate", "path": string, "label": string} | null}

Available navigation targets:
- "/search" — property search results. Build it as a query string using any of: property_type (land|residential|commercial), listing_type (sale|rent), city, q (free-text keywords), min_price, max_price, min_area, max_area, bhk (number), sort (newest|price_asc|price_desc|area). Use this whenever the user describes what kind of property they want, e.g. "/search?city=Pune&listing_type=rent&bhk=2&max_price=50000".
- "/favorites" — the user's saved/favorited properties.
- "/compare" — the property comparison tool.
- "/saved-searches" — the user's saved search alerts.
- "/messages" — the user's buyer/owner conversations.
- "/profile" — the user's profile settings.
- "/dashboard/listings" — an owner/agent's own property listings.
- "/dashboard/listings/new" — the form to create a new listing.
- "/dashboard/enquiries" — enquiries received on the user's listings.

Rules:
- Only include "action" when there is a clear, specific match to one of the targets above; otherwise "action" must be null.
- Never invent a path outside this list.
- "label" is a short button caption for the action, e.g. "View results" or "Go to my listings".
- Keep replies focused on real estate and this site; briefly decline unrelated requests.
- Output must be valid JSON and nothing else.`;

function parseAssistantReply(raw: string): { reply: string; action: AiChatAction | null } {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : raw;

  try {
    const parsed = JSON.parse(candidate) as { reply?: unknown; action?: { path?: unknown; label?: unknown } | null };
    const reply = typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply : raw.trim();

    let action: AiChatAction | null = null;
    const path = parsed.action?.path;
    if (typeof path === 'string' && ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      action = { type: 'navigate', path, label: typeof parsed.action?.label === 'string' ? parsed.action.label : undefined };
    }

    return { reply, action };
  } catch {
    return { reply: raw.trim() || "Sorry, I didn't quite catch that — could you rephrase?", action: null };
  }
}

function titleFromMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New chat';
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

async function requireOwnedSession(sessionId: number, userId: string) {
  const session = await aiChatRepository.findSession(sessionId);
  if (session.user_id !== userId) {
    throw new ApiException(403, 'FORBIDDEN', 'Not your conversation');
  }
  return session;
}

export const aiChatService = {
  listSessions(userId: string) {
    return aiChatRepository.listSessions(userId);
  },

  async messages(sessionId: number, userId: string) {
    await requireOwnedSession(sessionId, userId);
    return aiChatRepository.listMessages(sessionId);
  },

  async deleteSession(sessionId: number, userId: string) {
    await requireOwnedSession(sessionId, userId);
    await aiChatRepository.deleteSession(sessionId);
  },

  async sendMessage(userId: string, sessionId: number | null, message: string) {
    const session = sessionId
      ? await requireOwnedSession(sessionId, userId)
      : await aiChatRepository.createSession(userId, titleFromMessage(message));

    await aiChatRepository.addMessage(session.id, 'user', message);

    if (!groqService.isConfigured) {
      throw new ApiException(503, 'AI_NOT_CONFIGURED', 'The assistant is not configured yet — set GROQ_API_KEY on the server');
    }

    const history = await aiChatRepository.listMessages(session.id);
    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const raw = await groqService.chat(chatMessages);
    const { reply, action } = parseAssistantReply(raw);

    const assistantMessage = await aiChatRepository.addMessage(session.id, 'assistant', reply, action);
    await aiChatRepository.touchSession(session.id);

    return { session, message: assistantMessage };
  },
};
