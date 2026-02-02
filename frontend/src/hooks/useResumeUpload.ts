import { useState } from 'react';
import { resumeService, type UploadResumeResponse } from '../lib/api';
import { useToast } from '../hooks/use-toats';
import { useSavedIndexes } from './useSavedIndexes';

export function useResumeUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedData, setUploadedData] = useState<UploadResumeResponse | null>(null);
  const { toast } = useToast();
  const { loadIndexes } = useSavedIndexes();

  const uploadResumes = async (files: File[]) => {
    if (files.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um arquivo',
        variant: 'error',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simula progresso (você pode implementar upload com progresso real)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await resumeService.uploadResumes(files);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedData(result);

      // Recarrega os índices do servidor (que agora inclui o novo)
      await loadIndexes();

      toast({
        title: 'Sucesso!',
        description: `${result.indexed_files} currículos enviados e indexados`,
      });

      return result;
    } catch (error) {
      toast({
        title: 'Erro ao enviar currículos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'error',
      });
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const reset = () => {
    setUploadedData(null);
    setUploadProgress(0);
  };

  return {
    uploadResumes,
    isUploading,
    uploadProgress,
    uploadedData,
    reset,
  };
}