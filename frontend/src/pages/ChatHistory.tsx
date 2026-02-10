import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { useChatSessions } from "../hooks/useChatSessions";
import { chatService } from "../lib/api";
import { MessageSquare, Loader2, History, ArrowRight, Trash2, Pencil } from "lucide-react";
import { cn } from "../lib/utils";

const MAX_CONVERSATIONS = 10;

export default function ChatHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, isLoading: loading, invalidate, refetch } = useChatSessions(user?.id);
  const [sessionToEdit, setSessionToEdit] = useState<{ session_id: string; title: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [savingTitle, setSavingTitle] = useState(false);

  const openConversation = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  const handleDelete = async (sessionId: string) => {
    if (!user?.id) return;
    setDeletingSessionId(sessionId);
    try {
      await chatService.deleteSession(sessionId, user.id);
      invalidate();
      await refetch();
      setDeleteConfirmSessionId(null);
    } catch (err) {
      console.error("Erro ao excluir conversa:", err);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const saveTitle = async (sessionId: string) => {
    const title = editingTitle.trim() || "Sem título";
    if (!user?.id) return;
    setSavingTitle(true);
    try {
      await chatService.updateSessionTitle(sessionId, user.id, title);
      invalidate();
      await refetch();
      setSessionToEdit(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Erro ao alterar título:", err);
    } finally {
      setSavingTitle(false);
    }
  };

  const openEditModal = (session: { session_id: string; title: string }) => {
    setSessionToEdit({ session_id: session.session_id, title: session.title });
    setEditingTitle(session.title);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black uppercase text-black flex items-center gap-2">
            <MessageSquare className="w-7 h-7" />
            Histórico de conversas
          </h1>
          <p className="text-gray-600 font-medium mt-1">
            Suas conversas com a análise de currículos por IA.
          </p>
        </div>

        <div className="bg-amber-50 border-2 border-neo-secondary rounded-lg p-4 flex items-start gap-3">
          <History className="w-5 h-5 text-neo-secondary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-neo-secondary">
              Limite de {MAX_CONVERSATIONS} conversas
            </p>
            <p className="text-sm text-neo-secondary mt-0.5">
              São mantidas no máximo {MAX_CONVERSATIONS} conversas. Ao criar a 11ª, a mais antiga é excluída automaticamente.
            </p>
          </div>
        </div>

        {!user?.id ? (
          <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-8 text-center text-gray-600 font-medium">
            Faça login para ver seu histórico de conversas.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Carregando conversas...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="font-bold text-gray-600 mb-2">Nenhuma conversa ainda</p>
            <p className="text-sm text-gray-500 mb-6">
              Inicie uma conversa em Análise com IA para ela aparecer aqui.
            </p>
            <button
              type="button"
              onClick={() => navigate("/ia-analysis")}
              className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded font-bold uppercase text-sm hover:bg-gray-800"
            >
              Ir para Análise com IA
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.session_id}
                className={cn(
                  "bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 hover:border-black transition-colors"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-black truncate">{session.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(session.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(session)}
                    title="Editar título"
                    className="cursor-pointer p-2 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmSessionId(session.session_id)}
                    title="Excluir conversa"
                    className="cursor-pointer p-2 rounded border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openConversation(session.session_id)}
                    className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-800"
                  >
                    Abrir
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de edição de título */}
      {sessionToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
          onClick={() => {
            setSessionToEdit(null);
            setEditingTitle("");
          }}
        >
          <div
            className="bg-white border-2 border-black rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-black uppercase text-black mb-2">Editar título da conversa</p>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle(sessionToEdit.session_id);
                if (e.key === "Escape") {
                  setSessionToEdit(null);
                  setEditingTitle("");
                }
              }}
              placeholder="Título da conversa"
              className="w-full font-bold text-black px-3 py-2.5 border-2 border-black rounded-lg focus:outline-none mb-6"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSessionToEdit(null);
                  setEditingTitle("");
                }}
                className="cursor-pointer px-4 py-2.5 rounded-lg font-black uppercase text-sm border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveTitle(sessionToEdit.session_id)}
                disabled={savingTitle}
                className="cursor-pointer px-4 py-2.5 rounded-lg font-black uppercase text-sm border-2 border-black bg-neo-blue text-neo-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {savingTitle ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirmSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white border-2 border-black rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black uppercase text-black mb-2">Excluir conversa?</p>
            <p className="text-gray-700 font-bold text-sm mb-6">
              Esta ação não pode ser desfeita. A conversa será removida permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSessionId(null)}
                className="cursor-pointer px-4 py-2.5 rounded-lg font-black uppercase text-sm border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmSessionId)}
                disabled={!!deletingSessionId}
                className="cursor-pointer px-4 py-2.5 rounded-lg font-black uppercase text-sm border-2 border-black bg-neo-blue text-neo-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-red-500 disabled:hover:translate-y-0"
              >
                {deletingSessionId ? "Excluindo" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
