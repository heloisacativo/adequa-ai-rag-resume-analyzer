import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Loader2 } from 'lucide-react';
import adequa from '../../src/assets/adequa.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Novo estado para mensagem do toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'error' | 'success'>('info');

  const showToast = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    try {
      const loggedUser = await login(email, password);
      showToast('Login realizado com sucesso.', 'success');

      // Redirecionar com base no tipo de usuário usando o usuário retornado
      // Primeiro tenta usar is_hirer do usuário, senão usa o email como fallback
      const isRecruiter = loggedUser?.is_hirer ?? email.toLowerCase().includes('recruiter');

      if (isRecruiter) {
        navigate('/dashboard');
      } else {
        navigate('/candidate-dashboard');
      }
    } catch (error) {
      showToast('Verifique suas credenciais e tente novamente.', 'error');
    }
  };

  return (
    <div
      className={[
        'min-h-screen min-h-dvh bg-neo-primary flex items-center justify-center relative overflow-hidden',
        /* padding: um valor por lado por breakpoint, sem sobrepor */
        'pt-2 pr-2 pb-2 pl-2',
        'min-[360px]:pt-3 min-[360px]:pr-3 min-[360px]:pb-3 min-[360px]:pl-3',
        'sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-20',
      ].join(' ')}
    >
      {/* Background decorative elements (menores em telas pequenas) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-4 left-4 w-20 h-20 sm:top-10 sm:left-10 sm:w-32 sm:h-32 bg-neo-primary border-thickest border-neo-secondary" />
        <div className="absolute top-8 right-4 w-16 h-16 sm:top-20 sm:right-20 sm:w-24 sm:h-24 bg-neo-primary border-thicker border-neo-secondary" />
        <div className="absolute bottom-12 left-4 w-20 h-20 sm:bottom-20 sm:left-20 sm:w-28 sm:h-28 bg-neo-primary border-thickest border-neo-secondary" />
        <div className="absolute bottom-4 right-4 w-14 h-14 sm:bottom-10 sm:right-10 sm:w-20 sm:h-20 bg-neo-primary border-thicker border-neo-secondary" />
      </div>

      {/* Toast: um valor por propriedade por breakpoint */}
      {toastMsg && (
        <div
          className={[
            'fixed z-50 animate-bounce',
            'top-2 left-2 right-2 max-w-[calc(100%-1rem)]',
            'min-[360px]:top-3 min-[360px]:left-3 min-[360px]:right-3 min-[360px]:max-w-[calc(100%-1.5rem)]',
            'sm:top-4 sm:right-4 sm:left-auto sm:max-w-sm',
          ].join(' ')}
        >
          <div className={`alert ${toastType === 'error' ? 'alert-error' : toastType === 'success' ? 'alert-success' : 'alert-info'} border-medium border-neo-secondary shadow-neo text-sm sm:text-base`}>
            <span className="font-black">{toastMsg}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg animate-fade-in relative z-10 min-w-0 p-8">
    

        <div className="bg-neo-primary border-thickest border-neo-secondary shadow-neo-xl min-w-0">
          <form
            onSubmit={handleSubmit}
            className={[
              'pt-3 pr-3 pb-3 pl-3',
              'min-[360px]:pt-4 min-[360px]:pr-4 min-[360px]:pb-4 min-[360px]:pl-4',
              'sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-8',
              'lg:pt-12 lg:pr-12 lg:pb-12 lg:pl-12',
            ].join(' ')}
          >
             <div className="flex flex-col items-center justify- mt-[-2rem]">
          <div className="w-44 h-12 min-[360px]:w-52 min-[360px]:h- sm:w-60 sm:h-20 flex items-center justify-center shrink-0">
            <img src={adequa} alt="Adequa Logo" className="w-full h-full object-contain" />
          </div>
            <p className="-mt-1 text-xs text-neutral-500 font-medium mb-2 min-[360px]:-mt-2 min-[360px]:text-sm sm:-mt-4.5 sm:mb-3 text-center max-w-md mx-auto whitespace-nowrap">
            Sistema de IA aplicado à avaliação de perfis profissionais
            </p>
        </div>
            <h2 className="text-xl min-[360px]:text-2xl font-black/30 text-left text-neo-secondary font-medium">ENTRAR</h2>
            <p className="text-sm min-[360px]:text-base text-neo-secondary/60 text-left mb-2">
            <span className="label-text text-sm min-[360px]:text-base font-black/30 text-neo-secondary break-words">Entre na sua conta de recrutador ou candidato</span>
            </p>
            <div className="space-y-4 min-[360px]:space-y-5 sm:space-y-6">
              <div className="form-control">
                
                <div className="flex flex-col">
                  <label htmlFor="email" className="label py-0.5">
                    <span className="label-text text-sm min-[360px]:text-base text-neo-secondary mb-0.5">EMAIL</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="SEU@EMAIL.COM"
                    className="w-full min-w-0 input input-bordered border-medium border-neo-secondary bg-neo-primary placeholder:text-neo-secondary/60 text-neo-secondary font-bold text-sm min-[360px]:text-base sm:text-lg transition-all duration-200 shadow-neo focus:shadow-neo-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-control">
                <div className="flex flex-col">
                  <label htmlFor="password" className="label py-0.5">
                    <span className="label-text text-sm min-[360px]:text-base text-neo-secondary mb-0.5">SENHA</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                      className="w-full min-w-0 input input-bordered border-medium border-neo-secondary bg-neo-primary text-neo-secondary font-bold text-sm min-[360px]:text-base sm:text-lg placeholder:text-neo-secondary/60 transition-all duration-200 shadow-neo focus:shadow-neo-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-control mt-4 min-[360px]:mt-6 sm:mt-8">
                <button
                  type="submit"
                  className={[
                    'btn bg-neo-primary border-medium border-neo-secondary text-neo-secondary font-black w-full min-w-0 shadow-neo-lg hover:shadow-neo-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                    'text-sm min-[360px]:text-md sm:text-md',
                    'py-3 min-[360px]:py-4 sm:py-5',
                    'pl-4 pr-4 min-[360px]:pl-4 min-[360px]:pr-4 sm:pl-6 sm:pr-6',
                  ].join(' ')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 min-[360px]:mr-3 min-[360px]:h-6 min-[360px]:w-6 animate-spin shrink-0" />
                      <span className="truncate">ENTRANDO...</span>
                    </>
                  ) : (
                    'ENTRAR'
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-base sm:text-lg text-neo-secondary text-left mt-4 min-[360px]:mt-6 sm:mt-8 font-bold break-words">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-neo-secondary hover:text-neo-primary underline decoration-2  underline-offset-2 font-black sm:text-sm md:text-base lg:text-lg transition-all duration-200 break-all sm:break-normal">
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

