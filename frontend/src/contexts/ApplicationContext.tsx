import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { JobApplication, ApplicationStatus } from '../types/application';
import { API_URL } from '../lib/api';

interface ApplicationContextType {
  applications: JobApplication[];
  addApplication: (app: JobApplication | Omit<JobApplication, 'id'>) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  deleteApplication: (id: string) => Promise<void>;
  getApplicationsByStatus: (status: ApplicationStatus) => JobApplication[];
  isLoading: boolean;
  refreshApplications: () => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/job-applications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedApps = data.map((app: any) => ({
          id: app.id.toString(),
          company: app.company_name,
          position: app.job_title,
          date: app.application_date,
          description: app.description,
          status: app.status as ApplicationStatus,
        }));
        setApplications(formattedApps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const addApplication = (app: JobApplication | Omit<JobApplication, 'id'>) => {
    const newApp: JobApplication = 'id' in app 
      ? app as JobApplication
      : {
          ...app,
          id: Date.now().toString(),
        };
    setApplications(prev => [...prev, newApp]);
  };

  const updateApplicationStatus = (id: string, status: ApplicationStatus) => {
    setApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status } : app))
    );
  };

  const deleteApplication = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/job-applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== id));
      } else {
        console.error('Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const getApplicationsByStatus = (status: ApplicationStatus) => {
    return applications.filter(app => app.status === status);
  };

  const refreshApplications = async () => {
    await fetchApplications();
  };

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        addApplication,
        updateApplicationStatus,
        deleteApplication,
        getApplicationsByStatus,
        isLoading,
        refreshApplications,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
}
