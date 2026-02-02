import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { 
  Briefcase, 
  FileText, 
  Users, 
  TrendingUp, 
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { mockJobs, mockMetrics } from '../components/data/mockData';
import { Link } from 'react-router-dom';
import Analysis from './Analysis';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  paused: 'bg-warning/10 text-warning border-warning/20',
  closed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  draft: 'Rascunho',
  paused: 'Pausada',
  closed: 'Encerrada',
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const recentJobs = mockJobs.slice(0, 4);

  return (
    <AppLayout>
      <div className="">
        {/* Header */}
        {/* <div className="flex items-start flex-col">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {user?.full_name?.split(' ')[0]}!
            </h1>
          </div>
        </div> */}
        <Analysis/>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metrics will go here */}
        </div>
      </div>
    </AppLayout>
  );
}
