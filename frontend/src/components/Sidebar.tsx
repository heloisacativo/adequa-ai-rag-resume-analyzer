import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileSearch, Briefcase, FileText, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import adequa from '../../src/assets/adequa.png';

const recruiterNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/ia-analysis', icon: Brain, label: 'Análise com IA' },
  { to: '/jobs', icon: Briefcase, label: 'Gerenciar Vagas' },
  { to: '/resumes', icon: FileText, label: 'Currículos' },
  // { to: '/ai-analysis', icon: FileSearch, label: 'Análise IA' },
];

const candidateNavItems = [
  { to: '/candidate-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analysis', icon: FileSearch, label: 'Análise de Currículo' },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user?.is_hirer ? recruiterNavItems : candidateNavItems;

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-55 bg-gray-50 border-r-1 border-black flex flex-col"
    >
      {/* HEADER: Logo */}
      <div className="h-20 flex items-center px-4 border-b-1 border-black bg-white">
        <img src={adequa} alt="Adequa" className="w-50 h-50 object-contain" />
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
              'flex items-center gap-2 px-2 py-2 border-2 border-thin border-black rounded-lg transition-all duration-150 ease-out group',
              isActive
                ? 'bg-neo-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
              )}
            >
              <item.icon 
              className={cn(
                'w-5 h-5 flex-shrink-0 transition-colors',
                isActive ? 'text-black' : 'text-gray-600 group-hover:text-black'
              )} 
              />
              
              <span className={cn(
              'font-bold text-xs tracking-wide truncate',
              isActive ? 'text-black' : 'text-gray-600 group-hover:text-black'
              )}>
              {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}