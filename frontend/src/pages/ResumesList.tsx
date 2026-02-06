import { AppLayout } from '../components/layout/AppLayout';
import { Search, FileText, Upload, Plus, Trash2, X, FileUp, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ResumeStatus } from './../types/Index';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { resumeService } from '../lib/api';
import { useToast } from '../hooks/use-toats';
import { useResumes } from '../hooks/useResumes';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const MAX_FILES_PER_UPLOAD = 20;

// Interface para currículos do banco de dados
interface DatabaseResume {
  resume_id: string;
  candidate_name: string;
  file_name: string;
  uploaded_at: string;
  is_indexed: boolean;
}



// Configuração de cores Neo-Brutalistas para Status
const statusStyles: Record<string, string> = {
  new: 'bg-neo-secondary',
  analyzed: 'bg-neo-secondary',
  shortlist: 'bg-neo-secondary ',
  rejected: 'bg-neo-secondary ',
  hired: 'bg-neo-secondary',
};

const statusLabels: Record<string, string> = {
  new: 'NOVO',
  analyzed: 'ANALISADO',
  shortlist: 'SHORTLIST',
  rejected: 'REJEITADO',
  hired: 'CONTRATADO',
};

export default function ResumesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ resumeId: string; fileName: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { resumes: resumesFromApi, isLoading: loading, error: resumesError, refetch, invalidate } = useResumes(user?.id);
  const resumes: DatabaseResume[] = (Array.isArray(resumesFromApi) ? resumesFromApi : []).map((r) => ({
    resume_id: r.resume_id,
    candidate_name: r.candidate_name,
    file_name: r.file_name,
    uploaded_at: r.uploaded_at,
    is_indexed: r.is_indexed,
  }));

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_FILES_PER_UPLOAD) {
      toast({
        title: 'Máximo por vez',
        description: `Você pode adicionar até ${MAX_FILES_PER_UPLOAD} currículos por vez. Os primeiros ${MAX_FILES_PER_UPLOAD} foram selecionados.`,
        variant: 'error',
      });
      setSelectedFiles(files.slice(0, MAX_FILES_PER_UPLOAD));
    } else {
      setSelectedFiles(files);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);

    try {
      await resumeService.uploadResumes(selectedFiles);
      setSelectedFiles([]);
      setShowUpload(false);
      invalidate();
      await refetch();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload dos currículos';
      toast({ title: 'Erro no upload', description: message, variant: 'error' });
      // Atualiza a lista mesmo quando dá erro (ex.: duplicado), para mostrar o que está no banco
      invalidate();
      await refetch();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (resume: DatabaseResume) => {
    try {
      const response = await fetch(`${resumeService.getBaseUrl()}/resumes/${resume.resume_id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao baixar arquivo');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.file_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar currículo:', error);
      alert('Erro ao baixar o currículo');
    }
  };

  const openDeleteModal = (resume: DatabaseResume) => {
    setDeleteModal({ resumeId: resume.resume_id, fileName: resume.file_name });
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await resumeService.deleteResume(deleteModal.resumeId);
      invalidate();
      await refetch();
      closeDeleteModal();
      toast({
        title: 'Currículo excluído',
        description: 'O currículo foi removido com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Erro ao deletar currículo:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o currículo. Tente novamente.',
        variant: 'error',
      });
    }
  };

  const filteredResumes = resumes.filter((resume) => {
    const matchesSearch =
      resume.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resume.file_name.toLowerCase().includes(searchQuery.toLowerCase());

    const resumeStatus = resume.is_indexed ? 'analyzed' : 'new';
    const matchesStatus = statusFilter === 'all' || resumeStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const showLoginMessage = !user?.id;
  const showErrorState = !!resumesError && !loading;
  const showEmptyState = !loading && !resumesError && filteredResumes.length === 0;
  const emptyMessage = resumes.length > 0 && filteredResumes.length === 0
    ? 'Nenhum currículo corresponde aos filtros'
    : 'Nenhum currículo encontrado';

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-6 sm:pb-10 font-sans text-black">
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b-2 border-black pb-4 sm:pb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-1 sm:mb-2 truncate">Currículos</h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Currículos adicionados
            </p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 w-full md:w-auto bg-neo-primary text-neo-secondary tracking-wider border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-100 hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 font-bold text-sm sm:text-base shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            {showUpload ? 'Cancelar' : 'Adicionar Currículos'}
          </button>
        </div>

        {/* ÁREA DE UPLOAD */}
        {showUpload && (
          <div className="bg-white border-2 border-black p-4 sm:p-6 md:p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-xl sm:text-2xl font-black uppercase mb-4 sm:mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> Upload de Arquivos
            </h3>

            <div className="space-y-4 sm:space-y-6">
              <div className="border-2 border-dashed border-black bg-gray-50 rounded-lg p-6 sm:p-8 md:p-10 text-center hover:bg-yellow-50 transition-colors group relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                    <FileUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-black" />
                  </div>
                  <p className="text-base sm:text-lg font-black uppercase">Clique ou Arraste arquivos aqui</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1 sm:mt-2">
                    PDF, DOCX, DOC (até 20 por vez, máx. 10MB cada)
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="bg-gray-100 border-2 border-black rounded-lg p-3 sm:p-4">
                  <h4 className="font-black uppercase text-xs sm:text-sm mb-2 sm:mb-3">Arquivos Selecionados ({selectedFiles.length}):</h4>
                  <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border border-black p-1.5 sm:p-2 rounded shadow-sm gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate min-w-0">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="p-1 hover:bg-red-100 rounded text-red-500 shrink-0"
                          aria-label="Remover arquivo"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowUpload(false); setSelectedFiles([]); }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-black font-bold uppercase border-2 border-black rounded hover:bg-red-50 hover:text-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-none transition-all text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-neo-secondary cursor-pointer text-black font-bold uppercase border-2 border-black rounded hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isUploading ? 'Enviando...' : 'Confirmar Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BARRA DE FILTROS */}
        <div className="bg-white p-2 sm:p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center min-w-0">
            <div className="p-1.5 sm:p-2 shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </div>
            <input
              placeholder="BUSCAR POR NOME OU ARQUIVO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 p-1.5 sm:p-2 bg-transparent border-none focus:ring-0 text-sm sm:text-lg font-bold placeholder:text-gray-400 uppercase"
            />
          </div>
          <div className="border-t-2 sm:border-t-0 sm:border-l-2 border-black sm:pl-2 pt-2 sm:pt-0">
            <select
              className="w-full sm:w-[180px] min-h-[40px] sm:min-h-0 p-2 bg-transparent font-bold uppercase text-sm sm:text-base focus:ring-0 border-none cursor-pointer outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos Status</option>
              <option value="new">Novos</option>
              <option value="analyzed">Analisados</option>
              <option value="shortlist">Shortlist</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>

        {/* LISTA EM CARDS (mobile) */}
        <div className="md:hidden space-y-3">
          {showLoginMessage ? (
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center bg-gray-50">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-neo-primary mx-auto" strokeWidth={1.5} />
              <p className="text-base sm:text-lg font-black text-black uppercase">Faça login para ver seus currículos</p>
            </div>
          ) : loading ? (
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-center">
              <span className="loading loading-spinner loading-lg mb-2 bg-black"></span>
              <p className="font-bold text-black text-sm">CARREGANDO...</p>
            </div>
          ) : showErrorState ? (
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center bg-red-50/50">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-neo-primary mx-auto" strokeWidth={1.5} />
              <p className="text-base sm:text-lg font-black text-black uppercase mb-3">Falha ao carregar currículos</p>
              <p className="text-sm text-gray-600 mb-4">Faça login ou tente novamente.</p>
              <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-black text-white font-bold uppercase text-sm rounded border-2 border-black hover:bg-gray-800">Tentar novamente</button>
            </div>
          ) : showEmptyState ? (
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center bg-gray-50">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-neo-primary mx-auto" strokeWidth={1.5} />
              <p className="text-base sm:text-lg font-black text-black uppercase">{emptyMessage}</p>
            </div>
          ) : (
            filteredResumes.map((resume) => {
              const resumeStatus = resume.is_indexed ? 'analyzed' : 'new';
              return (
                <div
                  key={resume.resume_id}
                  className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-neo-primary border-2 border-black flex items-center justify-center rounded shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm sm:text-base uppercase leading-tight truncate" title={resume.candidate_name}>
                        {resume.candidate_name}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-neo-secondary font-mono truncate mt-0.5" title={resume.file_name}>
                        {resume.file_name}
                      </p>
                      <span className={cn(
                        "inline-block mt-1.5 px-2 py-0.5 rounded-full border-2 border-black text-[10px] font-bold text-neo-secondary tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                        statusStyles[resumeStatus]
                      )}>
                        {statusLabels[resumeStatus]}
                      </span>
                      <span className="block text-[10px] sm:text-xs font-mono text-gray-500 mt-1">
                        {format(new Date(resume.uploaded_at), 'dd MMM yy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-black/10">
                    <button
                      type="button"
                      className="p-2 border-2 border-black bg-neo-primary rounded hover:bg-gray-100 transition-colors text-black"
                      title="Baixar Arquivo"
                      onClick={() => handleDownload(resume)}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 border-2 border-black bg-neo-primary rounded hover:bg-gray-100 transition-colors text-black"
                      title="Excluir currículo"
                      onClick={() => openDeleteModal(resume)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TABELA DE CURRÍCULOS (desktop) */}
        <div className="hidden md:block bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black">
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide w-[30%]">Candidato</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide">Arquivo</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide">Status</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide w-[130px]">Data</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide text-right w-[120px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {showLoginMessage ? (
                  <tr>
                    <td colSpan={5} className="p-12 md:p-16 text-center bg-gray-50">
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <FileText className="w-12 h-12 mb-4 text-neo-primary" strokeWidth={1.5} />
                        <p className="text-lg md:text-xl font-black text-black uppercase">Faça login para ver seus currículos</p>
                      </div>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 md:p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="loading loading-spinner loading-lg mb-2 bg-black"></span>
                        <p className="font-bold text-black text-sm">CARREGANDO CURRÍCULOS...</p>
                      </div>
                    </td>
                  </tr>
                ) : showErrorState ? (
                  <tr>
                    <td colSpan={5} className="p-12 md:p-16 text-center bg-red-50/50">
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <FileText className="w-12 h-12 mb-4 text-neo-primary" strokeWidth={1.5} />
                        <p className="text-lg md:text-xl font-black text-black uppercase mb-2">Falha ao carregar currículos</p>
                        <p className="text-sm text-gray-600 mb-4">Faça login ou tente novamente.</p>
                        <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-black text-white font-bold uppercase text-sm rounded border-2 border-black hover:bg-gray-800">Tentar novamente</button>
                      </div>
                    </td>
                  </tr>
                ) : showEmptyState ? (
                  <tr>
                    <td colSpan={5} className="p-12 md:p-16 text-center bg-gray-50">
                      <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                        <FileText className="w-12 h-12 mb-4 text-neo-primary" strokeWidth={1.5} />
                        <p className="text-lg md:text-xl font-black text-black uppercase">{emptyMessage}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResumes.map((resume) => {
                    const resumeStatus = resume.is_indexed ? 'analyzed' : 'new';
                    return (
                      <tr key={resume.resume_id} className="group hover:bg-yellow-50 transition-colors">
                        <td className="p-3 md:p-4 align-middle">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center rounded shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors">
                              <FileText className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <p className="font-black text-sm md:text-base uppercase leading-tight truncate max-w-[200px]" title={resume.candidate_name}>
                              {resume.candidate_name}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 md:p-4 align-middle">
                          <span className="text-xs md:text-sm font-bold text-neo-secondary font-mono truncate max-w-[200px] block" title={resume.file_name}>
                            {resume.file_name}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 align-middle">
                          <span className={cn(
                            "inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full border-2 border-black text-[10px] font-bold text-neo-secondary tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                            statusStyles[resumeStatus]
                          )}>
                            {statusLabels[resumeStatus]}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 align-middle">
                          <span className="text-[10px] md:text-xs font-bold font-mono text-neo-secondary px-2 py-1 rounded">
                            {format(new Date(resume.uploaded_at), 'dd MMM yy', { locale: ptBR })}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 align-middle text-right">
                          <div className="flex justify-end gap-1.5 md:gap-2">
                            <button
                              type="button"
                              className="p-1.5 md:p-2 border-2 border-black bg-neo-primary rounded hover:bg-white transition-all text-neo-secondary hover:text-neo-primary cursor-pointer"
                              title="Baixar Arquivo"
                              onClick={() => handleDownload(resume)}
                            >
                              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 md:p-2 border-2 border-black bg-neo-primary rounded hover:bg-white transition-all text-neo-secondary hover:text-neo-primary cursor-pointer"
                              title="Excluir currículo"
                              onClick={() => openDeleteModal(resume)}
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteModal && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[10000]"
            style={{
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={closeDeleteModal}
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[10001] pointer-events-none">
            <div
              className="w-full max-w-md bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="delete-modal-title" className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2} />
                  Excluir currículo
                </h3>
                <button
                  type="button"
                  className="p-1.5 border-2 border-black rounded hover:bg-gray-100 transition-colors"
                  onClick={closeDeleteModal}
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-6">
                Tem certeza que deseja excluir o currículo <strong className="text-black font-bold break-all">&quot;{deleteModal.fileName}&quot;</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="cursor-pointer flex-1 px-4 py-2.5 bg-white text-black font-bold uppercase border-2 border-black rounded-lg hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="cursor-pointer flex-1 px-4 py-2.5 bg-red-600 text-white font-bold uppercase border-2 border-black rounded-lg hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </AppLayout>
  );
}