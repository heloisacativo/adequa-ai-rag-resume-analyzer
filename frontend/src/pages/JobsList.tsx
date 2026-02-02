import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from './../components/layout/AppLayout';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, FileText, Users, MapPin } from 'lucide-react';
import { mockJobs } from '../components/data/mockData';
import type { Job, JobStatus } from '../types/Index';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<JobStatus, string> = {
  active: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  paused: 'bg-warning/10 text-warning border-warning/20',
  closed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<JobStatus, string> = {
  active: 'Ativa',
  draft: 'Rascunho',
  paused: 'Pausada',
  closed: 'Encerrada',
};

const seniorityLabels: Record<string, string> = {
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Lead',
  principal: 'Principal',
};

export default function JobsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vagas</h1>
            <p className="text-muted-foreground">
              Gerencie suas vagas e acompanhe os candidatos.
            </p>
          </div>
          <Link to="/jobs/new" className="btn btn-primary flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Nova Vaga
          </Link>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Buscar vagas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full pl-9"
                />
              </div>
              <select
                className="select select-bordered w-full sm:w-[180px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="draft">Rascunhos</option>
                <option value="paused">Pausadas</option>
                <option value="closed">Encerradas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-[300px]">Vaga</th>
                    <th>Senioridade</th>
                    <th>Currículos</th>
                    <th>Status</th>
                    <th>Criada em</th>
                    <th className="w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="w-8 h-8 mb-2" />
                          <p>Nenhuma vaga encontrada</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div className="space-y-1">
                            <Link 
                              to={`/jobs/${job.id}`}
                              className="font-medium text-foreground hover:text-neo-primary transition-colors"
                            >
                              {job.title}
                            </Link>
                            {job.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="badge badge-secondary">
                            {seniorityLabels[job.seniority]}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{job.resumes_count}</span>
                            <span className="text-muted-foreground">
                              ({job.analyzed_count} analisados)
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={`badge border ${statusColors[job.status]}`}>
                            {statusLabels[job.status]}
                          </div>
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {format(new Date(job.created_at), 'dd MMM yyyy', { locale: ptBR })}
                        </td>
                        <td>
                          {/* Dropdown DaisyUI */}
                          <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-square btn-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </label>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44">
                              <li>
                                <Link to={`/jobs/${job.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver detalhes
                                </Link>
                              </li>
                              <li>
                                <Link to={`/jobs/${job.id}/edit`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </Link>
                              </li>
                              <li>
                                <button className="text-destructive flex items-center">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </button>
                              </li>
                            </ul>
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
      </div>
    </AppLayout>
  );
}
