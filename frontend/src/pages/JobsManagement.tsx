import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Search, Briefcase, Plus, Edit, Trash2, Eye, MapPin, X } from 'lucide-react';
import { jobService } from '../lib/api';
import type { Job } from '../lib/api';

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.listJobs();
      setJobs(response.jobs);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      setError('Erro ao carregar vagas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (formData.title.trim().length < 2) {
      setError('O título deve ter pelo menos 2 caracteres.');
      return;
    }

    try {
      if (editingJob) {
        const updatedJob = await jobService.updateJob(editingJob.id, formData);
        setJobs(jobs.map(job => job.id === editingJob.id ? updatedJob : job));
        setEditingJob(null);
      } else {
        const newJob = await jobService.createJob(formData);
        setJobs([...jobs, newJob]);
      }

      setFormData({ title: '', description: '', location: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
      setError('Erro ao salvar vaga. Tente novamente.');
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location
    });
    setShowCreateForm(true);
  };

  const handleDelete = (jobId: string) => {
    setJobToDelete(jobId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      await jobService.deleteJob(jobToDelete);
      setJobs(jobs.filter(job => job.id !== jobToDelete));
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (error) {
      setError('Erro ao excluir vaga.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-8 pb-10 font-sans text-black">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Gerenciar Vagas</h1>
            <p className="text-gray-600 font-medium">
              Controle total sobre as oportunidades abertas
            </p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              setFormData({ title: '', description: '', location: '' });
              setShowCreateForm(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 w-full md:w-auto bg-neo-primary text-neo-secondary tracking-wider border-2 border-black rounded-lg cursor-pointer font-bold text-sm sm:text-base shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            Adicionar nova vaga
          </button>
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 sm:p-4 font-bold flex items-center gap-2 rounded shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] text-sm sm:text-base">
            <span className="text-lg sm:text-xl shrink-0">⚠️</span>
            <span className="min-w-0">{error}</span>
          </div>
        )}

        {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                <h3 className="text-xl sm:text-2xl font-black uppercase truncate min-w-0">
                  {editingJob ? 'Editar Vaga' : 'Criar Nova Vaga'}
                </h3>
                <button 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingJob(null);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded transition-all cursor-pointer shrink-0"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wide">Título da Vaga *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2.5 sm:p-3 bg-gray-50 border-2 border-black rounded focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-medium placeholder:text-gray-400 text-sm sm:text-base"
                      placeholder="Ex: Senior Frontend Developer"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wide">Localização *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-2.5 sm:p-3 bg-gray-50 border-2 border-black rounded focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-medium placeholder:text-gray-400 text-sm sm:text-base"
                      placeholder="Ex: Remoto, São Paulo - SP"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-black uppercase tracking-wide">Descrição da Vaga *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2.5 sm:p-3 h-28 sm:h-32 bg-gray-50 border-2 border-black rounded focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-medium placeholder:text-gray-400 resize-none text-sm sm:text-base"
                    placeholder="Descreva as responsabilidades, requisitos e benefícios..."
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingJob(null);
                    }}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-black font-bold uppercase border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-none transition-all text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-neo-secondary text-neo-seconday font-bold uppercase border-2 border-black rounded hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none transition-all text-sm sm:text-base"
                  >
                    {editingJob ? 'Salvar Alterações' : 'Publicar Vaga'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* BARRA DE BUSCA */}
        <div className="bg-white p-2 sm:p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
          <div className="p-1.5 sm:p-2 shrink-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
          </div>
          <input
            placeholder="BUSCAR VAGAS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 p-1.5 sm:p-2 bg-transparent border-none focus:ring-0 text-sm sm:text-lg font-bold placeholder:text-gray-400 uppercase"
          />
        </div>

        {/* LISTA EM CARDS (mobile) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-center">
              <span className="loading loading-spinner loading-lg mb-2 bg-black"></span>
              <p className="font-bold text-black text-sm">CARREGANDO...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center bg-gray-50">
              <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-black mx-auto" strokeWidth={1.5} />
              <p className="text-base sm:text-lg font-black text-black uppercase">Nenhuma vaga encontrada</p>
              <p className="text-sm font-medium mt-1 text-gray-600">Utilize o botão acima para criar uma nova oportunidade.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-neo-primary border-2 border-black flex items-center justify-center rounded shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm sm:text-base leading-tight uppercase truncate">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm font-bold text-gray-600">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    <span className="text-[10px] sm:text-xs font-mono text-gray-500 mt-1.5 inline-block">
                      {new Date(job.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-black/10">
                  <button
                    type="button"
                    className="p-2 border-2 border-black bg-neo-primary rounded hover:bg-gray-100 transition-colors text-black"
                    title="Ver detalhes"
                    onClick={() => { setSelectedJob(job); setShowModal(true); }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 border-2 border-black bg-neo-primary rounded hover:bg-gray-100 transition-colors text-black"
                    title="Editar vaga"
                    onClick={() => handleEdit(job)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 border-2 border-black bg-neo-primary rounded hover:bg-gray-100 transition-colors text-black"
                    title="Excluir vaga"
                    onClick={() => handleDelete(job.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TABELA DE VAGAS (desktop) */}
        <div className="hidden md:block bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black">
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide w-[30%]">Vaga / Cargo</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide">Localização</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide">Resumo</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide w-[130px]">Data</th>
                  <th className="p-3 md:p-4 font-black uppercase text-xs md:text-sm tracking-wide text-right w-[140px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 md:p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="loading loading-spinner loading-lg mb-2 bg-black"></span>
                        <p className="font-bold text-black text-sm">CARREGANDO DADOS...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 md:p-16 text-center bg-gray-50">
                      <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                        <Briefcase className="w-12 h-12 mb-4 text-black" strokeWidth={1.5} />
                        <p className="text-lg md:text-xl font-black text-black uppercase">Nenhuma vaga encontrada</p>
                        <p className="font-medium mt-1 text-sm md:text-base">Utilize o botão acima para criar uma nova oportunidade.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="group hover:bg-yellow-50 transition-colors">
                      <td className="p-3 md:p-4 align-top">
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="w-9 h-9 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center rounded shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-colors">
                            <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-base md:text-lg leading-tight uppercase group-hover:underline decoration-2 underline-offset-2 truncate">
                              {job.title}
                            </p>
                        
                          </div>
                        </div>
                      </td>
                      <td className="p-3 md:p-4 align-top">
                        <div className="flex items-center gap-2 font-bold text-xs md:text-sm text-gray-700">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 text-black shrink-0" />
                          <span className="truncate max-w-[120px] md:max-w-none">{job.location}</span>
                        </div>
                      </td>
                      <td className="p-3 md:p-4 align-top">
                        <p className="text-xs md:text-sm text-gray-600 font-medium line-clamp-2 leading-relaxed max-w-md">
                          {job.description}
                        </p>
                      </td>
                      <td className="p-3 md:p-4 align-top">
                        <span className="text-[10px] md:text-xs font-bold font-mono text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                          {new Date(job.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 align-top text-right">
                        <div className="flex justify-end gap-1.5 md:gap-2">
                          <button
                            type="button"
                            className="p-1.5 md:p-2 border-2 border-black bg-neo-primary rounded hover:bg-white transition-all text-neo-primary hover:text-black cursor-pointer"
                            title="Ver detalhes"
                            onClick={() => { setSelectedJob(job); setShowModal(true); }}
                          >
                            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 md:p-2 border-2 border-black bg-neo-primary rounded hover:bg-white transition-all text-neo-primary hover:text-black cursor-pointer"
                            title="Editar vaga"
                            onClick={() => handleEdit(job)}
                          >
                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 md:p-2 border-2 border-black bg-neo-primary rounded hover:bg-white transition-all text-neo-primary hover:text-black cursor-pointer"
                            title="Excluir vaga"
                            onClick={() => handleDelete(job.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DA VAGA */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <h3 className="text-xl sm:text-2xl font-black uppercase truncate min-w-0">Detalhes da Vaga</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded transition-all cursor-pointer shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wide block mb-0.5 sm:mb-1">Título</label>
                <p className="font-medium text-base sm:text-lg break-words">{selectedJob.title}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wide block mb-0.5 sm:mb-1">Localização</label>
                <p className="font-medium break-words">{selectedJob.location}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wide block mb-0.5 sm:mb-1">Descrição</label>
                <p className="font-medium whitespace-pre-wrap leading-relaxed break-words">{selectedJob.description}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wide block mb-0.5 sm:mb-1">Data de Criação</label>
                <p className="font-medium">{new Date(selectedJob.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-black uppercase tracking-wide block mb-0.5 sm:mb-1">ID da Vaga</label>
                <p className="font-mono text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded border break-all">{selectedJob.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4">
            <div className="text-center">
              <p className="text-gray-600 font-medium mb-4 sm:mb-6 text-sm sm:text-base">
                Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="w-full sm:w-auto cursor-pointer px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-black font-bold border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-none transition-all text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full sm:w-auto cursor-pointer px-4 sm:px-6 py-2.5 sm:py-3 text-neo-primary font-bold border-2 border-neo-secondary rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none transition-all hover:bg-red-50 text-sm sm:text-base"
                >
                  Excluir Vaga
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}