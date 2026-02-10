import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../lib/api";
import { MessageSquare, ArrowLeft, Loader2, User, Bot } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: string;
}

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

export default function ChatDetails() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !user?.id) {
      setError("Sessão não encontrada");
      setLoading(false);
      return;
    }

    loadSession();
  }, [sessionId, user?.id]);

  const loadSession = async () => {
    if (!sessionId || !user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Carregando sessão:", sessionId);
      
      // Carrega as mensagens da sessão
      const messages = await chatService.getSessionMessages(sessionId);
      console.log("📨 Total de mensagens:", messages?.length || 0);
      
      // Busca informações da sessão através da lista de sessões do usuário
      const userSessions = await chatService.getUserSessions(user.id);
      const sessionInfo = userSessions.find(s => s.session_id === sessionId);
      
      if (!sessionInfo) {
        setError("Conversa não encontrada");
        return;
      }
      
      const formattedMessages: Message[] = messages.map((msg: any) => ({
        id: msg.message_id || msg.id || Math.random().toString(),
        content: msg.text || msg.content || '[Conteúdo indisponível]',
        sender: (msg.sender === "user" || msg.sender === "Você" ? "user" : "assistant") as "user" | "assistant",
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
      }));
      
      console.log("✨ Mensagens formatadas:", formattedMessages.length, "mensagens");
      
      setSession({
        session_id: sessionId,
        title: sessionInfo.title || "Conversa",
        created_at: sessionInfo.created_at,
        messages: formattedMessages
      });
    } catch (err) {
      console.error("❌ Erro ao carregar conversa:", err);
      setError("Erro ao carregar a conversa");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.id) {
    return (
      <AppLayout>
        <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-8 text-center text-gray-600 font-medium">
          Faça login para ver a conversa.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/chat-history")}
            className="p-2 rounded-lg border-2 border-black bg-white hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase text-neo-secondary flex items-center gap-2">
              {loading ? "Carregando..." : session?.title || "Conversa"}
            </h1>
            {session && (
              <p className="text-gray-600 font-light text-xs">
                {new Date(session.created_at).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Carregando conversa...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <p className="font-bold text-red-600 mb-2">Erro</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={() => navigate("/chat-history")}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao histórico
            </button>
          </div>
        ) : !session || session.messages.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="font-bold text-gray-600 mb-2">Conversa vazia</p>
            <p className="text-sm text-gray-500">
              {!session ? "Sessão não carregada" : "Esta conversa não possui mensagens."}
            </p>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b-2 border-gray-200 bg-gray-50">
             
            </div>
            
           <div className="max-h-[600px] overflow-y-auto p-6 space-y-6 bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg">
  {session.messages.map((message, index) => {
    const isUser = message.sender === "user";
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-4 max-w-[90%] md:max-w-[80%]",
          isUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
        )}
      >
        {/* AVATAR (Quadrado com Borda Fina) */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className={cn(
            "w-10 h-10 flex items-center justify-center border border-black]",
            isUser 
              ? "bg-black text-white rounded-2xl" 
              : "bg-white text-black rounded-2xl"
          )}>
            {isUser ? (
              <User className="w-5 h-5" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* BALÃO DE MENSAGEM */}
        <div className={cn(
          "flex-1 min-w-0 flex flex-col",
          isUser ? "items-end" : "items-start"
        )}>
          {/* Header da Mensagem */}
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500">
              {isUser ? "Você" : "Assistente"}
            </span>
            <span className="text-[10px] font-mono font-medium text-gray-400 border border-gray-200 bg-white px-1.5 py-0.5 rounded">
              {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Conteúdo da Mensagem */}
          <div className={cn(
            "relative w-full p-4 text-sm leading-relaxed border border-black",
            isUser 
              ? "bg-black text-white rounded-xl rounded-tr-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]" 
              : "bg-white text-gray-900 rounded-xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          )}>
            <div className="whitespace-pre-wrap font-medium">
              {message.content || (
                <span className="italic opacity-50 text-xs">
                  [Mensagem vazia]
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  })}
  
  {/* Estado Vazio (Caso não tenha mensagens) */}
  {session.messages.length === 0 && (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 opacity-60">
      <div className="w-16 h-16 border border-black bg-white rounded-lg flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Bot className="w-8 h-8 text-black" />
      </div>
      <p className="font-bold uppercase tracking-wider text-sm">Histórico Vazio</p>
    </div>
  )}
</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}