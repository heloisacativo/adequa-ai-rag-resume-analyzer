export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  date: string;
  description: string;
  status: ApplicationStatus;
}

export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  matchScore: number;
}

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; icon: string }> = {
  applied: { label: 'Aplicado', icon: 'Send' },
  interview: { label: 'Entrevista', icon: 'Users' },
  offer: { label: 'Oferta', icon: 'Trophy' },
  rejected: { label: 'Rejeitado', icon: 'XCircle' },
};
