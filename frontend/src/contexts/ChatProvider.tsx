import { useState } from "react";
import { ChatContext } from "./ChatContext";
import type { ReactNode } from "react";
import { resumeService } from "../lib/api";

interface Message {
  sender: string;
  text: string;
}

const ChatProvider = ({ children, indexId }: { children: ReactNode, indexId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const handleSendMessage = async (userText: string) => {
    addMessage({ sender: "Usuário", text: userText });

    if (!indexId) {
      addMessage({ sender: "Assistente", text: "Envie arquivos antes de perguntar." });
      return;
    }

    try {
      const data = await resumeService.search(userText, indexId);

      setMessages([
        { sender: "Usuário", text: userText },
        { sender: "Assistente", text: data.response }
      ]);
    } catch (error) {
      setMessages([
        { sender: "Usuário", text: userText },
        { sender: "Assistente", text: "Erro ao buscar resposta." }
      ]);
      console.error(error);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, handleSendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;