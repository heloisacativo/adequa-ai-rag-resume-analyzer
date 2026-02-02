import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import {
  ArrowLeft,
  Edit,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from 'lucide-react';
import { getJobById, getResumesByJobId } from '../components/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ResumeStatus } from '../types/Index';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  paused: 'bg-warning/10 text-warning border-warning/20',
  closed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  draft: 'Rascunho',
  paused: 'Pausada',
  closed: 'Encerrada',
};

const resumeStatusColors: Record<ResumeStatus, string> = {
  new: 'bg-accent/10 text-accent border-accent/20',
  analyzed: 'bg-neo-primary/10 text-neo-primary border-neo-primary/20',
  shortlist: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  hired: 'bg-success text-success-foreground',
};

const resumeStatusLabels: Record<ResumeStatus, string> = {
  new: 'Novo',
  analyzed: 'Analisado',
  shortlist: 'Shortlist',
  rejected: 'Rejeitado',
  hired: 'Contratado',
};

const seniorityLabels: Record<string, string> = {
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Lead',
  principal: 'Principal',
};

export default function JobDetail() {
  const { id } = useParams();
  const job = getJobById(id || '');
  const resumes = getResumesByJobId(id || '');

  if (!job) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">Vaga não encontrada</p>
          <button className="btn btn-primary mt-4">
            <Link to="/jobs">Voltar para vagas</Link>
          </button>
        </div>
      </AppLayout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  // DaisyUI Tabs state
  const [tab, setTab] = useState<'details' | 'resumes'>('details');

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button className="btn btn-ghost btn-square" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                <div className={`badge border ${statusColors[job.status]}`}>
                  {statusLabels[job.status]}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="badge badge-outline">{seniorityLabels[job.seniority]}</div>
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                )}
                {job.salary_range && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary_range}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(job.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <Link to={`/jobs/${job.id}/edit`} className="btn btn-outline flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>

        {/* Tabs DaisyUI */}
        <div className="tabs tabs-boxed w-fit">
          <a
            className={`tab ${tab === 'details' ? 'tab-active' : ''}`}
            onClick={() => setTab('details')}
          >
            Detalhes
          </a>
          <a
            className={`tab ${tab === 'resumes' ? 'tab-active' : ''}`}
            onClick={() => setTab('resumes')}
          >
            Currículos ({resumes.length})
          </a>
        </div>

        {tab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Descrição</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body space-y-4">
                  <h2 className="card-title">Requisitos</h2>
                  <div>
                    <p className="text-sm font-medium mb-2">Requisitos Técnicos</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements_technical.map((req, i) => (
                        <div key={i} className="badge badge-outline">
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Soft Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements_soft_skills.map((skill, i) => (
                        <div key={i} className="badge badge-secondary">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  {job.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Palavras-chave</p>
                      <div className="flex flex-wrap gap-2">
                        {job.keywords.map((kw, i) => (
                          <div key={i} className="badge badge-outline text-xs">
                            {kw}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Criteria */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-base">Critérios de Seleção</h2>
                  <div>
                    <p className="text-sm font-medium text-success flex items-center gap-1 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Obrigatórios
                    </p>
                    <ul className="space-y-1">
                      {job.required_criteria.map((c, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4" />
                      Desejáveis
                    </p>
                    <ul className="space-y-1">
                      {job.desired_criteria.map((c, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body space-y-3">
                  <h2 className="card-title text-base">Estatísticas</h2>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Currículos recebidos</span>
                    <span className="font-medium">{job.resumes_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Analisados</span>
                    <span className="font-medium">{job.analyzed_count}</span>
                  </div>
                  <progress
                    value={(job.analyzed_count / job.resumes_count) * 100 || 0}
                    max={100}
                    className="progress progress-primary h-2 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'resumes' && (
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="card bg-base-100 shadow-xl border-dashed border-2">
              <div className="card-body py-8 flex flex-col items-center justify-center text-center">
                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="font-medium text-foreground mb-1">
                  Arraste currículos aqui ou clique para fazer upload
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Aceita PDF e DOCX (máx. 10MB cada)
                </p>
                <button className="btn btn-primary flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Selecionar arquivos
                </button>
              </div>
            </div>

            {/* Resumes List */}
            <div className="space-y-3">
              {resumes.length === 0 ? (
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum currículo enviado para esta vaga ainda.
                    </p>
                  </div>
                </div>
              ) : (
                resumes.map((resume) => (
                  <div key={resume.id} className="card bg-base-100 shadow-xl">
                    <div className="card-body py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {resume.candidate_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {resume.file_name}
                            </p>
                            {resume.score !== undefined && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-muted-foreground">
                                  Score:
                                </span>
                                <span className={`font-bold ${getScoreColor(resume.score)}`}>
                                  {resume.score}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`badge border ${resumeStatusColors[resume.status]}`}>
                            {resumeStatusLabels[resume.status]}
                          </div>
                          {resume.status === 'new' && (
                            <button className="btn btn-primary btn-sm flex items-center gap-1">
                              <Bot className="w-4 h-4" />
                              Analisar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* AI Analysis Results */}
                      {resume.ai_summary && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">
                            {resume.ai_summary}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-3">
                            {resume.strengths && resume.strengths.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-success mb-1">
                                  Pontos fortes
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {resume.strengths.map((s, i) => (
                                    <div key={i} className="badge badge-success text-xs bg-success/5">
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {resume.gaps && resume.gaps.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-destructive mb-1">
                                  Lacunas
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {resume.gaps.map((g, i) => (
                                    <div key={i} className="badge badge-error text-xs bg-destructive/5">
                                      {g}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
