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
        throw new Error("Credenciais inválidas");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
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
          password: data.password, // <-- corrigido!
          full_name: data.full_name,
          is_hirer: data.is_hirer,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar usuário");
      }

      const result = await response.json();
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
