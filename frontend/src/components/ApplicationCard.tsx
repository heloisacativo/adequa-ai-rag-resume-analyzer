import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { JobApplication } from '../types/application';
import { Calendar, X, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ApplicationCardProps {
  application: JobApplication;
  isDragging?: boolean;
}

export function ApplicationCard({ application, isDragging }: ApplicationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                    <h3 className="text-xl font-black text-neo-primary uppercase tracking-tight">
                      {application.position}
                    </h3>
                    <p className="text-sm font-bold text-neo-primary">
                      {application.company}
                    </p>
                  </div>
                </div>
                <button
                  className="
                    p-1.5 rounded-lg
                    text-neo-primary bg-white border-2 border-neo-secondary
                    transition-all duration-200
                    hover:bg-neo-primary hover:text-white
                    active:translate-x-0.5 active:translate-y-0.5 cursor-pointer
                  "
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Data */}
                <div className="flex items-center gap-2 text-sm font-bold text-neo-primary">
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
    </>
  );
}