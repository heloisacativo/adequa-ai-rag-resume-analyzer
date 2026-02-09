import { useState, useEffect, useCallback } from 'react';
import { chatService, type ChatSession } from '../lib/api';

export function useChatSessions(userId?: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await chatService.getUserSessions(userId);
      setSessions(data);
    } catch (e) {
      console.error('Erro ao carregar sessões de chat:', e);
      setError(e instanceof Error ? e.message : 'Erro ao carregar sessões de chat');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const invalidate = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  const refetch = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoading,
    error,
    invalidate,
    refetch,
  };
}
