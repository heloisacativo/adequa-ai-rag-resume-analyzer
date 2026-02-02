// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_hirer: boolean;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
}

// Job types
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed';
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements_technical: string[];
  requirements_soft_skills: string[];
  seniority: SeniorityLevel;
  keywords: string[];
  required_criteria: string[];
  desired_criteria: string[];
  status: JobStatus;
  location?: string;
  salary_range?: string;
  created_at: string;
  updated_at: string;
  resumes_count: number;
  analyzed_count: number;
}

// Resume types
export type ResumeStatus = 'new' | 'analyzed' | 'shortlist' | 'rejected' | 'hired';

export interface Resume {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email?: string;
  file_name: string;
  file_url: string;
  file_type: 'pdf' | 'docx';
  status: ResumeStatus;
  score?: number;
  strengths?: string[];
  gaps?: string[];
  ai_summary?: string;
  notes?: string;
  uploaded_at: string;
  analyzed_at?: string;
}

// AI Analysis types
export interface AIAnalysisResult {
  resume_id: string;
  score: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  recommendation: 'strong_match' | 'potential_match' | 'weak_match';
}

export interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

// Candidate-specific types (for future)
export type ApplicationStatus = 
  | 'applied' 
  | 'in_review' 
  | 'interview' 
  | 'waiting' 
  | 'rejected' 
  | 'accepted';

export interface Application {
  id: string;
  job_title: string;
  company: string;
  status: ApplicationStatus;
  applied_at: string;
  notes?: string;
  next_action?: string;
  next_action_date?: string;
}

// Dashboard metrics
export interface RecruiterMetrics {
  total_jobs: number;
  active_jobs: number;
  total_resumes: number;
  pending_analysis: number;
  shortlisted: number;
  avg_score: number;
}
