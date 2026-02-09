import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import {
  Briefcase,
  LayoutDashboard,
  FileText,
  LogOut,
  User,
  FileSearch,
  Brain,
  Menu,
  X,
  MessageSquare,
  FolderOpen,
} from "lucide-react";
import adequa from "../../assets/adequa.png";

const recruiterNavItems = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/ia-analysis", label: "Análise com IA", icon: Brain },
  { to: "/chat-history", label: "Histórico de conversas", icon: MessageSquare },
  { to: "/jobs", label: "Gerenciar Vagas", icon: Briefcase },
  { to: "/resumes", label: "Currículos", icon: FileText },
  { to: "/resumes/groups", label: "Grupos de currículos", icon: FolderOpen },
];

const candidateNavItems = [
  { to: "/candidate-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analysis", label: "Análise de Currículo", icon: FileSearch },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = user?.is_hirer ? recruiterNavItems : candidateNavItems;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex font-sans text-black overflow-x-hidden">
      {/* Overlay mobile */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Fechar menu"
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity duration-200 lg:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* SIDEBAR: drawer no mobile, fixo no desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen h-[100dvh] w-[min(14rem,82vw)] min-[360px]:w-56 lg:w-56 bg-gray-50 border-r-2 border-black flex flex-col transition-transform duration-200 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)]" : "-translate-x-full lg:shadow-none"
        )}
      >
        <div className="h-12 min-[360px]:h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2 px-2 min-[360px]:px-3 sm:px-4 border-b-2 border-black bg-white shrink-0">
          <img
            src={adequa}
            alt="Adequa"
            className="h-5 min-[360px]:h-6 sm:h-7 lg:h-8 w-auto max-w-[100px] min-[360px]:max-w-[120px] sm:max-w-[140px] object-contain min-w-0"
          />
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 lg:hidden shrink-0 -mr-1"
          >
            <X className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6" />
          </button>
        </div>

        <nav className="flex-1 p-2 min-[360px]:p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto overflow-touch custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            const hasMoreSpecificRoute = navItems.some(other => 
              other.to !== item.to && 
              other.to.startsWith(item.to) && 
              (location.pathname === other.to || location.pathname.startsWith(other.to + "/"))
            );
            
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/dashboard" &&
                item.to !== "/candidate-dashboard" &&
                location.pathname.startsWith(item.to + "/") &&
                !hasMoreSpecificRoute);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2 min-[360px]:gap-2.5 px-2.5 min-[360px]:px-3 py-2.5 min-[360px]:py-3 sm:py-3 min-h-[44px] border-2 border-black rounded-lg transition-all duration-150 ease-out group",
                  isActive
                    ? "bg-neo-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                    : "bg-neo-primary hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:bg-gray-200",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 flex-shrink-0",
                    isActive ? "text-black" : "text-gray-600 group-hover:text-black",
                  )}
                />
                <span
                  className={cn(
                    "font-bold text-[11px] min-[360px]:text-xs tracking-wide truncate",
                    isActive ? "text-black" : "text-gray-600 group-hover:text-black",
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Menu do usuário no sidebar (só em telas pequenas) */}
        <div className="lg:hidden shrink-0 p-2 min-[360px]:p-3 sm:p-4 border-t-2 border-black bg-white">
          <div className="flex items-center gap-2 min-[360px]:gap-3 mb-2 min-[360px]:mb-3">
            <div className="avatar placeholder shrink-0">
              <div className="bg-neo-primary text-black border-2 border-black rounded-lg w-9 h-9 min-[360px]:w-10 min-[360px]:h-10 flex items-center justify-center text-sm font-black">
                {user ? getInitials(user.full_name) : <User className="w-5 h-5" />}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase truncate">
                {user?.full_name?.split(" ")[0]}
              </div>
              <div className="text-[10px] font-bold text-gray-500">
                {user?.is_hirer ? "Recrutador" : "Candidato"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2.5 border-2 border-black rounded-lg font-bold text-neo-primary hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            SAIR DA CONTA
          </button>
        </div>

        {/* Menu do usuário no sidebar (telas grandes): nome + Sair ao lado */}
        <div className="hidden lg:block shrink-0 p-2 min-[360px]:p-3 sm:p-4 border-t-2 border-black bg-white">
          <div className="flex items-center gap-2 w-full px-2 py-2.5 border-2 border-black rounded-lg bg-white">
            <div className="avatar placeholder shrink-0">
              <div className="bg-neo-primary text-black border border-black rounded-lg w-9 h-9 flex items-center justify-center text-sm font-black">
                {user ? getInitials(user.full_name) : <User className="w-5 h-5" />}
              </div>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-black uppercase leading-none truncate block">
                {user?.full_name?.split(" ")[0]}
              </div>
              <div className="text-[10px] font-bold text-gray-500 leading-none">
                {user?.is_hirer ? "Recrutador" : "Candidato"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-neo-secondary hover:bg-gray-100 active:bg-gray-200 transition-colors text-[10px] uppercase"
              title="Sair da conta"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] w-full min-w-0 ml-0 lg:ml-56">
        {/* HEADER DO APP */}
        <header
          className={cn(
            "sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b-2 border-black flex items-center justify-between flex-nowrap overflow-visible",
            "pt-[env(safe-area-inset-top  ,0px)]",
            "gap-2 min-[360px]:gap-2.5 sm:gap-3 md:gap-4",
            "px-2 min-[360px]:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8",
            "min-h-[2.75rem] h-11 min-[360px]:min-h-[3rem] min-[360px]:h-12 sm:min-h-[3.5rem] sm:h-14 md:h-16 lg:min-h-[5rem] lg:h-20",
            "transition-all duration-200",
            "md:hidden lg:hidden"
          )}
        >
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
            className="min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 border-2 border-black lg:hidden shrink-0 -ml-0.5"
          >
            <Menu className="w-2 h-2 min-[360px]:w-4 min-[360px]:h-4" />
            </button>

          {/* Menu de Usuário (só em telas lg ou maiores); abre logo abaixo do trigger */}
         
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <main className="page-padding">
          {children}
        </main>
      </div>
    </div>
  );
}
