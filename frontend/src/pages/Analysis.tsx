import { useState, useEffect } from "react";
import FileInput from "../components/FileInput";
import HistoryChat from "../components/HistoryChat";
import ChatProvider from "../contexts/ChatProvider";
import { useResumeUpload } from "../hooks/useResumeUpload";
import { resumeService } from "../lib/api";
import { useToast } from "../hooks/use-toats";
import { Upload, Database, FileText, ArrowLeft, CheckCircle, Clock, Loader2, Play } from "lucide-react";
import { cn } from "../lib/utils";

import { API_URL } from '../lib/api';

interface DatabaseResume {
  resume_id: string;
  candidate_name: string;
  file_name: string;
  uploaded_at: string;
  is_indexed: boolean;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [indexId, setIndexId] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<'upload' | 'local'>('upload');
  const [localResumes, setLocalResumes] = useState<LocalResume[]>([]);
  const [databaseResumes, setDatabaseResumes] = useState<DatabaseResume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const { uploadedData } = useResumeUpload();
  const { toast } = useToast();

  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      const saved = localStorage.getItem('local_resumes');
      if (saved) {
        try {
          const parsedResumes = JSON.parse(saved);
          const resumesWithFiles = parsedResumes.map((resume: any) => ({
            ...resume,
            file: resume.fileBase64 ? base64ToFile(resume.fileBase64, resume.file_name) : null
          }));
          setLocalResumes(resumesWithFiles);
        } catch (error) {
          console.error('Erro ao carregar currículos locais:', error);
        }
      }
      
      try {
        const response = await resumeService.listResumes();
        setDatabaseResumes(response.resumes);
      } catch (error) {
        console.error('Erro ao carregar currículos do banco:', error);
        if (saved) {
          try {
            const parsedResumes = JSON.parse(saved);
            const dbResumes: DatabaseResume[] = parsedResumes.map((r: any) => ({
              resume_id: r.id,
              candidate_name: r.candidate_name,
              file_name: r.file_name,
              uploaded_at: r.uploaded_at,
              is_indexed: r.status === 'analyzed'
            }));
            setDatabaseResumes(dbResumes);
          } catch (fallbackError) {
            console.error('Erro no fallback:', fallbackError);
          }
        }
      } finally {
        setLoadingResumes(false);
      }
    };
    
    loadResumes();
  }, []);

  // Steps removidos para interface mais clean

  const handleLocalUpload = async () => {
    if (selectedResumes.length === 0) return;

    try {
      setUploading(true);
      const filesToUpload: File[] = [];

      for (const resumeId of selectedResumes) {
        const localResume = localResumes.find(r => r.id === resumeId);
        if (localResume && localResume.file) {
          filesToUpload.push(localResume.file);
          continue;
        }

        const dbResume = databaseResumes.find(r => r.resume_id === resumeId);
        if (dbResume) {
          try {
            const response = await fetch(`${API_URL}/api/v1/resumes/${resumeId}/download`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
            });
            if (!response.ok) throw new Error(`Erro ao baixar ${dbResume.file_name}`);
            const blob = await response.blob();
            filesToUpload.push(new File([blob], dbResume.file_name, { type: 'application/pdf' }));
          } catch (downloadError) {
            console.error(`Erro:`, downloadError);
            throw new Error(`Não foi possível baixar o currículo ${dbResume.candidate_name}`);
          }
        }
      }

      if (filesToUpload.length === 0) throw new Error("Nenhum arquivo válido encontrado");

      const data = await resumeService.uploadResumes(filesToUpload);
      setIndexId(data.vector_index_id);
      setCurrentStep(1);
      setSelectedResumes([]);

    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao iniciar análise',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setUploading(false);
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
                    "relative group p-6 text-left transition-all duration-200 border-2 border-black rounded-lg",
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
                  disabled={databaseResumes.length === 0 && localResumes.length === 0}
                  className={cn(
                    "relative group p-6 text-left transition-all duration-200 border-2 border-black rounded-lg",
                    uploadMode === 'local'
                      ? "bg-neo-primary text-neo-primary-content  "
                      : "bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:border-black",
                    (databaseResumes.length === 0 && localResumes.length === 0) && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={cn("p-3 rounded-lg border-1 border-black", uploadMode === 'local' ? "bg-white" : "bg-gray-100")}>
                      <Database className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-md font-black" style={{ whiteSpace: 'nowrap' }}>Selecionar Existentes</h3>
                      <span className="text-xs font-bold border border-black px-1.5 rounded bg-black text-white w-fit mt-1">
                        {databaseResumes.length + localResumes.length} Disponíveis
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
                      <h3 className="text-2xl text-neo-primary">Adicionar currículos</h3>
                      <p className="text-neo-primary font-bold text-sm">Arraste os currículos para análise em PDF ou clique para selecionar.</p>
                    </div>
                    
                    <FileInput 
                      label="" 
                      setIndexId={setIndexId}
                      onSuccess={() => setCurrentStep(1)}
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
                          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          {uploading ? 'Processando...' : `Analisar (${selectedResumes.length})`}
                        </button>
                      )}
                    </div>

                    {loadingResumes ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-black" />
                        <p className="font-bold">Carregando base de dados...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {[...databaseResumes, ...localResumes].map((resume) => {
                          const isLocal = 'id' in resume; // Type guard simples
                          const id = isLocal ? (resume as LocalResume).id : (resume as DatabaseResume).resume_id;
                          const isSelected = selectedResumes.includes(id);

                          return (
                            <label 
                              key={id}
                              className={cn(
                                "cursor-pointer relative flex flex-col p-4 border-2 rounded transition-all duration-200",
                                isSelected 
                                  ? "border-black bg-blue-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px]" 
                                  : "border-gray-200 bg-white hover:border-black hover:shadow-sm"
                              )}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleResumeSelection(id)}
                                  className="checkbox checkbox-sm rounded-sm border-2 border-black checked:bg-black checked:text-white"
                                  disabled={isLocal && !(resume as LocalResume).file}
                                />
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase",
                                  isLocal ? "bg-green-200" : "bg-blue-200"
                                )}>
                                  {isLocal ? 'Local' : 'Database'}
                                </span>
                              </div>

                              <div className="flex-1">
                                <h4 className="font-bold text-lg leading-tight mb-1 truncate" title={resume.candidate_name}>
                                  {resume.candidate_name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-3">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">{resume.file_name}</span>
                                </div>
                              </div>

                              <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(resume.uploaded_at).toLocaleDateString('pt-BR')}
                                </div>
                                {isLocal && !(resume as LocalResume).file && (
                                  <span className="text-red-500 font-bold text-[10px]">Sem Arquivo</span>
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
                <HistoryChat indexId={indexId} />
                </div>
            </div>
          )}

        </div>
        </div>
    </ChatProvider>
  );
}

export default Analysis;