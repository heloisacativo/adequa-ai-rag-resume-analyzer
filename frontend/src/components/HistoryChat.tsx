import { useState, useEffect, useRef } from "react";
import { resumeService, jobService, chatService, API_URL } from "../lib/api";
import { useSavedIndexes } from "../hooks/useSavedIndexes";
import { useChatSessions } from "../hooks/useChatSessions";
import { useAuth } from "../contexts/AuthContext";
import { FileText, Briefcase, Send, Bot, User, Loader2, MessageSquare, CheckCircle2, Plus, History, Trash2, Pencil, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  sender: string;
  text: string;
}

interface ChatSession {
  session_id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export default function HistoryChat({ indexId: initialIndexId, openSessionId, onBack }: { indexId?: string; openSessionId?: string; onBack?: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndexId, setSelectedIndexId] = useState<string>(initialIndexId || "");
  
  const [queryMode, setQueryMode] = useState<"resumes" | "job">("resumes");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { sessions: chatSessions, isLoading: chatLoading, invalidate: invalidateChatSessions, refetch: refetchChatSessions } = useChatSessions(user?.id);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const { savedIndexes, loading: indexesLoading } = useSavedIndexes();
  const jobSelectionInProgress = useRef(false);

  useEffect(() => {
    loadJobs();
  }, []); 

  useEffect(() => {
    if (chatSessions.length === 0 || loading) return; 
    if (openSessionId) {
      const session = chatSessions.find((s) => s.session_id === openSessionId);
      if (session) selectChatSession(session);
      return;
    }
    loadCurrentSession();
  }, [chatSessions, openSessionId]);

  useEffect(() => {
    saveCurrentSession();
  }, [currentSessionId]);

  const loadCurrentSession = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/users/current-session?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.current_session_id && chatSessions.length > 0) {
          const session = chatSessions.find(s => s.session_id === data.current_session_id);
          if (session) {
            selectChatSession(session);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar sessão atual:", error);
    }
  };

