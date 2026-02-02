import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  Bot,
  Send,
  Loader2,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { mockJobs, mockResumes } from '../components/data/mockData';
import type { Resume } from '../types/Index';

export default function AIAnalysis() {
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const activeJobs = mockJobs.filter((j) => j.status === 'active');
  const jobResumes = selectedJobId ? mockResumes.filter((r) => r.job_id === selectedJobId) : [];
  const analyzedResumes = jobResumes.filter((r) => r.status !== 'new');
  const rankedResumes = [...analyzedResumes].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = question;
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setQuestion('');
    setIsAsking(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResponse = getMockResponse(userMessage);
    setChatHistory((prev) => [...prev, { role: 'assistant', content: mockResponse }]);
    setIsAsking(false);
  };

  const getMockResponse = (q: string): string => {
    const lowerQ = q.toLowerCase();

    if (lowerQ.includes('melhor') || lowerQ.includes('encaixa') || lowerQ.includes('ranking')) {
      return `Com base na análise dos ${analyzedResumes.length} currículos, os candidatos que melhor se encaixam são:\n\n1. **Lucas Oliveira** (92%) - Excelente match técnico, 6 anos de experiência com React\n2. **Ana Paula Costa** (88%) - Forte em TypeScript e design systems\n3. **Rafael Santos** (75%) - Bom potencial, mas precisa desenvolver TypeScript\n\nLucas Oliveira é a recomendação principal devido à combinação de experiência técnica e soft skills alinhadas.`;
    }

    if (lowerQ.includes('técnic') || lowerQ.includes('requisit')) {
      return `Analisando os requisitos técnicos da vaga:\n\n✅ **Totalmente atendidos:**\n- React: 3 candidatos\n- Git: Todos os candidatos\n\n⚠️ **Parcialmente atendidos:**\n- TypeScript: 2 candidatos com nível avançado\n- Tailwind/CSS: 2 candidatos\n\n❌ **Lacunas comuns:**\n- Testes automatizados: Apenas 1 candidato\n- Design Systems: 2 candidatos`;
    }

    return `Analisei sua pergunta em relação aos ${analyzedResumes.length} currículos disponíveis.\n\nCom base nos dados, posso afirmar que os candidatos apresentam perfis variados. Para uma análise mais específica, considere perguntar sobre:\n- Ranking de candidatos\n- Requisitos técnicos específicos\n- Comparação entre candidatos\n- Pontos fortes e lacunas`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-neo-primary" />
            Análise com IA
          </h1>
          <p className="text-base-content/70">
            Use inteligência artificial para analisar e ranquear candidatos.
          </p>
        </div>

        {/* Job Selection */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title text-lg">Selecione uma vaga</h2>
            <p className="text-base-content/70 mb-4">
              Escolha a vaga para analisar os currículos associados
            </p>
            <div className="flex items-center gap-4">
              <select
                className="select select-bordered w-full max-w-md"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="">Selecione uma vaga</option>
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.resumes_count} currículos)
                  </option>
                ))}
              </select>
              {selectedJobId && jobResumes.some((r) => r.status === 'new') && (
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Analisar todos
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedJobId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
            {/* Ranking */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neo-primary" />
                  Ranking de Candidatos
                </h2>
                <p className="text-base-content/70 mb-4">
                  Ordenados por score de compatibilidade
                </p>
                {rankedResumes.length === 0 ? (
                  <div className="text-center py-8 text-base-content/70">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum currículo analisado ainda.</p>
                    <p className="text-sm">Faça upload e analise currículos para ver o ranking.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankedResumes.map((resume, index) => (
                      <div
                        key={resume.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-success text-success-content'
                              : index === 1
                              ? 'bg-accent text-accent-content'
                              : index === 2
                              ? 'bg-warning text-warning-content'
                              : 'bg-base-200 text-base-content'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {resume.candidate_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <progress
                              value={resume.score}
                              max={100}
                              className={`progress ${getScoreBg(resume.score || 0)} h-2 flex-1 max-w-[100px]`}
                            />
                            <span className={`text-sm font-bold ${getScoreColor(resume.score || 0)}`}>
                              {resume.score}%
                            </span>
                          </div>
                        </div>
                        <div
                          className={`badge ${
                            resume.status === 'shortlist'
                              ? 'badge-success'
                              : resume.status === 'rejected'
                              ? 'badge-error'
                              : 'badge-outline'
                          }`}
                        >
                          {resume.status === 'shortlist'
                            ? 'Shortlist'
                            : resume.status === 'rejected'
                            ? 'Rejeitado'
                            : 'Analisado'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat with AI */}
            <div className="card bg-base-100 shadow-xl flex flex-col">
              <div className="card-body flex-1 flex flex-col">
                <h2 className="card-title text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-neo-primary" />
                  Pergunte à IA
                </h2>
                <p className="text-base-content/70 mb-4">
                  Faça perguntas sobre os candidatos e a vaga
                </p>
                {/* Chat History */}
                <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto space-y-4 mb-4 p-4 bg-base-200 rounded-lg">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-base-content/70">
                      <Bot className="w-10 h-10 mb-3 opacity-50" />
                      <p className="text-sm text-center">
                        Pergunte algo como:
                      </p>
                      <p className="text-sm text-center italic mt-2">
                        "Quais candidatos melhor se encaixam nessa vaga?"
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-neo-primary text-neo-primary-content'
                              : 'bg-base-100 border border-base-300'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isAsking && (
                    <div className="flex justify-start">
                      <div className="bg-base-100 border border-base-300 rounded-lg px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Digite sua pergunta..."
                    className="textarea textarea-bordered resize-none flex-1"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={isAsking || !question.trim()}
                    className="btn btn-primary h-auto"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedJobId && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body py-16 text-center">
              <Bot className="w-16 h-16 mx-auto text-base-content/70 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Comece selecionando uma vaga
              </h3>
              <p className="text-base-content/70 max-w-md mx-auto">
                Selecione uma vaga acima para visualizar o ranking de candidatos e fazer perguntas
                à IA sobre os currículos recebidos.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
