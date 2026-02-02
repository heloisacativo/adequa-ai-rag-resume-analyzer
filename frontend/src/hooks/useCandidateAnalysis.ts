import { useState } from 'react';
import { resumeService, type AnalyzeCandidatesResponse } from '../lib/api';
import { useToast } from '../hooks/use-toats';

export function useCandidateAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCandidatesResponse | null>(null);
  const { toast } = useToast();

  const analyzeCandidates = async (jobDescription: string, indexId: string) => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Erro',
        description: 'Descrição da vaga é obrigatória',
        variant: 'error',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await resumeService.analyzeCandidates(jobDescription, indexId);
      setAnalysisResult(result);

      toast({
        title: 'Análise concluída!',
        description: `${result.total_candidates} candidatos analisados`,
      });

      return result;
    } catch (error) {
      toast({
        title: 'Erro ao analisar candidatos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'error',
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setAnalysisResult(null);
  };

  return {
    analyzeCandidates,
    isAnalyzing,
    analysisResult,
    reset,
  };
}