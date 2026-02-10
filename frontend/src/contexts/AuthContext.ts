import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types/Index';

import { API_URL } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  is_hirer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use a API real para login
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Email ou senha incorretos. Verifique seus dados e tente novamente.";
        
        // Tratamento específico por status code
        if (response.status === 401) {
          errorMessage = "Email ou senha incorretos. Verifique seus dados e tente novamente.";
        } else if (response.status === 403) {
          errorMessage = "Sua conta está inativa. Entre em contato com o suporte.";
        } else {
          try {
            const errorBody = await response.json();
            const detail = errorBody?.detail ?? errorBody?.message;
            if (typeof detail === "string" && detail.trim()) {
              errorMessage = detail.trim();
            }
          } catch {
            // Mantem mensagem padrão
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const userData = data.user;
      const userId = userData?.user_id ?? userData?.id;
      if (userId) localStorage.setItem("user_id", String(userId));
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify({ ...userData, id: userId ?? userData?.id }));
      setUser({ ...userData, id: userId ?? userData?.id } as User);
      return { ...userData, id: userId ?? userData?.id } as User;
    } catch (error) {
      if (error instanceof Error) {
        // Se for um erro de rede (Failed to fetch)
        if (error.message === "Failed to fetch") {
          throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
        }
        // Repassa o erro original se já tiver mensagem customizada
        throw error;
      }
      // Erro genérico
      throw new Error("Não foi possível fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Use a API real para register
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          is_hirer: data.is_hirer,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Não foi possível criar sua conta. Tente novamente.";
        
        // Tratamento específico por status code
        if (response.status === 409) {
          errorMessage = "Não é possível utilizar este email. Tente fazer login ou use outro email.";
        } else {
          try {
            const errorBody = await response.json();
            const detail = errorBody?.detail ?? errorBody?.message;
            if (typeof detail === "string" && detail.trim()) {
              errorMessage = detail.trim();
            }
          } catch {
            try {
              const text = await response.text();
              if (text.trim()) {
                errorMessage = text.trim();
              }
            } catch {
              // Mantem mensagem padrao
            }
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const userData = result.user;
      const userId = userData?.user_id ?? userData?.id;
      if (userId) localStorage.setItem("user_id", String(userId));
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify({ ...userData, id: userId ?? userData?.id }));
      setUser({ ...userData, id: userId ?? userData?.id } as User);
    } catch (error) {
      if (error instanceof Error) {
        // Se for um erro de rede (Failed to fetch)
        if (error.message === "Failed to fetch") {
          throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
        }
        // Repassa o erro original se já tiver mensagem customizada
        throw error;
      }
      // Erro genérico
      throw new Error("Não foi possível criar sua conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
  }, []);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
