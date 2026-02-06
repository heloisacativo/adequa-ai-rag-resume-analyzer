import React, { useState, useRef } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Briefcase, FileText, Users, TrendingUp, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { jobService, resumeService } from '../lib/api';
import { Link } from 'react-router-dom';
import Analysis from './Analysis';

export default function RecruiterDashboard() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzeInProgressRef = useRef(false);

  // Fetch real data from APIs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.listJobs(),
  });

  const { data: resumesData, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.listResumes(),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
    const seen = new Set<string>();
    const deduped = files.filter((f) => {
      const k = key(f);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    setUploadedFiles(deduped);
    e.target.value = '';
  };

  const handleAnalyze = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadedFiles.length === 0 || isAnalyzing || analyzeInProgressRef.current) return;
    analyzeInProgressRef.current = true;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setUploadedFiles([]);
      analyzeInProgressRef.current = false;
    }, 2000);
  };

  // Calculate metrics from real data
  const activeJobs = jobsData?.jobs.filter(job => job.status === 'active' || job.status === 'open') || [];
  const totalResumes = resumesData?.total || 0;

  // Get recent resumes (sorted by upload date, limit to 4)
  const recentResumes = resumesData?.resumes
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
    .slice(0, 4) || [];

  return (
    <AppLayout>
      <div className="space-y-6 w-full min-w-0">
        {/* Header */}
        <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-0.5">Visão Geral</h1>
            <p className="text-gray-600 font-medium">
             Tudo o que você precisa para gerenciar vagas e candidatos em um só lugar com Inteligência Artificial
            </p>
          </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neo-primary border-2 border-neo-secondary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neo-secondary font-bold text-sm">VAGAS ATIVAS</p>
                <p className="text-2xl font-black text-neo-secondary">
                  {jobsLoading ? '...' : activeJobs.length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-neo-secondary" />
            </div>
          </div>
          <div className="bg-neo-primary border-2 border-neo-secondary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neo-secondary font-bold text-sm">CURRÍCULOS ANALISADOS</p>
                <p className="text-2xl font-black text-neo-secondary">
                  {resumesLoading ? '...' : totalResumes}
                </p>
              </div>
              <FileText className="w-8 h-8 text-neo-secondary" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat CTA */}
          <Link to="/ia-analysis" className="bg-neo-primary border-2 border-neo-secondary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-neo-primary flex items-center justify-center border-2 border-neo-secondary rounded-lg">
                <Sparkles size={28} className="text-neo-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-neo-secondary">ASSISTENTE IA</h3>
                <p className="text-neo-secondary text-sm">Converse com a IA sobre candidatos</p>
              </div>
            </div>
            <p className="text-sm text-neo-secondary mb-4">
              Use nossa IA para analisar currículos, comparar candidatos e encontrar o perfil ideal para suas vagas.
            </p>
            <div className="flex items-center gap-2 text-neo-secondary font-bold">
              <MessageSquare size={18} />
              INICIAR CONVERSA
            </div>
          </Link>

          {/* Resume Upload */}
          <div className="bg-neo-primary border-2 border-neo-secondary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
            <h3 className="font-bold text-lg text-neo-secondary mb-4">UPLOAD DE CURRÍCULOS</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-neo-secondary p-8 text-center rounded-lg">
                <FileText className="w-12 h-12 text-neo-secondary mx-auto mb-4" />
                <p className="text-neo-secondary mb-2">Arraste arquivos aqui ou clique para selecionar</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-neo-primary text-neo-secondary px-4 py-2 border-2 border-neo-secondary font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer inline-block rounded-lg"
                >
                  SELECIONAR ARQUIVOS
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="flex items-center justify-between bg-neo-secondary text-neo-primary p-2 border-2 border-neo-secondary rounded-lg">
                      <span className="text-sm text-neo-secondary font-bold">{file.name}</span>
                      <span className="text-xs text-neo-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-neo-secondary text-neo-secondary px-4 py-2 border-2 border-neo-secondary font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full rounded-lg"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ANALISANDO...
                      </span>
                    ) : (
                      `ANALISAR ${uploadedFiles.length} ARQUIVO(S)`
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Recent Resumes Table */}
        <div className="bg-neo-primary border-2 border-neo-secondary p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl text-neo-secondary">CURRÍCULOS RECENTES</h3>
            <a href="/resumes" className="bg-neo-primary text-neo-secondary px-4 py-2 border-2 border-neo-secondary font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
              VER TODOS
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-neo-secondary">
                  <th className="text-left p-2 font-black text-neo-secondary">CANDIDATO</th>
                  <th className="text-left p-2 font-black text-neo-secondary">ARQUIVO</th>
                  <th className="text-left p-2 font-black text-neo-secondary">DATA</th>
                </tr>
              </thead>
              <tbody>
                {recentResumes.map((resume) => (
                  <tr key={resume.resume_id} className="border-b border-neo-secondary">
                    <td className="p-2 font-medium text-neo-secondary">{resume.candidate_name || 'N/A'}</td>
                    <td className="p-2 text-neo-secondary">{resume.file_name || 'N/A'}</td>
                    <td className="p-2 text-neo-secondary">
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="text-neo-secondary" />
                        {new Date(resume.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}