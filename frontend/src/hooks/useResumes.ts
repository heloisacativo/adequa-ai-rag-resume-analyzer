import { useState, useEffect, useCallback } from 'react';
import { resumeService, type ResumeItem } from '../lib/api';

export function useResumes(userId?: string) {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResumes = useCallback(async () => {
    if (!userId) {
      setResumes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await resumeService.listResumes();
      setResumes(response.resumes);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao carregar currículos';
      
      // Se for erro de autenticação, limpar token e redirecionar
      if (errorMessage.includes('Could not validate credentials') || 
          errorMessage.includes('401') ||
          errorMessage.includes('Unauthorized')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      setError(errorMessage);
      setResumes([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const invalidate = useCallback(() => {
    loadResumes();
  }, [loadResumes]);

  return {
    resumes,
    isLoading,
    error,
    invalidate,
  };
}
