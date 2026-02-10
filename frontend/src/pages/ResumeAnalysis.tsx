import { useState, useEffect } from 'react';
import { FileSearch, Upload, Search, CheckCircle, AlertCircle, FileText, X, Plus, Lightbulb } from 'lucide-react';
import { API_URL, jobApplicationService } from '../lib/api';
import type { CreateJobApplicationRequest } from '../lib/api';
import { useToast } from '../hooks/use-toats';
import { cn } from '../lib/utils';
import { AppLayout } from '../components/layout/AppLayout';

interface JobApplication {
  id: number;
  user_id: string;
  company_name: string;
  job_title: string;
  application_date: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface ResumeAnalysis {
  match_percentage: number;
  missing_skills: string[];
  strengths: string[];
  overall_feedback: string;
  improvement_tips?: string[];
  resume_used?: string;
}

function ResumeAnalysis() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoadingApplications(true);
      const response = await jobApplicationService.listApplications();
      setApplications(response.applications);
    } catch (error) {
      toast({
        title: 'Erro ao carregar candidaturas',
        description: 'Não foi possível carregar suas candidaturas.',
        variant: 'error',
      });
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    // Validação: apenas 1 arquivo
    if (files && files.length > 1) {
      toast({ 
        title: 'Múltiplos arquivos', 
        description: 'Apenas 1 currículo é permitido. Selecione apenas um arquivo.', 
        variant: 'error' 
      });
      event.target.value = ''; // Limpa a seleção
      return;
    }
    
    const file = files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'Tipo inválido', description: 'Use PDF, TXT ou DOCX.', variant: 'error' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Arquivo grande', description: 'Máximo 10MB.', variant: 'error' });
        return;
      }
      setResumeFile(file);
      setAnalysis(null);
    }
  };

  const analyzeResume = async () => {
    if (!resumeFile || !selectedApplication) {
      toast({ title: 'Dados incompletos', description: 'Selecione currículo e vaga.', variant: 'error' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);

      const response = await fetch(`${API_URL}/api/v1/job-applications/analyze/${selectedApplication.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Falha na análise');

      const result = await response.json();
      setAnalysis(result);
      toast({ title: 'Análise concluída!', description: `${result.match_percentage}% de match.` });

    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível analisar.', variant: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-400 border-green-900 text-black';
    if (percentage >= 60) return 'bg-yellow-300 border-yellow-800 text-black';
    return 'bg-red-400 border-red-900 text-black';
  };



  const handleCreateApplication = async (data: CreateJobApplicationRequest) => {
    setIsCreating(true);
    try {
      await jobApplicationService.createApplication(data);
      toast({
        title: 'Candidatura criada!',
        description: 'A candidatura foi adicionada com sucesso.',
        variant: 'success',
      });
      setIsModalOpen(false);
      await loadApplications(); // Recarrega a lista
    } catch (error: any) {
      toast({
        title: 'Erro ao criar candidatura',
        description: error.message || 'Não foi possível criar a candidatura.',
        variant: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 font-sans text-black">
        <div className="max-w-7xl">
        {/* HEADER DA PÁGINA */}
        <div className="pb-4 min-[360px]:pb-6 sm:pb-8">
          <h1 className="text-responsive-xl font-black uppercase tracking-tighter mb-1">
            Análise de Currículo
          </h1>
          <p className="text-responsive-base text-gray-600 font-medium max-w-2xl break-words">
            Compare seu perfil com as vagas aplicadas e receba feedback instantâneo sobre seus pontos fortes e fracos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-[360px]:gap-6 lg:gap-8">
          {/* COLUNA ESQUERDA: INPUTS */}
          <div className="lg:col-span-5 space-y-4 min-[360px]:space-y-6 lg:space-y-8">
            {/* 1. UPLOAD CARD */}
            <div className="bg-white border-2 border-black p-3 min-[360px]:p-4 sm:p-6 lg:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-lg min-w-0">
              <div className="flex items-center gap-2 min-[360px]:gap-3 mb-3 min-[360px]:mb-4 sm:mb-6">
                <div className="bg-black text-white p-1.5 min-[360px]:p-2 rounded shrink-0">
                  <Upload className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5" />
                </div>
                <h2 className="text-base min-[360px]:text-lg sm:text-2xl font-black uppercase truncate">1. Seu Currículo</h2>
              </div>

                {!resumeFile ? (
                  <label className="block w-full min-w-0 border-2 border-dashed border-black bg-gray-50 p-4 min-[360px]:p-6 sm:p-8 text-center cursor-pointer hover:bg-yellow-50 transition-colors group rounded-lg">
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      multiple={false}
                    />
                    <Upload className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 mx-auto mb-2 min-[360px]:mb-4 text-gray-400 group-hover:text-black transition-colors shrink-0" />
                    <span className="font-bold text-sm min-[360px]:text-base sm:text-lg block uppercase mb-0.5 min-[360px]:mb-1">Clique para Upload</span>
                    <span className="text-xs min-[360px]:text-sm text-gray-500 font-medium block break-words">PDF, DOCX (Max 10MB) - Apenas 1 arquivo</span>
                  </label>
                ) : (
                <div className="bg-neo-primary border-2 border-black p-4 flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-8 h-8 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{resumeFile.name}</p>
                      <p className="text-xs text-gray-600">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setResumeFile(null)} className="p-2 hover:bg-red-200 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. SELEÇÃO DE VAGA */}
            <div className="bg-white border-2 border-black p-3 min-[360px]:p-4 sm:p-6 lg:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-lg min-w-0">
              <div className="flex items-center justify-between mb-3 min-[360px]:mb-4 sm:mb-6">
                <div className="flex items-center gap-2 min-[360px]:gap-3 min-w-0">
                  <div className="bg-black text-white p-1.5 min-[360px]:p-2 rounded shrink-0">
                    <Search className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5" />
                  </div>
                  <h2 className="text-base min-[360px]:text-lg sm:text-2xl font-black uppercase truncate">2. Selecionar Vaga</h2>
                </div>
              </div>

              {isLoadingApplications ? (
                <div className="text-center py-6 min-[360px]:py-8 text-gray-500 font-bold animate-pulse text-sm min-[360px]:text-base">Carregando vagas...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-6 min-[360px]:py-8 text-gray-500 font-bold bg-gray-100 rounded border border-gray-300 text-sm min-[360px]:text-base px-2">
                  Nenhuma candidatura encontrada.
                </div>
              ) : (
                <div className="space-y-2 min-[360px]:space-y-3 max-h-[240px] min-[360px]:max-h-[300px] overflow-y-auto pr-1 min-[360px]:pr-2 custom-scrollbar overflow-touch">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApplication(app)}
                      className={cn(
                        "p-3 min-[360px]:p-4 border-2 rounded-lg cursor-pointer transition-all min-w-0",
                        selectedApplication?.id === app.id
                          ? "bg-neo-secondary text-neo-secondary border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] translate-x-1"
                          : "bg-white border-gray-200 hover:border-black hover:shadow-md text-gray-700"
                      )}
                    >
                      <h3 className="font-black text-sm uppercase leading-tight">{app.job_title}</h3>
                      <p className={cn("text-xs font-bold mt-1", selectedApplication?.id === app.id ? "text-neo-secondary" : "text-gray-500")}>
                        {app.company_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BOTÃO DE AÇÃO */}
            <button
              onClick={analyzeResume}
              disabled={!resumeFile || !selectedApplication || isAnalyzing}
              className="w-full min-w-0 py-3 min-[360px]:py-4 sm:py-5 bg-neo-primary cursor-pointer border-2 border-black font-black text-base min-[360px]:text-lg sm:text-xl uppercase tracking-wider hover:bg-yellow-400 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg"
            >
              {isAnalyzing ? 'Processando...' : 'Analisar Compatibilidade'}
            </button>
          </div>

          {/* COLUNA DIREITA: RESULTADOS */}
          <div className="lg:col-span-7 min-w-0">
            {analysis ? (
              <div className="bg-white border-2 border-black p-3 min-[360px]:p-4 sm:p-6 lg:p-8 xl:p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] lg:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-lg animate-in slide-in-from-bottom-4 overflow-hidden min-w-0">
                {/* MATCH SCORE */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 border-b-2 border-black pb-6 sm:pb-8 mb-6 sm:mb-8">
                  <div className="text-center sm:text-left min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase mb-2">Resultado da Análise</h2>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">Compatibilidade calculada com base na descrição da vaga.</p>
                    {analysis.resume_used && (
                      <p className="text-xs sm:text-sm text-blue-600 font-bold mt-2 truncate">
                        Currículo usado: {analysis.resume_used}
                      </p>
                    )}
                  </div>
                  <div className={cn("flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0", getMatchColor(analysis.match_percentage))}>
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black">{analysis.match_percentage}%</span>
                    <span className="text-[10px] font-bold uppercase">Match</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
                  {/* PONTOS FORTES */}
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black uppercase mb-4 text-green-700">
                      <CheckCircle className="w-5 h-5" /> Pontos Fortes
                    </h3>
                    <ul className="space-y-3">
                      {analysis.strengths.map((item, idx) => (
                        <li key={idx} className="bg-green-50 border border-green-200 p-3 rounded text-sm font-medium text-green-900">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* PONTOS DE MELHORIA */}
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black uppercase mb-4 text-red-600 whitespace-nowrap">
                      <AlertCircle className="w-5 h-5" /> Faltou no Currículo
                    </h3>
                    <ul className="space-y-3">
                      {analysis.missing_skills.map((item, idx) => (
                        <li key={idx} className="bg-red-50 border border-red-200 p-3 rounded text-sm font-medium text-red-900">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* FEEDBACK GERAL */}
                <div className="bg-gray-50 border-2 border-black p-4 sm:p-6 rounded-lg">
                  <h3 className="text-base sm:text-lg font-black uppercase mb-3">Feedback Geral</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium break-words">
                    {analysis.overall_feedback}
                  </p>
                </div>

                {/* DICAS DE MELHORIA */}
                {analysis.improvement_tips && analysis.improvement_tips.length > 0 && (
                  <div className="bg-neo-primary border-2 border-neo-secondary p-4 sm:p-6 rounded-lg mt-4 sm:mt-6">
                    <h3 className="flex items-center gap-2 text-lg font-black uppercase mb-3 text-neo-secondary">
                      <Lightbulb className="w-5 h-5" /> Dicas de Melhoria
                    </h3>
                    <ul className="space-y-3">
                      {analysis.improvement_tips.map((tip, idx) => (
                        <li key={idx} className="justify-between items-center bg-white border border-neo-secondary p-3 rounded text-sm font-medium text-neo-secondary flex gap-2">
                          <span className="flex-shrink-0 w-3 h-3 rounded-full bg-neo-secondary text-neo-secondary font-black text-md flex items-center justify-center">{idx + 1}</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-8">
                <FileSearch className="w-20 h-20 text-gray-300 mb-6" />
                <h3 className="text-2xl font-black text-gray-400 uppercase">Aguardando Análise</h3>
                <p className="text-gray-400 max-w-sm mt-2">
                  Selecione seu currículo e a vaga ao lado para gerar o relatório de compatibilidade.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* MODAL DE ADICIONAR CANDIDATURA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 min-[360px]:p-4 z-[9999] overflow-y-auto overflow-touch">
          <div className="relative w-full max-w-md bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 min-[360px]:p-4 sm:p-6 my-auto min-w-0 mx-1 min-[360px]:mx-0">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6 border-b-2 border-black/10 pb-4">
              <h3 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                Adicionar Candidatura
              </h3>
              <button
                className="p-1 hover:bg-red-100 border-2 border-transparent hover:border-black rounded transition-colors"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <ApplicationForm
              onSubmit={handleCreateApplication}
              onCancel={() => setIsModalOpen(false)}
              isLoading={isCreating}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// Componente de Formulário
interface ApplicationFormProps {
  onSubmit: (data: CreateJobApplicationRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function ApplicationForm({ onSubmit, onCancel, isLoading }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    application_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      company_name: '',
      job_title: '',
      application_date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* EMPRESA */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
          Empresa
        </label>
        <input
          type="text"
          className="w-full px-3 py-2.5 text-sm font-medium bg-gray-50 text-black border-2 border-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 placeholder:text-gray-400"
          placeholder="Ex: Google, Amazon..."
          value={formData.company_name}
          onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
          required
        />
      </div>

      {/* CARGO */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
          Cargo / Vaga
        </label>
        <input
          type="text"
          className="w-full px-3 py-2.5 text-sm font-medium bg-gray-50 text-black border-2 border-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 placeholder:text-gray-400"
          placeholder="Ex: Senior Frontend Developer"
          value={formData.job_title}
          onChange={(e) => setFormData((prev) => ({ ...prev, job_title: e.target.value }))}
          required
        />
      </div>

      {/* DATA */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
          Data da Candidatura
        </label>
        <input
          type="date"
          className="w-full px-3 py-2.5 text-sm font-medium bg-gray-50 text-black border-2 border-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          value={formData.application_date}
          onChange={(e) => setFormData((prev) => ({ ...prev, application_date: e.target.value }))}
          required
        />
      </div>

      {/* DESCRIÇÃO */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
          Descrição da Vaga
        </label>
        <textarea
          className="w-full px-3 py-2.5 text-sm font-medium bg-gray-50 text-black border-2 border-black rounded-none focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 placeholder:text-gray-400 resize-none"
          rows={4}
          placeholder="Cole aqui a descrição da vaga ou detalhes importantes..."
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          required
        />
      </div>

      {/* BOTÕES */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wide bg-white text-black border-2 border-black hover:bg-gray-100 active:bg-gray-200 transition-colors"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wide bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_#22c55e] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#22c55e] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : 'Salvar Candidatura'}
        </button>
      </div>
    </form>
  );
}

export default ResumeAnalysis;