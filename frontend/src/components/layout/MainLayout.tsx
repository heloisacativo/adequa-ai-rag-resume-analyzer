import type { ReactNode } from 'react';
import { Sidebar } from '../../components/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-auto">
      <Sidebar />
      <main className="ml-55 relative z-10">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
