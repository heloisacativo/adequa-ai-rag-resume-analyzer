import type { ApplicationStatus, JobApplication } from '../types/application';
import { STATUS_CONFIG } from '../types/application';
import { ApplicationCard } from './ApplicationCard';
import { useApplications } from '../contexts/ApplicationContext';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { Send, Clock, Users, Trophy, XCircle } from 'lucide-react';

const iconMap = {
  Send,
  Clock,
  Users,
  Trophy,
  XCircle,
};

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: JobApplication[];
}

export function KanbanColumn({ status, applications }: KanbanColumnProps) {
  const { updateApplicationStatus } = useApplications();
  const [isDragOver, setIsDragOver] = useState(false);
  const config = STATUS_CONFIG[status];
  const Icon = iconMap[config.icon as keyof typeof iconMap];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const applicationId = e.dataTransfer.getData('applicationId');
    if (applicationId) {
      updateApplicationStatus(applicationId, status);
    }
  };

  const currentHeaderColor = 'bg-neo-primary';

  return (
    <div
      className={cn(
        'flex flex-col w-full',
        'lg:flex-1 lg:min-w-[200px]',
        
        'bg-white border-1 border-black transition-colors duration-200',
        
        'mb-8 lg:mb-0',

        isDragOver ? 'bg-gray-50 ring-4 ring-inset ring-black' : ''
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`flex items-center justify-between p-4 border-b-4 border-black ${currentHeaderColor}`}>
        <div className="flex items-center gap-3 overflow-hidden"> 
          <h2 className="font-black text-md text-neo-secondary   uppercase tracking-wider truncate">
            {config.label}
          </h2>
        </div>
        
        <div className="shrink-0 bg-neo-primary text-neo-secondary font-bold px-3 py-1 text-sm border-thin">
          {applications.length}
        </div>
      </div>

      <div className="flex-1 p-4 pb-8 space-y-4 bg-gray-50" style={{ minHeight: 'fit-content' }}>
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))}

        {applications.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[200px] h-full border-4 border-dashed border-gray-300 bg-white p-4">
            <div className="mb-4 opacity-30">
              <Icon className="w-12 h-12 text-black" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
              Sem candidaturas<br/>nesta etapa
            </p>
          </div>
        )}
      </div>
    </div>
  );
}