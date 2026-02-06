import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, User, Loader2, Building2, UserCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toats';
import adequa from '../../src/assets/adequa.png';

const NeoInput = ({ label, id, type, placeholder, value, onChange, disabled, decorativePosition = "right" }: {
  label: string;
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  decorativePosition?: string;
}) => (
  <div className="space-y-1 min-[360px]:space-y-2 relative group min-w-0">
    <label htmlFor={id} className="block text-sm min-[360px]:text-base text-neutral-900 uppercase tracking-wider text-neo-secondary">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="
        w-full min-w-0 p-2 rounded-none text-sm min-[360px]:text-base font-bold bg-neo-primary text-neo-secondary
        border-2 min-[360px]:border-4 border-neo-secondary border-thin
        placeholder:text-gray-500 placeholder:font-medium
        transition-all duration-200 ease-in-out
        outline-none
      "
      />
      
      {/* Elementos decorativos "Glitch" que aparecem no Hover */}
      <div className={`
        absolute -top-2 w-4 h-4 bg-neo-primary border-2 border-black 
        hidden group-hover:block animate-bounce
        ${decorativePosition === 'right' ? '-right-2' : '-left-2'}
      `} />
      <div className={`
        absolute -bottom-2 w-3 h-3 bg-yellow-400 border-2 border-black
        hidden group-hover:block animate-ping
        ${decorativePosition === 'left' ? '-right-1' : '-left-1'}
      `} />
    </div>
  </div>
);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'recruiter' | 'candidate'>('recruiter');  // Changed 'hirer' to 'recruiter'
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'error',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'error',
      });
      return;
    }

    try {
      await register({
        email,
        password,
        full_name: fullName,
        is_hirer: userType === 'recruiter',  // Changed 'hirer' to 'recruiter'
      });
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso.',
      });
      // Redirecionar com base no tipo de usuário após registro
      if (userType === 'recruiter') {
        navigate('/dashboard');
      } else {
        navigate('/candidate-dashboard');
      }
    } catch (error) {
      toast({
        title: 'Erro no cadastro',
        description: 'Não foi possível criar sua conta. Tente novamente.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-neo-primary flex items-center justify-center p-2 min-[360px]:p-3 sm:p-4 page-padding relative overflow-hidden">

      <div className="w-full max-w-lg animate-fade-in relative z-10 min-w-0 px-0.5">
        <div className="bg-neo-primary border-thin border-neo-secondary shadow-neo-xl min-w-0">
          <form onSubmit={handleSubmit} className="p-3 min-[360px]:p-4 sm:p-6 relative z-10 flex justify-center flex-col cursor-pointer">
          <div className="flex flex-col items-center justify- mt-[-1rem]">
          <div className="w-44 h-12 min-[360px]:w-52 min-[360px]:h- sm:w-60 sm:h-20 flex items-center justify-center shrink-0">
            <img src={adequa} alt="Adequa Logo" className="w-full h-full object-contain" />
          </div>
          <p className="-mt-1 text-xs text-neutral-500 font-medium mb-2 min-[360px]:-mt-2 min-[360px]:text-sm sm:-mt-4.5 sm:mb-3 text-center max-w-md mx-auto">
            Sistema de IA aplicado à avaliação de perfis profissionais
          </p>
        </div>
            <h2 className="text-xl min-[360px]:text-2xl font-black/50 text-neo-secondary mt-3">CRIAR CONTA</h2>
            {/* User Type Selection */}
            <div className="mb-3 min-[360px]:mb-4 relative">
              <label className="label mb-2 min-[360px]:mb-4 py-0">
                <span className="label-text text-sm min-[360px]:text-base font-black/30 text-neo-secondary break-words">Escolha uma opção para se cadastrar</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-[360px]:gap-4 justify-center items-center w-full max-w-2xl mx-auto">
                
                {/* OPÇÃO RECRUTADOR */}
                <label
                  htmlFor="recruiter"
                  className={`
                    relative group flex flex-col items-center gap-2 p-4 
                    w-full max-w-[220px] h-[6.25rem] justify-center
                    border-2 border-neo-secondary rounded-xl cursor-pointer transition-all duration-300 ease-out
                    ${userType === 'recruiter'
                      ? 'bg-neo-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                      : 'bg-white hover:bg-neo-primary/10 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 shadow-none opacity-80 hover:opacity-100'
                    }
                  `}
                >
                  {/* Decorações (só aparecem quando selecionado ou hover) */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-neo-primary border-2 border-neo-secondary transition-transform duration-300 ${userType === 'recruiter' ? 'scale-100 rotate-12' : 'scale-0 group-hover:scale-75'}`}></div>
                  <div className={`absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-neo-secondary border-2 border-neo-secondary transition-all duration-300 ${userType === 'recruiter' ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

                  <input
                    type="radio"
                    name="userType"
                    id="recruiter"
                    value="recruiter"
                    checked={userType === 'recruiter'}
                    onChange={() => setUserType('recruiter')}
                    className="hidden" // Input oculto para visual mais limpo
                  />

                  <Building2 
                    className={`w-12 h-12 transition-transform duration-300 ${
                      userType === 'recruiter' 
                        ? 'text-neo-secondary scale-110 rotate-3' 
                        : 'text-neo-secondary group-hover:scale-110'
                    }`} 
                  />
                  
                  <div className="text-center space-y-1 z-10">
                    <p className="font-black text-md text-neo-secondary tracking-tight">RECRUTADOR</p>
                  </div>
                </label>

                {/* OPÇÃO CANDIDATO */}
                <label
                  htmlFor="candidate"
                  className={`
                    relative group flex flex-col items-center gap-1 min-[360px]:gap-2 p-3 min-[360px]:p-4 
                    w-full max-w-[220px] min-h-[5.5rem] min-[360px]:h-[6.25rem] justify-center min-w-0
                    border-2 border-neo-secondary rounded-xl cursor-pointer transition-all duration-300 ease-out
                    ${userType === 'candidate'
                      ? 'bg-neo-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                      : 'bg-white hover:bg-neo-primary/10 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 shadow-none opacity-80 hover:opacity-100'
                    }
                  `}
                >
                  {/* Decorações */}
                  <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full bg-neo-primary border-2 border-neo-secondary transition-transform duration-300 ${userType === 'candidate' ? 'scale-100 -rotate-12' : 'scale-0 group-hover:scale-75'}`}></div>
                  <div className={`absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-neo-secondary border-2 border-neo-secondary transition-all duration-300 ${userType === 'candidate' ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

                  <input
                    type="radio"
                    name="userType"
                    id="candidate"
                    value="candidate"
                    checked={userType === 'candidate'}
                    onChange={() => setUserType('candidate')}
                    className="hidden"
                  />

                  <UserCircle 
                    className={`w-12 h-12 transition-transform duration-300 ${
                      userType === 'candidate' 
                        ? 'text-neo-secondary scale-110 -rotate-3' 
                        : 'text-neo-secondary group-hover:scale-110'
                    }`} 
                  />
                  
                  <div className="text-center space-y-1 z-10">
                    <p className="font-black text-md text-neo-secondary tracking-tight">CANDIDATO</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <NeoInput
                id="fullName"
                label="Nome Completo"
                type="text"
                placeholder="DIGITE SEU NOME"
                value={fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                disabled={isLoading}
                decorativePosition="right"
              />

              <NeoInput
                id="email"
                label="Email"
                type="email"
                placeholder="SEU@EMAIL.COM"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={isLoading}
                decorativePosition="left"
              />

              <NeoInput
                id="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isLoading}
                decorativePosition="right"
              />

              <div className="flex flex-col gap-3 min-[360px]:gap-4 mt-3 min-[360px]:mt-4 relative">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    relative w-full min-w-0 py-2 min-[360px]:py-1 text-base min-[360px]:text-lg sm:text-xl font-black uppercase tracking-widest
                    bg-neo-primary text-neo-secondary border-thin
                    shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                    flex items-center justify-center gap-2 min-[360px]:gap-3 cursor-pointer
                  "
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 min-[360px]:h-6 min-[360px]:w-6 animate-spin shrink-0" />
                      <span className="truncate">CRIANDO CONTA...</span>
                    </>
                  ) : (
                    'CRIAR CONTA'
                  )}
                </button>

                <p className="text-sm min-[360px]:text-base sm:text-lg text-neo-secondary text-center font-bold break-words">
                  Já tem uma conta?{' '}
                  <Link 
                    to="/login" 
                    className="text-neo-secondary hover:text-neo-primary underline decoration-2 min-[360px]:decoration-4 underline-offset-2 font-black text-base min-[360px]:text-lg sm:text-xl transition-all duration-200"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
