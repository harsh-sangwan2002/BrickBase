import { apiClient } from './client';
import type { AiChatMessage, AiChatSession } from '@/types';

export const aiChatApi = {
  listSessions: () => apiClient.get<{ items: AiChatSession[] }>('/ai/sessions'),
  messages: (sessionId: number) => apiClient.get<{ items: AiChatMessage[] }>(`/ai/sessions/${sessionId}/messages`),
  send: (message: string, sessionId?: number) =>
    apiClient.post<{ session: AiChatSession; message: AiChatMessage }>('/ai/messages', {
      message,
      session_id: sessionId,
    }),
  deleteSession: (sessionId: number) => apiClient.delete<{ success: true }>(`/ai/sessions/${sessionId}`),
};
