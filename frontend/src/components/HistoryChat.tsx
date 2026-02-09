import { useState, useEffect, useRef } from "react";
import { resumeService, jobService, chatService, API_URL } from "../lib/api";
import { useSavedIndexes } from "../hooks/useSavedIndexes";
import { useChatSessions } from "../hooks/useChatSessions";
import { useAuth } from "../contexts/AuthContext";
import { FileText, Briefcase, Send, Bot, User, Loader2, MessageSquare, CheckCircle2, Plus, History, Trash2, Pencil } from "lucide-react";
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

export default function HistoryChat({ indexId: initialIndexId, openSessionId }: { indexId?: string; openSessionId?: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndexId, setSelectedIndexId] = useState<string>(initialIndexId || "");
  
  // Estados para controle de Modo (Currículos vs Vaga)
  const [queryMode, setQueryMode] = useState<"resumes" | "job">("resumes");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  
  const { user } = useAuth();
  const userId = user?.id ?? "";
  // Chat history com cache (React Query) – evita várias chamadas à API
  const { sessions: chatSessions, isLoading: chatLoading, invalidate: invalidateChatSessions, refetch: refetchChatSessions } = useChatSessions(user?.id);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const { savedIndexes, loading: indexesLoading } = useSavedIndexes();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const jobSelectionInProgress = useRef(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Carregar vagas quando mudar para modo Job
  useEffect(() => {
    loadJobs();
  }, []); // Carrega uma vez no mount para garantir

  // Carregar sessão atual do backend após carregar sessões (ou abrir a sessão vinda do histórico)
  useEffect(() => {
    if (chatSessions.length === 0) return;
    if (openSessionId) {
      const session = chatSessions.find((s) => s.session_id === openSessionId);
      if (session) selectChatSession(session);
      return;
    }
    loadCurrentSession();
  }, [chatSessions, openSessionId]);

  // Salvar sessão atual no backend
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
      // Reutiliza sessão atual OU a passada pela página Analysis (openSessionId), para não criar dois chats
      const existingSessionId = currentSessionId || openSessionId || null;
      let sessionIdToUse: string;

      if (existingSessionId) {
        sessionIdToUse = existingSessionId;
        if (!currentSessionId) setCurrentSessionId(existingSessionId);
        try {
          await chatService.updateSessionTitle(existingSessionId, userId, title);
          invalidateChatSessions();
          await refetchChatSessions();
        } catch (_) {
          // ignora falha ao atualizar título
        }
      } else {
        const session = await chatService.createSession({
          user_id: userId,
          title,
        });
        sessionIdToUse = session.session_id;
        setCurrentSessionId(sessionIdToUse);
        invalidateChatSessions();
        await refetchChatSessions();
      }

      // Feedback visual
      setMessages((prev) => [...prev, { 
        sender: "Sistema", 
        text: `✅ **Vaga Confirmada:** ${selectedJob.title}\nLocal: ${selectedJob.location}\n\nAnalisando candidatos compatíveis...` 
      }]);

      if (selectedIndexId) {
        try {
          const autoQuery = `Vaga: ${selectedJob.title} - ${selectedJob.description}. Com base nesta vaga, analise os melhores candidatos, indicando pontos fortes, fracos e score de aderência.`;
          const data = await resumeService.search(autoQuery, selectedIndexId);
          
          setMessages((prev) => [...prev, {
            sender: "Sistema",
            text: `📊 **Análise Automática**\n\n${data.response}`
          }]);

          await saveMessagesToBackend(autoQuery, data.response, sessionIdToUse);
        } catch (error) {
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

    setMessages((prev) => [...prev, { sender: "Usuário", text: messageToSend }]);
    setInput("");
    setLoading(true);

    try {
      let query = messageToSend;
      if (queryMode === "job") {
        const selectedJob = jobs.find(job => job.id === selectedJobId);
        if (selectedJob) {
          query = `Contexto da Vaga: ${selectedJob.title} (${selectedJob.description}). Pergunta: ${messageToSend}`;
        }
      }

      const data = await resumeService.search(query, selectedIndexId);
      setMessages((prev) => [...prev, { sender: "Assistente", text: data.response }]);

      // Save to backend
      await saveMessagesToBackend(messageToSend, data.response);
    } catch (error) {
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
    if (!userId) return; // Chats são salvos no banco apenas para usuário autenticado
    try {
      let sessionId = sessionIdOverride ?? currentSessionId;
      if (!sessionId) {
        // Create new session (vinculado ao usuário autenticado)
        const session = await chatService.createSession({
          user_id: userId,
          title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        });
        sessionId = session.session_id;
        setCurrentSessionId(sessionId);
        invalidateChatSessions();
        await refetchChatSessions();
      }

      // Add messages
      await chatService.addMessage(sessionId, { sender: "Usuário", text: userMessage });
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
      invalidateChatSessions();
      await refetchChatSessions();
      setMessages([]);
      setInput("");
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
    setCurrentSessionId(session.session_id);
    setMessages([]);
    try {
      const msgs = await chatService.getSessionMessages(session.session_id);
      const formattedMessages: Message[] = msgs.map(m => ({
        sender: m.sender,
        text: m.text,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && selectedIndexId && (queryMode === "resumes" || selectedJobId) && input.trim()) {
      handleSend();
    }
  };

  return (
    <div className="flex h-[750px] w-full bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden font-sans">
      
      {/* Modal confirmar exclusão */}
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
      <div className="w-80 bg-gray-50 border-r border-black flex flex-col">
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
                  "group flex items-center gap-1 w-full text-left p-3 border border-gray-300 hover:border-black transition-all text-sm",
                  currentSessionId === session.session_id ? "bg-black text-white border-black" : "bg-white text-gray-700"
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

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
      
      {/* --- HEADER DE CONFIGURAÇÃO (Topo) --- */}
      <div className="bg-gray-50  border-black p-5 space-y-5">
        {/* 2. Seleção de Modo (A PARTE QUE VOCÊ PEDIU DE VOLTA) */}
        <div className=" border-gray-300 ">
          
          <div className="flex flex-wrap gap-4">
            
            {/* Opção A: Chat Livre (Currículos) */}
            <label 
              htmlFor="mode-resumes" 
              className={cn(
                "flex items-center gap-3 px-4 py-3 border cursor-pointer transition-all duration-200 select-none",
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
                className="hidden" // Esconde o rádio padrão feio
              />
              <FileText className="w-5 h-5" />
              <div className="flex flex-col flex-1">
                <span className="text-xs font-black uppercase">Chat</span>
                <span className="text-[10px] font-medium opacity-80">Pergunte sobre currículos</span>
              </div>
              {queryMode === "resumes" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            </label>

            {/* Opção B: Usar Vaga */}
            <label 
              htmlFor="mode-job" 
              className={cn(
                "flex items-center justify-between px-4 py-3 border cursor-pointer transition-all duration-200 select-none",
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
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5" />
                <div className="flex flex-col mr-3">
                  <span className="text-xs font-black uppercase">Seleciona uma vaga</span>
                  <span className="text-[10px] font-medium opacity-80">Analisar compatibilidade</span>
                </div>
              </div>
              {queryMode === "job" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            </label>
          </div>
        </div>

        {/* 3. Seletor de Vaga (Aparece apenas se modo Vaga selecionado) */}
        {queryMode === "job" && (
          <div className="flex items-end gap-3 animate-in slide-in-from-top-2 duration-300 bg-yellow-50 p-3 border border-black border-dashed">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-500">Selecione a Vaga para cruzar dados:</label>
              {jobsLoading ? (
                <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Carregando vagas...</div>
              ) : (
                <div className="relative">
                  <details 
                    className="relative"
                    open={isJobDropdownOpen}
                    onToggle={(e) => setIsJobDropdownOpen((e.target as HTMLDetailsElement).open)}
                  >
                    <summary 
                      className="w-full py-2 pl-3 pr-10 border-1 cursor-pointer border-black  font-semibold text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-black list-none"
                      style={{ 
                        color: selectedJobId ? '#000000' : '#6b7280',
                      }}
                    >
                      {selectedJobId 
                        ? `${jobs.find(j => j.id === selectedJobId)?.title || 'Vaga selecionada'}`
                        : 'Selecione uma vaga'
                      }
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </summary>
                    <div className="absolute z-50 w-full mt-1 border-1
                     border-black  bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobId('');
                          setIsJobDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
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
                          className="cursor-pointer w-full text-left px-3 py-2.5 font-semibold text-black bg-white hover:bg-neo-blue transition-colors border-t border-gray-200 text-sm"
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
              className="cursor-pointer bg-neo-blue text-neo-secondary px-4 py-2 border border-black font-black uppercase text-xs   disabled:opacity-50 h-[38px]"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <div className="w-16 h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
            </div>
            <p className="font-bold uppercase tracking-wider text-sm text-neo-secondary">Histórico Vazio</p>
            <p className="text-xs mt-2 text-neo-secondary font-extrabold">Digite a descrição da vaga abaixo ou selecione acima uma vaga cadastrada.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.sender === "Usuário" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.sender !== "Usuário" && <Bot className="w-3 h-3 text-black" />}
                <span className="text-[10px] font-black uppercase text-gray-500">
                  {message.sender}
                </span>
                {message.sender === "Usuário" && <User className="w-3 h-3 text-black" />}
              </div>
              
              <div className={cn(
                "p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] border",
                message.sender === "Usuário"
                  ? "bg-black text-white border-black rounded-xl rounded-tr-none"
                  : "bg-white text-black border-black rounded-xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              )}>
                {message.text}
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex items-start gap-2 mr-auto">
             <div className="bg-white border border-black px-4 py-3   rounded-tl-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold uppercase">Analisando...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-black flex gap-2">
        <input
          type="text"
          className="
            flex-1 
            bg-white 
            border border-black 
            px-4 py-3 
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
            px-6 
            bg-yellow-300 text-black 
            border border-black 
            font-black uppercase text-xs tracking-wider
            hover:bg-yellow-400 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]
            active:translate-y-0 active:shadow-none
            disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed
            transition-all
            flex items-center gap-2
          "
          onClick={handleSend}
          disabled={loading || !input.trim() || !selectedIndexId || (queryMode === "job" && !selectedJobId)}
        >
          <span className="hidden sm:inline">Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
    </div>
  );
}