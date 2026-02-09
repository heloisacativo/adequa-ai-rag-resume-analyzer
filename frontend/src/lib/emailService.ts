import { API_URL } from './api';

export interface RequestVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    expires_at: string;
  };
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
}

class EmailVerificationService {
  private baseUrl = `${API_URL}/api/v1`;

  async requestVerificationCode(email: string, fullName: string): Promise<RequestVerificationResponse> {
    const response = await fetch(`${this.baseUrl}/users/request-email-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as any).detail || (error as any).message || 'Erro ao enviar código de verificação'
      );
    }

    return response.json();
  }

  async verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
    const response = await fetch(`${this.baseUrl}/users/verify-email-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as any).detail || (error as any).message || 'Código de verificação inválido'
      );
    }

    return response.json();
  }

  // Armazena o email verificado no localStorage
  setVerifiedEmail(email: string): void {
    localStorage.setItem('verified_email', email);
  }

  // Recupera o email verificado
  getVerifiedEmail(): string | null {
    return localStorage.getItem('verified_email');
  }

  // Limpa o email verificado
  clearVerifiedEmail(): void {
    localStorage.removeItem('verified_email');
  }
}

export const emailVerificationService = new EmailVerificationService();
