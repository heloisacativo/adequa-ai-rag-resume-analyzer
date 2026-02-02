import { useState, useEffect, useRef } from "react";
import { resumeService, jobService, chatService } from "../lib/api";
import { useSavedIndexes } from "../hooks/useSavedIndexes";
import { FileText, Briefcase, Send, Bot, User, Loader2, MessageSquare, CheckCircle2, Plus, History } from "lucide-react";
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

export default function HistoryChat({ indexId: initialIndexId }: { indexId?: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndexId, setSelectedIndexId] = useState<string>(initialIndexId || "");
  
  // Estados para controle de Modo (Currículos vs Vaga)
  const [queryMode, setQueryMode] = useState<"resumes" | "job">("resumes");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  
  // Estados para chat history
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  
  const { savedIndexes, loading: indexesLoading } = useSavedIndexes();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Carregar vagas quando mudar para modo Job
  useEffect(() => {
    loadJobs();
  }, []); // Carrega uma vez no mount para garantir

  // Carregar chat sessions
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Carregar sessão atual do backend após carregar sessões
  useEffect(() => {
    if (chatSessions.length > 0) {
      loadCurrentSession();
    }
  }, [chatSessions]);

  // Salvar sessão atual no backend
  useEffect(() => {
    saveCurrentSession();
  }, [currentSessionId]);

  const loadCurrentSession = async () => {
    try {
      const userId = localStorage.getItem('user_id') || 'fake_user';
      const response = await fetch(`/api/v1/users/current-session?user_id=${userId}`);
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
    try {
      const userId = localStorage.getItem('user_id') || 'fake_user';
      if (currentSessionId) {
        await fetch(`/api/v1/users/current-session?user_id=${userId}&session_id=${currentSessionId}`, {
          method: 'PUT',
        });
      } else {
        await fetch(`/api/v1/users/current-session?user_id=${userId}`, {
          method: 'DELETE',
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

  const loadChatSessions = async () => {
    setChatLoading(true);
    try {
      const userId = localStorage.getItem('user_id') || 'fake_user';
      const sessions = await chatService.getUserSessions(userId);
      setChatSessions(sessions);
    } catch (error) {
      console.error("Erro ao carregar sessões de chat:", error);
      setChatSessions([]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleJobSelection = async () => {
    if (!selectedJobId) return;

    setLoading(true);
    try {
      const selectedJob = jobs.find(job => job.id === selectedJobId);
      if (!selectedJob) return;

      // Create chat session first
      const userId = localStorage.getItem('user_id') || 'fake_user';
      const session = await chatService.createSession({
        user_id: userId,
        title: `Análise de Vaga: ${selectedJob.title}`,
      });
      setCurrentSessionId(session.session_id);
      setChatSessions((prev) => [session, ...prev]);

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

          // Save messages to backend
          await saveMessagesToBackend(autoQuery, data.response);
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

  const saveMessagesToBackend = async (userMessage: string, assistantMessage: string) => {
    try {
      let sessionId = currentSessionId;
      if (!sessionId) {
        // Create new session
        const userId = localStorage.getItem('user_id') || 'fake_user';
        const session = await chatService.createSession({
          user_id: userId,
          title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        });
        sessionId = session.session_id;
        setCurrentSessionId(sessionId);
        setChatSessions((prev) => [session, ...prev]);
      }

      // Add messages
      await chatService.addMessage(sessionId, { sender: "Usuário", text: userMessage });
      await chatService.addMessage(sessionId, { sender: "Assistente", text: assistantMessage });
    } catch (error) {
      console.error("Erro ao salvar mensagens:", error);
    }
  };

  const createNewChat = async () => {
    try {
      const userId = localStorage.getItem('user_id') || 'fake_user';
      const session = await chatService.createSession({
        user_id: userId,
        title: `Novo Chat ${new Date().toLocaleString()}`,
      });
      setCurrentSessionId(session.session_id);
      setChatSessions((prev) => [session, ...prev]);
      setMessages([]);
      setInput("");
    } catch (error) {
      console.error("Erro ao criar novo chat:", error);
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
      
      {/* SIDEBAR */}
      <div className="w-80 bg-gray-50 border-r border-black flex flex-col">
        <div className="p-4 border-b border-black">
          <button
            onClick={createNewChat}
            className="w-full bg-black text-white px-4 py-2 border border-black font-black uppercase text-sm hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatLoading ? (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Carregando chats...</div>
          ) : chatSessions.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Nenhum chat ainda
            </div>
          ) : (
            chatSessions.map((session) => (
              <button
                key={session.session_id}
                onClick={() => selectChatSession(session)}
                className={cn(
                  "w-full text-left p-3 border border-gray-300 hover:border-black transition-all text-sm",
                  currentSessionId === session.session_id ? "bg-black text-white border-black" : "bg-white text-gray-700"
                )}
              >
                <div className="font-bold truncate">{session.title}</div>
                <div className="text-xs opacity-70">
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
      
      {/* --- HEADER DE CONFIGURAÇÃO (Topo) --- */}
      <div className="bg-gray-50 border-b border-black p-5 space-y-5">
        
        {/* 1. Seleção de Base de Dados */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-black uppercase tracking-wide min-w-[120px] flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            Base de Dados:
          </label>
          <div className="flex-1 w-full relative">
            {indexesLoading ? (
              <span className="text-xs font-medium text-gray-500">Carregando índices...</span>
            ) : (
              <select
                className="w-full sm:w-[300px] bg-white border border-black px-3 py-2 text-sm font-bold focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none"
                value={selectedIndexId}
                onChange={(e) => setSelectedIndexId(e.target.value)}
              >
                <option value="">Selecione um índice...</option>
                {savedIndexes.map((idx) => (
                  <option key={idx.indexId} value={idx.indexId}>
                    {idx.name} ({idx.resumeCount} docs)
                  </option>
                ))}
              </select>
            )}
            {/* Seta customizada do select */}
            <div className="pointer-events-none absolute inset-y-0 left-[280px] hidden sm:flex items-center px-2 text-black">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* 2. Seleção de Modo (A PARTE QUE VOCÊ PEDIU DE VOLTA) */}
        <div className="border-t border-gray-300 pt-4">
          <label className="text-xs font-black uppercase tracking-wide block mb-3">Modo de Análise:</label>
          
          <div className="flex flex-wrap gap-4">
            
            {/* Opção A: Chat Livre (Currículos) */}
            <label 
              htmlFor="mode-resumes" 
              className={cn(
                "flex items-center gap-3 px-4 py-3 border cursor-pointer transition-all duration-200 select-none",
                queryMode === "resumes" 
                  ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                  : "bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black"
              )}
            >
              <input
                type="radio"
                id="mode-resumes"
                name="queryMode"
                value="resumes"
                checked={queryMode === "resumes"}
                onChange={(e) => setQueryMode("resumes")}
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
                  ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                  : "bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black"
              )}
            >
              <input
                type="radio"
                id="mode-job"
                name="queryMode"
                value="job"
                checked={queryMode === "job"}
                onChange={(e) => setQueryMode("job")}
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
                <select
                  className="w-full bg-white border border-black px-3 py-2 text-sm font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                >
                  <option value="">-- Selecione uma vaga --</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={handleJobSelection}
              disabled={loading || !selectedJobId}
              className="bg-black text-white px-4 py-2 border border-black font-black uppercase text-xs hover:bg-gray-800 disabled:opacity-50 h-[38px]"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>

      {/* --- ÁREA DE CHAT --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
            <div className="w-16 h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="font-bold uppercase tracking-wider text-sm">Histórico Vazio</p>
            <p className="text-xs mt-2">Configure acima e inicie a conversa.</p>
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
             <div className="bg-white border border-black px-4 py-3 rounded-xl rounded-tl-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold uppercase">Digitando...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT AREA --- */}
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