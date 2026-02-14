import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { FolderOpen, Plus, Trash2, X, FileText, Loader2, Search } from 'lucide-react';
import { resumeService } from '../lib/api';
import type { ResumeGroup, ResumeItem } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { cn } from '../lib/utils';

export default function ResumesGroups() {
  const { user } = useAuth();
  const { resumes: allResumes } = useResumes(user?.id);
  const [groups, setGroups] = useState<ResumeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ResumeGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ResumeGroup | null>(null);
  const [groupResumeIds, setGroupResumeIds] = useState<Set<string>>(new Set());
  const [savingResumes, setSavingResumes] = useState(false);
  const [resumeFilter, setResumeFilter] = useState('');

  const loadGroups = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await resumeService.listResumeGroups();
      setGroups(res.groups);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar grupos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError(null);
    try {
      const g = await resumeService.createResumeGroup(newGroupName.trim());
      setGroups((prev) => [{ ...g, resume_count: 0 }, ...prev]);
      setNewGroupName('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar grupo.');
    }
  };

  const openDeleteModal = (g: ResumeGroup) => {
    setGroupToDelete(g);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    setDeleting(true);
    try {
      await resumeService.deleteResumeGroup(groupToDelete.group_id);
      setGroups((prev) => prev.filter((x) => x.group_id !== groupToDelete.group_id));
      setShowDeleteModal(false);
      setGroupToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir.');
    } finally {
      setDeleting(false);
    }
  };

  const openEditResumes = async (g: ResumeGroup) => {
    setEditingGroup(g);
    setResumeFilter('');
    setGroupResumeIds(new Set());
    try {
      const res = await resumeService.getGroupResumes(g.group_id);
      setGroupResumeIds(new Set(res.resumes.map((r) => r.resume_id)));
    } catch {
      setGroupResumeIds(new Set());
    }
  };

  const toggleResumeInGroup = (resumeId: string) => {
    setGroupResumeIds((prev) => {
      const next = new Set(prev);
      if (next.has(resumeId)) next.delete(resumeId);
      else next.add(resumeId);
      return next;
    });
  };

  const saveGroupResumes = async () => {
    if (!editingGroup) return;
    setSavingResumes(true);
    try {
      await resumeService.setGroupResumes(editingGroup.group_id, Array.from(groupResumeIds));
      setGroups((prev) =>
        prev.map((x) =>
          x.group_id === editingGroup.group_id ? { ...x, resume_count: groupResumeIds.size } : x
        )
      );
      setEditingGroup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSavingResumes(false);
    }
  };

  const resumeList = Array.isArray(allResumes) ? allResumes : [];
  const resumeFilterLower = resumeFilter.trim().toLowerCase();
  const filteredResumeList = resumeFilterLower
    ? resumeList.filter(
        (r) =>
          r.candidate_name?.toLowerCase().includes(resumeFilterLower) ||
          r.file_name?.toLowerCase().includes(resumeFilterLower)
      )
    : resumeList;

  return (
    <AppLayout>
      <div className="p-4 space-y-8 pb-10 font-sans text-black">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Grupos de currículos</h1>
            <p className="text-gray-600 font-medium">
              Agrupe currículos para usar na Análise com IA em um clique.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 w-full md:w-auto bg-neo-primary text-neo-secondary tracking-wider border-2 border-black rounded-lg cursor-pointer font-bold text-sm sm:text-base shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            Novo grupo
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 sm:p-4 font-bold flex items-center gap-2 rounded shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
            <span className="shrink-0">⚠️</span>
            <span className="min-w-0">{error}</span>
          </div>
        )}

        {showCreateForm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black uppercase">Criar grupo</h3>
                <button type="button" onClick={() => { setShowCreateForm(false); setNewGroupName(''); }} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide block mb-1">Nome do grupo *</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border-2 border-black rounded focus:outline-none focus:bg-white font-medium"
                    placeholder="Ex: Shortlist Backend"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateForm(false)} className="cursor-pointer px-6 py-2.5 bg-white border-2 border-black rounded font-bold uppercase text-sm">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-black text-white rounded font-bold uppercase text-sm">
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 flex flex-col items-center justify-center">
            <span className="loading loading-spinner loading-lg mb-2 bg-black" />
            <p className="font-bold text-black">Carregando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
            <FolderOpen className="w-12 h-12 mb-4 text-black mx-auto" strokeWidth={1.5} />
            <p className="text-lg font-black uppercase text-black">Nenhum grupo ainda</p>
            <p className="text-sm text-gray-600 mt-1">Crie um grupo para agrupar currículos e usá-los na Análise com IA.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div
                key={g.group_id}
                className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-neo-primary border-2 border-black flex items-center justify-center rounded shrink-0">
                    <FolderOpen className="w-5 h-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black uppercase leading-tight truncate">{g.name}</p>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">{g.resume_count} currículo(s)</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => openEditResumes(g)}
                    className="p-2 cursor-pointer border-2 border-black bg-neo-primary rounded hover:bg-gray-100 transition-colors text-black flex items-center justify-center gap-2"
                    title="Adicionar currículo ao grupo"
                  > <Plus className="w-4 h4" /> Adicionar currículo
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(g)}
                    className="p-3 cursor-pointer border-2 border-black bg-neo-primary rounded hover:bg-red-50 text-neo-secondary transition-colors"
                    title="Excluir grupo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDeleteModal && groupToDelete && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full">
              <p className="text-gray-700 font-medium mb-6">
                Tem certeza que deseja excluir o grupo &quot;{groupToDelete.name}&quot;? Os currículos não são apagados, apenas a organização.
              </p>
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={() => { setShowDeleteModal(false); setGroupToDelete(null); }} className="px-6 cursor-pointer py-2.5 bg-white border-2 border-black rounded font-bold uppercase text-sm">
                  Cancelar
                </button>
                <button type="button" onClick={confirmDelete} disabled={deleting} className="px-6 py-2.5 bg-neo-blue border-neo-secondary border-2 cursor-pointer text-neo-secondary rounded font-bold uppercase text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {deleting ? 'Excluindo' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingGroup && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">
                    Adicionar currículos ao grupo
                  </h3>
                  <p className="text-base text-gray-600 mt-1 font-medium">
                    &quot;{editingGroup.name}&quot;
                  </p>
                </div>
                <button type="button" onClick={() => setEditingGroup(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0" aria-label="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 py-2 px-3 mt-4 mb-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <span className="text-sm font-bold text-gray-700 shrink-0">
                  {groupResumeIds.size} de {resumeList.length} selecionado(s)
                </span>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou arquivo..."
                  value={resumeFilter}
                  onChange={(e) => setResumeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg font-medium text-sm placeholder:text-gray-400 focus:border-black focus:outline-none bg-white"
                />
              </div>

              <p className="text-sm text-gray-600 mb-2 font-medium">
                Marque os currículos que fazem parte deste grupo. Eles poderão ser usados juntos na Análise.
              </p>

              <div className="space-y-2 max-h-[min(420px,55vh)] overflow-y-auto pr-1 border-2 border-gray-100 rounded-lg p-2 bg-gray-50/50">
                {resumeList.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">Nenhum currículo cadastrado.</p>
                    <p className="text-xs text-gray-400 mt-1">Adicione currículos em Currículos primeiro.</p>
                  </div>
                ) : filteredResumeList.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm font-bold text-gray-500">Nenhum resultado para &quot;{resumeFilter}&quot;</p>
                    <p className="text-xs text-gray-400 mt-1">Tente outro termo.</p>
                  </div>
                ) : (
                  filteredResumeList.map((r: ResumeItem) => (
                    <label
                      key={r.resume_id}
                      className={cn(
                        'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all',
                        groupResumeIds.has(r.resume_id)
                          ? 'border-black bg-neo-primary/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={groupResumeIds.has(r.resume_id)}
                        onChange={() => toggleResumeInGroup(r.resume_id)}
                        className="rounded border-2 border-black size-4 shrink-0 accent-black"
                      />
                      <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-sm block truncate">{r.candidate_name || 'Sem nome'}</span>
                        <span className="text-xs text-gray-500 block truncate">{r.file_name}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 mt-4 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-6 py-3 bg-white border-2 border-black rounded-lg font-bold uppercase text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveGroupResumes}
                  disabled={savingResumes}
                  className="cursor-pointer px-6 py-3 bg-black text-white rounded-lg font-bold uppercase text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {savingResumes ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingResumes ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
