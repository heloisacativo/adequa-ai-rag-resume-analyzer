/** URL base da API - configurar em .env como VITE_API_URL */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface UploadResumeResponse {
  message: string;
  total_files: number;
  indexed_files: number;
  vector_index_id: string;
  resumes: Array<{
    resume_id: string;
    candidate_name: string;
    file_name: string;
    uploaded_at: string;
    is_indexed: boolean;
  }>;
}

export interface AnalyzeCandidatesResponse {
  query: string;
  total_candidates: number;
  best_candidate: CandidateAnalysis | null;
  ranking: CandidateAnalysis[];
}

export interface CandidateAnalysis {
  resume_id: string;
  candidate_name: string;
  file_name: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  justification: string;
}

export interface SearchResponse {
  response: string;
  index_id: string;
  query: string;
}

export interface JobApplication {
  id: number;
  user_id: string;
  company_name: string;
  job_title: string;
  application_date: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateJobApplicationRequest {
  company_name: string;
  job_title: string;
  application_date: string;
  description: string;
}

export interface JobApplicationListResponse {
  applications: JobApplication[];
}

// Chat interfaces
export interface ChatSession {
  session_id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface CreateChatSessionRequest {
  user_id: string;
  title: string;
}

export interface AddMessageRequest {
  sender: string;
  text: string;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
}

export interface ListIndexesResponse {
  indexes: Record<string, IndexInfo>;
}

export interface ResumeItem {
  resume_id: string;
  candidate_name: string;
  file_name: string;
  uploaded_at: string;
  is_indexed: boolean;
}

export interface ListResumesResponse {
  resumes: ResumeItem[];
  total: number;
}

// Job interfaces
export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  salary?: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  location?: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
}

class ResumeService {
  private baseUrl = `${API_URL}/api/v1`;

  async uploadResumes(files: File[]): Promise<UploadResumeResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/resumes/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Authorization será adicionado via interceptor ou aqui
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload resumes');
    }

    return response.json();
  }

  async analyzeCandidates(
    jobDescription: string,
    indexId: string
  ): Promise<AnalyzeCandidatesResponse> {
    const params = new URLSearchParams({
      job_description: jobDescription,
      index_id: indexId,
    });

    const response = await fetch(
      `${this.baseUrl}/candidates/analyze?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to analyze candidates');
    }

    return response.json();
  }

  async search(query: string, indexId: string): Promise<SearchResponse> {
    const params = new URLSearchParams({
      query: query,
      index_id: indexId,
    });

    const response = await fetch(
      `${this.baseUrl}/search/llm/?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to search');
    }

    return response.json();
  }

  async listIndexes(): Promise<ListIndexesResponse> {
    const response = await fetch(`${this.baseUrl}/resumes/indexes`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list indexes');
    }

    return response.json();
  }

  async listResumes(): Promise<ListResumesResponse> {
    const response = await fetch(`${this.baseUrl}/resumes`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list resumes');
    }

    return response.json();
  }

  async deleteResume(resumeId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete resume');
    }
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

class JobService {
  private baseUrl = `${API_URL}/api/v1`;

  async createJob(jobData: CreateJobRequest): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${this.getToken()}`, // Uncomment when auth is implemented
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create job';
      try {
        const error = await response.json();
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map((d: any) => d.msg || d.message).join(', ');
          } else {
            errorMessage = error.detail;
          }
        }
      } catch {
        // If parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async listJobs(): Promise<JobListResponse> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      headers: {
        // 'Authorization': `Bearer ${this.getToken()}`, // Uncomment when auth is implemented
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list jobs');
    }

    return response.json();
  }

  async getJob(jobId: string): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      headers: {
        // 'Authorization': `Bearer ${this.getToken()}`, // Uncomment when auth is implemented
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get job');
    }

    return response.json();
  }

  async updateJob(jobId: string, jobData: UpdateJobRequest): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${this.getToken()}`, // Uncomment when auth is implemented
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update job');
    }

    return response.json();
  }

  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        // 'Authorization': `Bearer ${this.getToken()}`, // Uncomment when auth is implemented
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete job');
    }
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

class JobApplicationService {
  private baseUrl = API_URL;

  async listApplications(): Promise<JobApplicationListResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-applications/`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list job applications');
    }

    const applications = await response.json();
    return { applications };
  }

  async createApplication(data: CreateJobApplicationRequest): Promise<JobApplication> {
    const response = await fetch(`${this.baseUrl}/api/v1/job-applications/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create job application');
    }

    return response.json();
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

export const resumeService = new ResumeService();
export const jobService = new JobService();
export const jobApplicationService = new JobApplicationService();

class ChatService {
  private baseUrl = `${API_URL}/api/v1`;

  async createSession(request: CreateChatSessionRequest): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create chat session');
    }

    return response.json();
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const response = await fetch(`${this.baseUrl}/chat/sessions?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get chat sessions');
    }

    const data = await response.json();
    return data;
  }

  async addMessage(sessionId: string, request: AddMessageRequest): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add message');
    }

    return response.json();
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/messages`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get messages');
    }

    const data = await response.json();
    return data;
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

export const chatService = new ChatService();