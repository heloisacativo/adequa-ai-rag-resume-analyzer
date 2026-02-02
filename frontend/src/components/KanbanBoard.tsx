import type { ApplicationStatus } from '../types/application';
import { KanbanColumn } from '../components/KanbanColumn';
import { useApplications } from '../contexts/ApplicationContext';

const columns: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected'];

export function KanbanBoard() {
  const { getApplicationsByStatus } = useApplications();

  return (
    <div className="flex flex-col">
      
      {/* HEADER */}
      <div className="flex-none flex items-center justify-between bg-white/50 backdrop-blur-sm z-10">
        
      </div>

      {/* ÁREA PRINCIPAL (BOARD) */}
      <div 
        className="
          relative flex-1 
          overflow-hidden flex flex-col
        "
      >
        {/* CONTAINER DAS COLUNAS */}
        <div 
          className="
            flex-1 w-full h-full
            flex flex-col lg:flex-row  /* Mobile: Vertical | Desktop: Lado a Lado */
            gap-4                      /* Espaçamento elegante entre as colunas */
            overflow-y-auto            /* Scroll Vertical permitido se tiver muitos cards */
            overflow-x-hidden          /* Sem scroll horizontal - colunas se ajustam */
          "
          style={{
            paddingBottom: '1rem', // Espaço extra no final para não cortar bordas
          }}
        >
          {columns.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              applications={getApplicationsByStatus(status)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}