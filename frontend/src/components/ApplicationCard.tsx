import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { JobApplication } from '../types/application';
import { Calendar, X, Building2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApplications } from '../contexts/ApplicationContext';
import { useToast } from '../hooks/use-toats';

interface ApplicationCardProps {
  application: JobApplication;
  isDragging?: boolean;
}

export function ApplicationCard({ application, isDragging }: ApplicationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteApplication } = useApplications();
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await deleteApplication(application.id);
      toast({
        title: 'Candidatura excluída',
        description: 'A candidatura foi removida com sucesso.',
        variant: 'success',
      });
      setIsModalOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a candidatura.',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'group bg-neo-primary w-full relative',
          'border-2 border-neo-secondary rounded-lg',
          'p-4 mb-0', 
          
          'cursor-pointer', 
          'hover:opacity-90 transition-opacity',
          isDragging && 'rotate-1 scale-105 z-50 cursor-grabbing'
        )}
        style={{
          borderTopWidth: '2px',
          borderRightWidth: '2px',
          borderBottomWidth: '2px',
          borderLeftWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#000000',
          boxSizing: 'border-box',
          marginBottom: '0',
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('applicationId', application.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={handleCardClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick();
          }}
          disabled={isDeleting}
          className={cn(
            'absolute top-2 right-2 z-10',
            'p-1.5 rounded-lg',
            'bg-neo-blue text-neo-secondary border-2 border-black',
            'active:scale-95',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer'
          )}
          title="Excluir candidatura"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-black text-neo-secondary leading-tight">
            {application.position}
          </p>
          
          <div className="flex items-center gap-2 text-sm font-bold text-neo-secondary">
            <Calendar className="w-4 h-4" />
            <span>Data: {formatDate(application.date)}</span>
          </div>
        </div>
      </div>

      {isModalOpen && createPortal(
        <>
          {/* OVERLAY */}
          <div 
            className="fixed inset-0 bg-neo-primary/10 z-[10000]"
            style={{ 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={() => setIsModalOpen(false)}
          />
          
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-[10001] pointer-events-none"
          >
            <div 
              className="relative w-full max-w-2xl bg-neo-primary border-2 border-neo-secondary rounded-lg p-6 pointer-events-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b-2 border-neo-secondary pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border-2 border-neo-secondary rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-neo-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neo-secondary uppercase tracking-tight">
                      {application.position}
                    </h3>
                    <p className="text-sm font-bold text-neo-secondary">
                      {application.company}
                    </p>
                  </div>
                </div>
                <button
                  className="
                    p-1.5 rounded-lg
                    text-neo-secondary bg-white border-2 border-neo-secondary
                    transition-all duration-200
                    active:translate-x-0.5 active:translate-y-0.5 cursor-pointer
                  "
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Data */}
                <div className="flex items-center gap-2 text-sm font-bold text-neo-secondary">
                  <Calendar className="w-4 h-4" />
                  <span>Data da aplicação: {formatDate(application.date)}</span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-neo-secondary uppercase mb-2">
                    Descrição da Vaga
                  </h4>
                  <div className="bg-white border-2 border-neo-secondary rounded-lg p-4">
                    <p className="text-sm text-neo-secondary leading-relaxed whitespace-pre-wrap">
                      {application.description || 'Nenhuma descrição disponível.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[10002]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[10003] pointer-events-none">
            <div 
              className="relative w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
             
                <h3 className="text-xl font-black text-black uppercase">
                  Confirmar Exclusão
                </h3>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-6">
                Tem certeza que deseja excluir a candidatura para <strong>{application.position}</strong> na empresa <strong>{application.company}</strong>? Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="
                    flex-1 py-3 px-4
                    bg-white text-black
                    border-2 border-black
                    font-bold uppercase text-sm
                    hover:bg-gray-100
                    active:translate-x-0.5 active:translate-y-0.5
                    transition-all duration-200 cursor-pointer
                  "
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="
                    flex-1 py-3 px-4
                    bg-neo-blue text-neo-secondary
                    border-2 border-black
                    font-bold uppercase text-sm
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer
                  "
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}