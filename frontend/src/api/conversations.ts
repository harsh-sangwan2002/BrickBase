import { apiClient } from './client';
import type { Conversation, Message } from '@/types';

export const conversationsApi = {
  list: () => apiClient.get<{ items: Conversation[] }>('/conversations'),
  messages: (id: number) => apiClient.get<{ items: Message[] }>(`/conversations/${id}/messages`),
  send: (id: number, body: string) => apiClient.post<Message>(`/conversations/${id}/messages`, { body }),
};