  const saveCurrentSession = async () => {
    if (!userId) return;
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token") || ""}` };
      if (currentSessionId) {
        await fetch(`${API_URL}/api/v1/users/current-session?user_id=${userId}&session_id=${currentSessionId}`, {
          method: "PUT",
          headers,
        });
      } else {
        await fetch(`${API_URL}/api/v1/users/current-session?user_id=${userId}`, {
          method: "DELETE",
          headers,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar sessão atual:", error);
    }
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await jobService.listJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      console.error("Erro ao carregar vagas:", error);
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleJobSelection = async () => {
    if (!selectedJobId) return;
    if (!userId) {
      alert("Faça login para salvar chats vinculados à sua conta.");
      return;
    }
    if (jobSelectionInProgress.current) return;
    jobSelectionInProgress.current = true;
    setLoading(true);

    try {
      const selectedJob = jobs.find(job => job.id === selectedJobId);
      if (!selectedJob) return;

      const title = `Análise de Vaga: ${selectedJob.title}`;
      const existingSessionId = currentSessionId || openSessionId || null;
      let sessionIdToUse: string;

      if (existingSessionId) {
        sessionIdToUse = existingSessionId;
        if (!currentSessionId) setCurrentSessionId(existingSessionId);
        try {
          await chatService.updateSessionTitle(existingSessionId, userId, title);
        } catch (_) {
        } 
      } else {
        const session = await chatService.createSession({
          user_id: userId,
          title,
        });
        sessionIdToUse = session.session_id;
        setCurrentSessionId(sessionIdToUse);
        // Invalidação apenas quando necessário
      }

      setMessages((prev) => [...prev, { 
        sender: "Você", 
        text: `Vaga: ${selectedJob.title}\nLocal: ${selectedJob.location}\n` 
      }]);

      if (selectedIndexId) {
        try {
          const autoQuery = `Vaga: ${selectedJob.title} - Localização: ${selectedJob.location} - Descrição: ${selectedJob.description}. Com base nesta vaga, analise os melhores candidatos considerando compatibilidade de localização, pontos fortes, fracos e score de aderência.`;
          const data = await resumeService.search(autoQuery, selectedIndexId);
          
          const assistantMessage = {
            sender: "Assistente",
            text: `Resposta baseado em análise com Inteligência Artificial\n${data.response}`
          };
          
          setMessages((prev) => [...prev, assistantMessage]);

          try {
            await saveMessagesToBackend(autoQuery, data.response, sessionIdToUse);
            setTimeout(() => {
              invalidateChatSessions();
            }, 100);
          } catch (backendError) {
            console.error("Erro ao salvar análise automática no backend:", backendError);
          }
        } catch (error) {
          console.error("Erro na análise automática:", error);
          setMessages((prev) => [...prev, {
            sender: "Sistema",
            text: "Erro ao gerar análise automática. Tente perguntar manualmente."
          }]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      jobSelectionInProgress.current = false;
    }
  };
  
  const handleSend = async () => {
    if (!selectedIndexId) {
      alert("Por favor, selecione uma base de currículos.");
      return;
    }

    if (queryMode === "job" && !selectedJobId) {
      alert("Por favor, selecione e confirme uma vaga primeiro.");
      return;
    }

    const messageToSend = input.trim();
    if (!messageToSend) return;

    const userMessage = { sender: "Você", text: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let query = messageToSend;
      if (queryMode === "job") {
        const selectedJob = jobs.find(job => job.id === selectedJobId);
        if (selectedJob) {
          const needsJobContext = /\b(ader[êe]ncia|compatib|adequa|match|encaixa|atende|requisito|qualifica|perfil|vaga)\b/i.test(messageToSend);
          
          if (needsJobContext) {
            query = `Contexto da Vaga: ${selectedJob.title} - Localização: ${selectedJob.location} - Descrição: ${selectedJob.description}. Pergunta: ${messageToSend}`;
          } else {
            query = `[Vaga de referência: ${selectedJob.title}] ${messageToSend}`;
          }
        }
      }

      const data = await resumeService.search(query, selectedIndexId);
      const assistantMessage = { sender: "Assistente", text: data.response };
      
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        await saveMessagesToBackend(messageToSend, data.response);
        setTimeout(() => {
          if (userId) invalidateChatSessions();
        }, 100);
      } catch (backendError) {
        console.error("Erro ao salvar no backend:", backendError);
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setMessages((prev) => [...prev, { sender: "Assistente", text: "Erro ao processar resposta." }]);
    } finally {
      setLoading(false);
    }
  };

  const saveMessagesToBackend = async (
    userMessage: string,
    assistantMessage: string,
    sessionIdOverride?: string
  ) => {
    if (!userId) return;
    try {
      let sessionId = sessionIdOverride ?? currentSessionId;
      if (!sessionId) {
        const session = await chatService.createSession({
          user_id: userId,
          title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        });
        sessionId = session.session_id;
        setCurrentSessionId(sessionId);
      }

      await chatService.addMessage(sessionId, { sender: "Você", text: userMessage });
      await chatService.addMessage(sessionId, { sender: "Assistente", text: assistantMessage });
    } catch (error) {
      console.error("Erro ao salvar mensagens:", error);
    }
  };

  const createNewChat = async () => {
    if (!userId) return;
    try {
      const session = await chatService.createSession({
        user_id: userId,
        title: `Novo Chat ${new Date().toLocaleString()}`,
      });
      setCurrentSessionId(session.session_id);
      setMessages([]);
      setInput("");
      invalidateChatSessions();
      await refetchChatSessions();
    } catch (error) {
      console.error("Erro ao criar novo chat:", error);
    }
  };

  const confirmDeleteSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setSessionToDelete(session);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!userId) return;
    setIsDeletingSession(true);
    try {
      await chatService.deleteSession(sessionId, userId);
      invalidateChatSessions();
      await refetchChatSessions();
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      setSessionToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir conversa:", err);
    } finally {
      setIsDeletingSession(false);
    }
  };

  const startEditingTitle = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.session_id);
    setEditingTitle(session.title);
  };

  const saveSessionTitle = async (sessionId: string) => {
    const title = editingTitle.trim() || "Sem título";
    if (!userId) return;
    setEditingSessionId(null);
    try {
      await chatService.updateSessionTitle(sessionId, userId, title);
      invalidateChatSessions();
      await refetchChatSessions();
    } catch (err) {
      console.error("Erro ao alterar título:", err);
      setEditingSessionId(sessionId);
    }
  };

  const selectChatSession = async (session: ChatSession) => {
    if (loading) return; // Evita carregar sessão durante envio de mensagens
    setLoadingSession(true);
    setCurrentSessionId(session.session_id);
    setMessages([]);
    try {
      const msgs = await chatService.getSessionMessages(session.session_id);
      const formattedMessages: Message[] = msgs.map(m => ({
        sender: m.sender,
        text: m.text,
      }));
      if (!loading) {
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && selectedIndexId && (queryMode === "resumes" || selectedJobId) && input.trim()) {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden font-sans h-full">
      {/* HEADER */}
      <div className="h-12 min-[360px]:h-14 sm:h-16 lg:h-20 flex items-center px-2 min-[360px]:px-3 sm:px-4 border-b-2 border-black bg-white shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="cursor-pointer flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-bold border-2 border-black rounded hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-black uppercase text-neo-secondary">Chat de Análise</h1>
            <p className="text-xs md:text-sm text-gray-600 font-medium">Utilize IA para analisar currículos e compatibilidade com vagas</p>
          </div>
        </div>
      
      </div>

      <div className="flex flex-1 overflow-hidden">
      
        {sessionToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSessionToDelete(null)}
        >
          <div
            className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold uppercase tracking-wide mb-1">Excluir conversa</p>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja excluir &quot;{sessionToDelete.title}&quot;? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 border border-black font-bold uppercase text-xs bg-white cursor-pointer hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(sessionToDelete.session_id)}
                disabled={isDeletingSession}
                className="px-4 py-2 bg-neo-blue text-neo-secondary border border-black font-bold uppercase text-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingSession ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-48 md:w-80 bg-gray-50 border-r border-black flex flex-col">
        <div className="p-4 border-b border-black space-y-2">
          
          <button
            onClick={createNewChat}
            disabled={!userId}
            className="cursor-pointer w-full bg-neo-blue  text-neo-secondary px-4 py-2 border border-black font-black uppercase text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Novo Chat
          </button>
          {userId && (
            <p className="text-[10px] text-gray-500 text-center leading-tight">
              Máx. 10 conversas. A mais antiga é excluída ao passar do limite.
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!userId ? (
            <div className="text-sm text-gray-500 text-center py-8">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Faça login para ver e salvar seus chats no banco de dados.
            </div>
          ) : chatLoading ? (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Carregando chats...</div>
          ) : chatSessions.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Nenhum chat ainda
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.session_id}
                className={cn(
                  "cursor-pointer group flex items-center gap-1 w-full text-left p-3 border border-gray-300 hover:border-black transition-all text-sm",
                  currentSessionId === session.session_id ? "bg-black text-white border-black" : " bg-white text-gray-700"
                )}
              >
                <button
                  type="button"
                  onClick={() => selectChatSession(session)}
                  className="flex-1 min-w-0 text-left"
                >
                  {editingSessionId === session.session_id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => saveSessionTitle(session.session_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveSessionTitle(session.session_id);
                        if (e.key === "Escape") {
                          setEditingSessionId(null);
                          setEditingTitle("");
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full font-bold text-sm px-1 py-0.5 border border-black bg-white text-black focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="font-bold truncate">{session.title}</div>
                  )}
                  <div className="text-xs opacity-70">
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </button>
                {editingSessionId !== session.session_id && (
                  <button
                    type="button"
                    onClick={(e) => startEditingTitle(e, session)}
                    title="Editar título"
                    className={cn(
                      "p-1.5 rounded shrink-0 opacity-70 hover:opacity-100 transition-opacity",
                      currentSessionId === session.session_id ? "hover:bg-white/20 text-white" : " cursor-pointer hover:bg-neo-blue text-neo-secondary"
                    )}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => confirmDeleteSession(e, session)}
                  title="Excluir conversa"
                  className={cn(
                    "p-1.5 rounded shrink-0 opacity-70 hover:opacity-100 transition-opacity",
                    currentSessionId === session.session_id ? "hover:bg-white/20 text-white" : " cursor-pointer hover:bg-neo-blue text-neo-secondary"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
      
      <div className="bg-gray-50 border-black p-2 md:p-3 space-y-2 md:space-y-3 flex-shrink-0">
        <div className="border-gray-300">
          
          <div className="flex flex-wrap gap-1 md:gap-2">
            
            <label 
              htmlFor="mode-resumes" 
              className={cn(
                "flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 border cursor-pointer transition-all duration-200 select-none text-xs md:text-sm",
                queryMode === "resumes" 
                  ? "bg-neo-blue text-neo-secondary border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                  : "bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black"
              )}
            >
              <input
                type="radio"
                id="mode-resumes"
                name="queryMode"
                value="resumes"
                checked={queryMode === "resumes"}
                onChange={() => setQueryMode("resumes")}
                className="hidden" 
              />
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <div className="flex flex-col flex-1">
                <span className="text-[10px] md:text-xs font-black uppercase">Chat</span>
                <span className="text-[8px] md:text-[10px] font-medium opacity-80">Pergunte sobre currículos</span>
              </div>
              {queryMode === "resumes" && <CheckCircle2 className="w-2 h-2 md:w-3 md:h-3 text-green-400" />}
            </label>

            <label 
              htmlFor="mode-job" 
              className={cn(
                "flex items-center justify-between px-2 md:px-3 py-1 md:py-2 border cursor-pointer transition-all duration-200 select-none text-xs md:text-sm",
                queryMode === "job" 
                  ? "bg-neo-blue text-neo-secondary border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                  : "bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black"
              )}
            >
              <input
                type="radio"
                id="mode-job"
                name="queryMode"
                value="job"
                checked={queryMode === "job"}
                onChange={() => setQueryMode("job")}
                className="hidden"
              />
              <div className="flex items-center gap-1 md:gap-2">
                <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
                <div className="flex flex-col mr-1 md:mr-2">
                  <span className="text-[10px] md:text-xs font-black uppercase">Seleciona uma vaga</span>
                  <span className="text-[8px] md:text-[10px] font-medium opacity-80">Analisar compatibilidade</span>
                </div>
              </div>
              {queryMode === "job" && <CheckCircle2 className="w-2 h-2 md:w-3 md:h-3 text-green-400" />}
            </label>
          </div>
        </div>

        {queryMode === "job" && (
          <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-2 animate-in slide-in-from-top-2 duration-300 bg-yellow-50 p-1 md:p-2 border border-black border-dashed">
            <div className="flex-1 space-y-1">
              <label className="text-[8px] md:text-[10px] font-bold uppercase text-gray-500">Selecione a Vaga para cruzar dados:</label>
              {jobsLoading ? (
                <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"><Loader2 className="w-2 h-2 md:w-3 md:h-3 animate-spin"/> Carregando vagas...</div>
              ) : (
                <div className="relative">
                  <details 
                    className="relative"
                    open={isJobDropdownOpen}
                    onToggle={(e) => setIsJobDropdownOpen((e.target as HTMLDetailsElement).open)}
                  >
                    <summary 
                      className="w-full py-1 md:py-2 pl-2 md:pl-3 pr-6 md:pr-8 border-1 cursor-pointer border-black font-semibold text-xs md:text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-black list-none"
                      style={{ 
                        color: selectedJobId ? '#000000' : '#6b7280',
                      }}
                    >
                      {selectedJobId 
                        ? `${jobs.find(j => j.id === selectedJobId)?.title || 'Vaga selecionada'}`
                        : 'Selecione uma vaga'
                      }
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 md:pr-2">
                        <svg className="h-3 w-3 md:h-4 md:w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </summary>
                    <div className="absolute z-50 w-full mt-1 border-1 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobId('');
                          setIsJobDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 md:px-3 py-1 md:py-2.5 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors text-xs md:text-sm"
                      >
                        Selecione uma vaga
                      </button>
                      {jobs.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setIsJobDropdownOpen(false);
                          }}
                          className="cursor-pointer hover:bg-neo-primary w-full text-left px-2 md:px-3 py-1 md:py-2.5 font-semibold text-black bg-white hover:bg-purple-50 transition-colors border-t border-gray-200 text-xs md:text-sm"
                        >
                          {job.title}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
            <button
              onClick={handleJobSelection}
              disabled={loading || !selectedJobId}
              className="cursor-pointer bg-neo-blue text-neo-secondary px-2 md:px-3 py-1 md:py-2 border border-black font-black uppercase text-[10px] md:text-xs disabled:opacity-50 h-[30px] md:h-[38px]"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-6  bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] relative">
        {loadingSession ? (
          <div className="absolute inset-3 md:inset-6 flex flex-col items-center justify-center text-gray-400 opacity-60">
            <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
            </div>
            <p className="font-bold uppercase tracking-wider text-sm text-neo-secondary">Carregando conversa</p>
            <p className="text-xs mt-2 text-neo-secondary font-extrabold">Aguarde enquanto carregamos suas mensagens...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="absolute inset-3 md:inset-6 flex flex-col items-center justify-center text-gray-400 opacity-60">
              <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <p className="font-bold uppercase tracking-wider text-sm text-neo-secondary">Histórico Vazio</p>
            <p className="text-xs mt-2 text-neo-secondary font-extrabold">Digite a descrição da vaga abaixo ou selecione acima uma vaga cadastrada.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col max-w-[90%] md:max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.sender === "Você" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-1 md:gap-2 mb-1">
                {message.sender !== "Você" && <Bot className="w-2 h-2 md:w-3 md:h-3 text-black" />}
                <span className="text-[9px] md:text-[10px] font-black uppercase text-gray-500">
                  {message.sender}
                </span>
                {message.sender === "Você" && <User className="w-2 h-2 md:w-3 md:h-3 text-black" />}
              </div>
              
              <div
  className={cn(
    // 1. AJUSTES DE LEITURA E ESPAÇAMENTO:
    // - px-5 py-3: Reduz a altura (antes era p-5 geral), deixando o balão mais "fit".
    // - leading-snug: Aperta o texto (altura de linha menor), removendo os buracos brancos.
    "relative max-w-[85%] px-5 py-3 text-sm font-medium leading-tight whitespace-pre-wrap border border-black",

    // 2. CORES (MANTIDAS EXATAMENTE COMO NO SEU CÓDIGO):
    message.sender === "Você"
      ? "bg-neo-blue text-black rounded-xl rounded-tr-none"
      : "bg-white text-black rounded-xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
  )}
>
  {message.text}
</div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex items-start gap-1 md:gap-2 mr-auto">
             <div className="bg-white border border-black px-3 md:px-4 py-2 md:py-3 rounded-tl-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 md:gap-2">
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                <span className="text-xs font-bold uppercase">Analisando...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 bg-white border-t border-black flex gap-1 md:gap-2">
        <input
          type="text"
          className="
            flex-1 
            bg-white 
            border border-black 
            px-2 md:px-4 py-2 md:py-3 
            text-sm font-medium
            placeholder:text-gray-400 placeholder:font-bold placeholder:uppercase placeholder:text-xs
            focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[1px]
            transition-all
          "
          placeholder={
            queryMode === "resumes"
              ? "Pergunte algo sobre os currículos..."
              : "Pergunte sobre a aderência à vaga selecionada..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || !selectedIndexId || (queryMode === "job" && !selectedJobId)}
        />
        <button
          className="
            px-4 md:px-6 
            bg-neo-blue text-black 
            border border-black 
            font-black uppercase text-xs tracking-wider
            hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]
            active:translate-y-0 active:shadow-none
            disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed
            transition-all
            flex items-center gap-1 md:gap-2
            cursor-pointer
          "
          onClick={handleSend}
          disabled={loading || !input.trim() || !selectedIndexId || (queryMode === "job" && !selectedJobId)}
        >
          <span className="hidden sm:inline">Enviar</span>
          <Send className="w-3 h-3 md:w-4 md:h-4" />
        </button>
      </div>
        </div>
      </div>
    </div>
  );
}