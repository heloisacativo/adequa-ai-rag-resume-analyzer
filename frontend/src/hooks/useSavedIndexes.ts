import { useState, useEffect } from 'react';
import { resumeService } from '../lib/api';

export interface SavedIndex {
  indexId: string;
  name: string;
  createdAt: string;
  resumeCount?: number;
}

export function useSavedIndexes() {
  const [savedIndexes, setSavedIndexes] = useState<SavedIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIndexes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await resumeService.listIndexes();
      
      // Converte a resposta da API para o formato SavedIndex
      const indexes: SavedIndex[] = Object.values(response.indexes).map((index) => ({
        indexId: index.vector_index_id,
        name: `Upload ${new Date(index.first_uploaded_at).toLocaleDateString('pt-BR')} - ${index.resume_count} currículo(s)`,
        createdAt: index.first_uploaded_at,
        resumeCount: index.resume_count,
      }));
      
      setSavedIndexes(indexes);
    } catch (e) {
      console.error('Erro ao carregar índices do servidor:', e);
      setError(e instanceof Error ? e.message : 'Erro ao carregar índices');
      setSavedIndexes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndexes();
  }, []);

  const saveIndex = async (_indexId: string, _name: string, _resumeCount?: number) => {
    await loadIndexes();
  };

  const removeIndex = async (_indexId: string) => {
    await loadIndexes();
  };

  return {
    savedIndexes,
    saveIndex,
    removeIndex,
    loadIndexes,
    loading,
    error,
  };
}
