import { AppLayout } from '../components/layout/AppLayout';
import { KanbanBoard } from '../components/KanbanBoard';
import { AddApplicationModal } from '../components/AddApplicationModal';
import { useApplications } from '../contexts/ApplicationContext';
import { Briefcase, TrendingUp, Clock, Trophy } from 'lucide-react';

export default function CandidateDashboard() {
  const { applications } = useApplications();

  const stats = [
    {
      label: 'Total de Candidaturas',
      value: applications.length,
      icon: Briefcase,
      color: 'bg-neo-primary/10 text-neo-primary',
    },
    {
      label: 'Em Progresso',
      value: applications.filter(a => ['review', 'interview'].includes(a.status)).length,
      icon: TrendingUp,
      color: 'bg-warning-light text-warning',
    },
    {
      label: 'Aguardando',
      value: applications.filter(a => a.status === 'applied').length,
      icon: Clock,
      color: 'bg-info-light text-info',
    },
    {
      label: 'Ofertas',
      value: applications.filter(a => a.status === 'offer').length,
      icon: Trophy,
      color: 'bg-success-light text-success',
    },
  ];

  return (
    <AppLayout>
      <div className='p-4'>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl text-neo-secondary font-black uppercase">Minhas Candidaturas</h2>
          <div className="flex justify-start sm:justify-end">
            <AddApplicationModal />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`${stat.color} p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-600 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black text-neo-secondary">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 opacity-50 text-neo-secondary" />
                </div>
              </div>
            );
          })}
        </div>

        <KanbanBoard />
      </div>
    </AppLayout>
  );
}
