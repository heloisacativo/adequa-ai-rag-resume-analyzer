import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Briefcase, Calendar, FileText, X } from 'lucide-react';
import { useApplications } from '../contexts/ApplicationContext';
import { API_URL } from '../lib/api';
import type { ApplicationStatus, JobApplication } from '../types/application';

export function AddApplicationModal() {
  const { addApplication, refreshApplications } = useApplications();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const MAX_DESCRIPTION_LENGTH = 5000;
  const isDescriptionTooLong = formData.description.length > MAX_DESCRIPTION_LENGTH;

  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setFormData(prev => ({ ...prev, description: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/job-applications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: formData.company,
          job_title: formData.position,
          application_date: formData.date,
          description: formData.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to create application');

      const newApplication = await response.json();
      
      const applicationToAdd: JobApplication = {
        id: newApplication.id.toString(),
        company: newApplication.company_name,
        position: newApplication.job_title,
        date: newApplication.application_date,
        description: newApplication.description,
        status: newApplication.status as ApplicationStatus,
      };
      addApplication(applicationToAdd);

      await refreshApplications();

      setFormData({
        company: '',
        position: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        className="
          flex items-center gap-2
          bg-neo-primary text-neo-secondary 
          border-1 border-neo-secondary 
          px-4 py-2 rounded-lg
          font-bold text-sm tracking-wide
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          hover:bg-neo-primary 
          transition-all duration-200 cursor-pointer
        "
        onClick={() => setOpen(true)}
      >
        Adicionar vaga aplicada
      </button>

      {open && mounted && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-neo-secondary/60 z-[10000]"
            style={{ 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={() => setOpen(false)}
          />
          
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-[10001] pointer-events-none"
          >
            <div 
              className="rounded-lg relative w-full max-w-md bg-neo-primary border-2 border-neo-secondary shadow-neo p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            
            <div className="flex items-center justify-between mb-2 pb-2">
              <h3 className="text-xl font-black text-neo-secondary uppercase tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5" strokeWidth={2.5} />
                Adicionar Vaga
              </h3>
              <button
                className="
                  p-1 hover:bg-error-light border-2 border-neo-secondary hover:border-neo-secondary rounded
                  transition-colors text-neo-primary
                "
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5 text-neo-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1 text-neo-secondary">
                  Empresa
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Building2 className="w-4 h-4 text-neo-secondary" />
                  </div>
                  <input
                    type="text"
                    className="
                      w-full pl-10 pr-3 py-2.5 
                      text-sm font-medium bg-neo-primary text-neo-secondary
                      border-2 border-neo-secondary 
                      focus:outline-none focus:bg-neo-primary
                      focus:shadow-neo
                      transition-all duration-200
                      placeholder:text-neo-primary
                    "
                    placeholder="Ex: Google, Amazon..."
                    value={formData.company}
                    onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Cargo / Vaga
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Briefcase className="w-4 h-4 text-neo-secondary" />
                  </div>
                  <input
                    type="text"
                    className="
                      w-full pl-10 pr-3 py-2.5 
                      text-sm font-medium bg-neo-primary text-neo-secondary
                      border-2 border-neo-secondary 
                      focus:outline-none focus:bg-neo-primary
                      focus:shadow-neo
                      transition-all duration-200
                      placeholder:text-neo-secondary
                    "
                    placeholder="Ex: Senior Frontend Dev"
                    value={formData.position}
                    onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Data
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar className="w-4 h-4 text-neo-secondary" />
                  </div>
                  <input
                    type="date"
                    className="
                      w-full pl-10 pr-3 py-2.5 
                      text-sm font-medium bg-neo-primary text-neo-secondary
                      border-2 border-neo-secondary 
                      focus:outline-none focus:bg-neo-primary
                      focus:shadow-neo
                      transition-all duration-200
                    "
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Descrição
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 pointer-events-none">
                    <FileText className="w-4 h-4 text-neo-secondary" />
                  </div>
                  <textarea
                    className={`
                      w-full pl-10 pr-3 py-2.5 
                      text-sm font-medium bg-neo-primary text-neo-secondary
                      border-2 border-neo-secondary rounded-none
                      focus:outline-none focus:bg-neo-primary
                      focus:shadow-neo
                      transition-all duration-200
                      placeholder:text-neo-secondary resize-none
                      ${isDescriptionTooLong ? 'border-red-500' : ''}
                    `}
                    rows={3}
                    placeholder="Detalhes importantes..."
                    value={formData.description}
                    onChange={e => handleDescriptionChange(e.target.value)}
                  />
                  {isDescriptionTooLong && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      Descrição muito longa ({formData.description.length}/{MAX_DESCRIPTION_LENGTH} caracteres)
                    </p>
                  )}
                  {!isDescriptionTooLong && (
                    <p className="text-gray-500 text-xs mt-1 ml-1">
                      {formData.description.length}/{MAX_DESCRIPTION_LENGTH} caracteres
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  className="
                    flex-1 py-2.5 text-sm font-bold uppercase tracking-wide
                    bg-neo-primary text-neo-secondary border-2 border-neo-secondary
                    hover:bg-neo-secondary active:bg-neo-secondary
                    transition-colors cursor-pointer
                  "
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="
                    flex-1 py-2.5 text-sm font-bold uppercase tracking-wide
                    bg-neo-secondary text-neo-secondary border-2 border-neo-secondary
                    shadow-neo 
                    transition-all duration-200
                    disabled:opacity-70 disabled:cursor-not-allowed
                    cursor-pointer
                  "
                  disabled={isLoading || isDescriptionTooLong}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Vaga'}
                </button>
              </div>

            </form>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}