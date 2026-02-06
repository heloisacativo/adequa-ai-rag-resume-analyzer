import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import FileInput from "../components/FileInput";
import HistoryChat from "../components/HistoryChat";
import ChatProvider from "../contexts/ChatProvider";
import { useResumeUpload } from "../hooks/useResumeUpload";
import { useResumes } from "../hooks/useResumes";
import { resumeService, chatService } from "../lib/api";
import { useToast } from "../hooks/use-toats";
import { useAuth } from "../contexts/AuthContext";
import { Upload, Database, FileText, ArrowLeft, CheckCircle, Clock, Loader2, Play, Search, FolderOpen } from "lucide-react";
import type { ResumeGroup } from "../lib/api";
import { cn } from "../lib/utils";

import { API_URL } from '../lib/api';

interface DatabaseResume {
  resume_id: string;
  candidate_name: string;
  file_name: string;
  uploaded_at: string;
  is_indexed: boolean;
  vector_index_id?: string | null;
}

interface LocalResume {
  id: string;
  candidate_name: string;
  file_name: string;
  file: File | null;
  uploaded_at: string;
  status: string;
}

function Analysis() {
  const location = useLocation();
  const openSessionId = (location.state as { openSessionId?: string } | null)?.openSessionId;
  const [currentStep, setCurrentStep] = useState(0);
  const [indexId, setIndexId] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<'upload' | 'local'>('upload');
  const [localResumes, setLocalResumes] = useState<LocalResume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [resumeSearchQuery, setResumeSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sessionIdFromAnalisar, setSessionIdFromAnalisar] = useState<string | null>(null);
  const analisarInProgressRef = useRef(false);
  const [resumeGroups, setResumeGroups] = useState<ResumeGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  const { user } = useAuth();
  const { uploadedData } = useResumeUpload();
  const { toast } = useToast();
  const { resumes: resumesFromApi, isLoading: loadingResumes, invalidate: invalidateResumes } = useResumes(user?.id);

  const databaseResumes: DatabaseResume[] = useMemo(() => {
    const list = Array.isArray(resumesFromApi) ? resumesFromApi : [];
    return list.map((r) => ({
      resume_id: r.resume_id,
      candidate_name: r.candidate_name,
      file_name: r.file_name,
      uploaded_at: r.uploaded_at,
      is_indexed: r.is_indexed,
      vector_index_id: r.vector_index_id ?? undefined,
    }));
  }, [resumesFromApi]);

  useEffect(() => {
    if (uploadMode !== "local" || !user?.id) return;
    let cancelled = false;
    setLoadingGroups(true);
    resumeService
      .listResumeGroups()
      .then((res) => {
        if (!cancelled) setResumeGroups(res.groups);
      })
      .catch(() => {
        if (!cancelled) setResumeGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGroups(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uploadMode, user?.id]);

  const applyGroupSelection = async (groupId: string) => {
    if (!groupId) {
      setSelectedGroupId("");
      setSelectedResumes([]);
      return;
    }
    setSelectedGroupId(groupId);
    try {
      const res = await resumeService.getGroupResumes(groupId);
      const ids = (res.resumes ?? []).map((r) => r.resume_id).filter((id) => databaseResumes.some((d) => d.resume_id === id));
      setSelectedResumes(ids);
    } catch {
      setSelectedResumes([]);
    }
  };

  // Steps removidos para interface mais clean

  const handleLocalUpload = async () => {
    if (selectedResumes.length === 0) return;
    if (analisarInProgressRef.current) return;
    analisarInProgressRef.current = true;

    try {
      setUploading(true);

      const selectedFromDb = selectedResumes.filter((id) =>
        databaseResumes.some((r) => r.resume_id === id)
      );
      const selectedFromLocal = selectedResumes.filter((id) =>
        localResumes.some((r) => r.id === id)
      );
      const allSelectedAreFromDb = selectedFromLocal.length === 0;

      if (allSelectedAreFromDb && selectedFromDb.length > 0) {
        // Currículos já no banco: usar o vector_index_id do selecionado (sem reenviar)
        const firstDbResume = databaseResumes.find((r) => r.resume_id === selectedFromDb[0]);
        const indexIdToUse = firstDbResume?.vector_index_id?.trim();
        if (!indexIdToUse) {
          toast({
            title: 'Erro',
            description: 'O currículo selecionado não possui índice de análise. Exclua e envie novamente.',
            variant: 'error',
          });
          return;
        }
        setIndexId(indexIdToUse);
        if (user?.id) {
          try {
            const session = await chatService.createSession({
              user_id: user.id,
              title: `Análise de currículos (${selectedResumes.length})`,
            });
            setSessionIdFromAnalisar(session.session_id);
          } catch (e) {
            console.error("Erro ao criar sessão de chat:", e);
          }
        }
        setCurrentStep(1);
        setSelectedResumes([]);
        return;
      }

      // Há currículos locais: enviar apenas os arquivos locais (não reenviar os do banco)
      const filesToUpload: File[] = [];
      for (const resumeId of selectedFromLocal) {
        const localResume = localResumes.find((r) => r.id === resumeId);
        if (localResume?.file) filesToUpload.push(localResume.file);
      }

      if (filesToUpload.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum arquivo válido para envio. Selecione currículos com arquivo anexado.',
          variant: 'error',
        });
        return;
      }

      const data = await resumeService.uploadResumes(filesToUpload);
      setIndexId(data.vector_index_id);
      if (user?.id) {
        try {
          const session = await chatService.createSession({
            user_id: user.id,
            title: `Análise de currículos (${selectedResumes.length})`,
          });
          setSessionIdFromAnalisar(session.session_id);
        } catch (e) {
          console.error("Erro ao criar sessão de chat:", e);
        }
      }
      setCurrentStep(1);
      setSelectedResumes([]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao iniciar análise';
      toast({
        title: 'Erro ao iniciar análise',
        description: message,
        variant: 'error',
      });
    } finally {
      setUploading(false);
      analisarInProgressRef.current = false;
    }
  };

  const toggleResumeSelection = (resumeId: string) => {
    setSelectedResumes(prev => 
      prev.includes(resumeId) ? prev.filter(id => id !== resumeId) : [...prev, resumeId]
    );
  };

  const handleBack = () => {
    setCurrentStep(0);
    setIndexId("");
    setSelectedResumes([]);
  };

  const mergedResumesForSelection = useMemo(() => {
    const dbIds = new Set(databaseResumes.map((r) => r.resume_id));
    const dbFileNames = new Set(databaseResumes.map((r) => r.file_name));
    const localOnly = localResumes.filter(
      (l) => !dbIds.has(l.id) && !dbFileNames.has(l.file_name)
    );
    return [...databaseResumes, ...localOnly] as (DatabaseResume | LocalResume)[];
  }, [databaseResumes, localResumes]);

  const filteredResumesForSelection = useMemo(() => {
    const q = resumeSearchQuery.trim().toLowerCase();
    if (!q) return mergedResumesForSelection;
    return mergedResumesForSelection.filter(
      (r) =>
        r.candidate_name.toLowerCase().includes(q) ||
        r.file_name.toLowerCase().includes(q)
    );
  }, [mergedResumesForSelection, resumeSearchQuery]);

  return (
    <ChatProvider indexId={indexId}>
      <div className="min-h-screen bg-gray-50 font-sans text-black pb-20">
        {/* Background Grid Sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0" />

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10 h-full">
          
          {/* Header da Página */}
          <div className="mb-5">
            <p className="text-gray-600 font-medium">
              Utilize Inteligência Artificial para analisar e ranquear candidatos.
            </p>
          </div>

          {/* Stepper removido para interface mais clean */}
          
          {/* PASSO 1: SELEÇÃO */}
          {currentStep === 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Seletor de Modo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setUploadMode('upload')}
                  className={cn(
                    "cursor-pointer relative group p-6 text-left transition-all duration-200 border-2 border-black rounded-lg",
                    uploadMode === 'upload' 
                      ? "bg-neo-secondary text-neo-primary-content  " 
                      : "bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:border-black"
                  )}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={cn("p-3 rounded-lg border-1 border-black", uploadMode === 'upload' ? "bg-white" : "bg-gray-100")}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-md font-black">Fazer Upload</h3>
                  </div>
                  <p className="text-sm font-medium opacity-80">Carregar novos arquivos PDF do seu computador para análise</p>
                </button>

                <button
                  onClick={() => setUploadMode('local')}
                  disabled={mergedResumesForSelection.length === 0}
                  className={cn(
                    "cursor-pointer relative group p-6 text-left transition-all duration-200 border-2 border-black rounded-lg",
                    uploadMode === 'local'
                      ? "bg-neo-secondary text-neo-primary-content"
                      : "bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:border-black",
                    mergedResumesForSelection.length === 0 && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={cn("p-3 rounded-lg border-1 border-black", uploadMode === 'local' ? "bg-white" : "bg-gray-100")}>
                      <Database className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-md font-black" style={{ whiteSpace: 'nowrap' }}>Selecionar Existentes</h3>
                      <span className="text-xs font-bold border border-black px-1.5 rounded bg-black text-white w-fit mt-1">
                        {mergedResumesForSelection.length} Disponíveis
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium opacity-80">Utilizar currículos já cadastrados no sistema.</p>
                </button>
              </div>

              {/* Área de Conteúdo (Upload ou Lista) */}
              <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
                
                {/* MODO UPLOAD */}
                {uploadMode === 'upload' && (
                  <div className="space-y-6">
                    <div className="border-b-2 border-gray-100">
                      <h3 className="text-2xl text-neo-secondary">Adicionar currículos</h3>
                      <p className="text-neo-secondary/70 font-bold text-sm">Arraste os currículos para análise em PDF ou clique para selecionar.</p>
                    </div>
                    
                    <FileInput 
                      label="" 
                      setIndexId={setIndexId}
                      onSuccess={() => {
                        invalidateResumes();
                        setCurrentStep(1);
                      }}
                    />

                    {uploadedData && (
                      <div className="flex items-center gap-3 bg-green-100 border-2 border-green-600 text-green-800 p-4 rounded font-bold">
                        <CheckCircle className="w-5 h-5" />
                        <span>{uploadedData.indexed_files} arquivo(s) processado(s) com sucesso!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* MODO SELEÇÃO LOCAL/DB */}
                {uploadMode === 'local' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center border-b-2 border-gray-100 pb-4 gap-4">
                      <div>
                        <h3 className="text-2xl font-black uppercase">Currículos Salvos</h3>
                        <p className="text-gray-500 font-bold text-sm">Selecione os candidatos para compor a base de análise.</p>
                      </div>
                      
                      {selectedResumes.length > 0 && (
                        <button
                          onClick={handleLocalUpload}
                          disabled={uploading}
                          className="cursor-pointer flex items-center gap-2 border-2 border-black bg-neo-primary text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          {uploading ? 'Processando...' : `Analisar (${selectedResumes.length})`}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2 min-w-0 sm:min-w-[200px]">
                        <FolderOpen className="w-4 h-4 text-gray-500 shrink-0" />
                        <label className="text-xs font-black uppercase text-gray-600 shrink-0">Usar grupo:</label>
                        <select
                          value={selectedGroupId}
                          onChange={(e) => applyGroupSelection(e.target.value)}
                          disabled={loadingGroups}
                          className="flex-1 min-w-0 p-2 border-2 border-gray-200 rounded font-medium text-sm focus:border-black focus:outline-none bg-white disabled:opacity-70"
                        >
                          <option value="">Nenhum</option>
                          {resumeGroups.map((g) => (
                            <option key={g.group_id} value={g.group_id}>
                              {g.name} ({g.resume_count})
                            </option>
                          ))}
                        </select>
                        <Link
                          to="/resumes/groups"
                          className="text-xs font-bold text-gray-600 hover:text-black underline underline-offset-2 shrink-0"
                        >
                          Gerenciar grupos
                        </Link>
                      </div>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Pesquisar por nome ou arquivo..."
                          value={resumeSearchQuery}
                          onChange={(e) => setResumeSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded font-medium text-sm placeholder:text-gray-400 focus:border-black focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    {loadingResumes ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-black" />
                        <p className="font-bold">Carregando base de dados...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {filteredResumesForSelection.map((resume) => {
                          const isLocal = 'id' in resume;
                          const id = isLocal ? (resume as LocalResume).id : (resume as DatabaseResume).resume_id;
                          const isSelected = selectedResumes.includes(id);

                          return (
                            <label 
                              key={id}
                              className={cn(
                                "cursor-pointer relative flex flex-col p-2.5 border-2 rounded transition-all duration-200",
                                isSelected 
                                  ? "border-black bg-blue-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]" 
                                  : "border-gray-200 bg-white hover:border-black hover:shadow-sm"
                              )}
                            >
                              <div className="flex justify-between items-start mb-1.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleResumeSelection(id)}
                                  className="checkbox checkbox-sm rounded-sm border-2 border-black checked:bg-black checked:text-white"
                                  disabled={isLocal && !(resume as LocalResume).file}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm leading-tight mb-0.5 truncate" title={resume.candidate_name}>
                                  {resume.candidate_name}
                                </h4>
                                <div className="flex items-center gap-1 text-gray-500 text-[11px] font-medium mb-1.5">
                                  <FileText className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{resume.file_name}</span>
                                </div>
                              </div>

                              <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                                <div className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(resume.uploaded_at).toLocaleDateString('pt-BR')}
                                </div>
                                {isLocal && !(resume as LocalResume).file && (
                                  <span className="text-red-500 font-bold text-[9px]">Sem Arquivo</span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSO 2: ANÁLISE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header de Ação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white">                
                <button 
                  onClick={handleBack}
                  className="flex items-center gap-2 px-2 py-2 text-sm font-bold border-2 border-black rounded hover:bg-gray-100 transition-colors sm:mt-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </div>

              {/* Chat Component */}
                <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full">
                <HistoryChat indexId={indexId} openSessionId={openSessionId ?? sessionIdFromAnalisar ?? undefined} />
                </div>
            </div>
          )}

        </div>
        </div>
    </ChatProvider>
  );
}

export default Analysis;