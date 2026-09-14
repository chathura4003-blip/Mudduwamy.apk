import { apiClient } from './apiClient';
import type { ChatMessage, ChatReaction } from '../types';

export interface SendMessagePayload {
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_avatar?: string | null;
  message_type: 'text' | 'image' | 'file' | 'link';
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: string | null;
  reply_to_id?: string | null;
  reply_to_name?: string | null;
  reply_to_content?: string | null;
  is_pinned?: boolean;
}

export const chatApi = {
  getMessages: async (roomId = 'general', sinceId?: string): Promise<ChatMessage[]> => {
    const url = `/api/chat?room_id=${encodeURIComponent(roomId)}${sinceId ? `&since=${encodeURIComponent(sinceId)}` : ''}`;
    const res = await apiClient<{ success?: boolean; messages?: ChatMessage[]; data?: ChatMessage[] } | ChatMessage[]>(url);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.messages)) return res.messages;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  sendMessage: async (payload: SendMessagePayload): Promise<ChatMessage | null> => {
    try {
      const res = await apiClient<{ success: boolean; message: ChatMessage }>('/api/chat', {
        method: 'POST',
        body: payload,
      });
      return res?.message || null;
    } catch (e) {
      console.error('Failed to send message:', e);
      throw e;
    }
  },

  toggleReaction: async (messageId: string, emoji: string, userId: string, userName: string): Promise<ChatReaction[]> => {
    try {
      const res = await apiClient<{ success: boolean; reactions: ChatReaction[] }>('/api/chat', {
        method: 'POST',
        body: {
          action: 'reaction',
          message_id: messageId,
          emoji,
          user_id: userId,
          user_name: userName,
        },
      });
      return res?.reactions || [];
    } catch (e) {
      console.error('Failed to toggle reaction:', e);
      return [];
    }
  },

  togglePin: async (messageId: string): Promise<boolean> => {
    try {
      const res = await apiClient<{ success: boolean; is_pinned: boolean }>('/api/chat', {
        method: 'POST',
        body: {
          action: 'toggle_pin',
          message_id: messageId,
        },
      });
      return res?.is_pinned ?? false;
    } catch (e) {
      console.error('Failed to toggle pin:', e);
      return false;
    }
  },

  deleteMessage: async (messageId: string): Promise<boolean> => {
    try {
      await apiClient(`/api/chat?id=${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
      return true;
    } catch (e) {
      console.error('Failed to delete message:', e);
      return false;
    }
  },

  clearRoom: async (roomId: string): Promise<boolean> => {
    try {
      await apiClient(`/api/chat?clear_room=${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      return true;
    } catch (e) {
      console.error('Failed to clear room messages:', e);
      return false;
    }
  },
};
