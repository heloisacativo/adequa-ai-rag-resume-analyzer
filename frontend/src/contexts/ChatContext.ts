import { createContext } from "react";

interface Message {
  sender: string;
  text: string;
}

export interface ChatContextType {
  messages: Message[];
  addMessage: (message: Message) => void;
  handleSendMessage: (userText: string) => Promise<void>; 
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);