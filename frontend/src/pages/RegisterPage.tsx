import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, User, Loader2, Building2, UserCircle, Mail, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../hooks/use-toats';
import { emailVerificationService } from '../lib/emailService';
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

type RegistrationStep = 'email-verification' | 'account-details';

export default function RegisterPage() {
  const [step, setStep] = useState<RegistrationStep>('email-verification');
  
  // Passo 1: Verificação de email
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [fullNameForVerification, setFullNameForVerification] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [codeExpiration, setCodeExpiration] = useState<Date | null>(null);
  
  // Passo 2: Detalhes da conta
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'recruiter' | 'candidate'>('recruiter');
  
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !fullNameForVerification) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha seu email e nome completo.',
        variant: 'error',
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, digite um email válido.',
        variant: 'error',
      });
      return;
    }

    try {
      setVerificationSent(true);
      const response = await emailVerificationService.requestVerificationCode(email, fullNameForVerification);
      
      if (response.success && response.data?.expires_at) {
        setCodeExpiration(new Date(response.data.expires_at));
        toast({
          title: 'Código enviado!',
          description: `Um código de verificação foi enviado para ${email}. Verifique sua caixa de entrada.`,
        });
      }
    } catch (error) {
      setVerificationSent(false);
      toast({
        title: 'Erro ao enviar código',
        description: error instanceof Error ? error.message : 'Tente novamente em alguns momentos.',
        variant: 'error',
      });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Por favor, digite um código de 6 dígitos.',
        variant: 'error',
      });
      return;
    }

    try {
      await emailVerificationService.verifyCode(email, verificationCode);
      emailVerificationService.setVerifiedEmail(email);
      
      toast({
        title: 'Email verificado!',
        description: 'Agora complete o seu cadastro.',
      });
      
      setStep('account-details');
      setFullName(fullNameForVerification);
    } catch (error) {
      toast({
        title: 'Código inválido',
        description: error instanceof Error ? error.message : 'Código incorreto ou expirado.',
        variant: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !fullName) {
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
        is_hirer: userType === 'recruiter',
      });
      
      emailVerificationService.clearVerifiedEmail();
      
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso.',
      });
      
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
          <form onSubmit={step === 'email-verification' ? (verificationSent ? handleVerifyCode : handleRequestVerification) : handleSubmit} className="p-3 min-[360px]:p-4 sm:p-6 relative z-10 flex justify-center flex-col cursor-pointer">
          
            <div className="flex flex-col items-center justify-center mt-[-1rem]">
              <div className="w-44 h-12 min-[360px]:w-52 min-[360px]:h-16 sm:w-60 sm:h-20 flex items-center justify-center shrink-0">
                <img src={adequa} alt="Adequa Logo" className="w-full h-full object-contain" />
              </div>
              <p className="-mt-1 text-xs text-neutral-500 font-medium mb-2 min-[360px]:-mt-2 min-[360px]:text-sm sm:-mt-4 sm:mb-3 text-center max-w-md mx-auto">
                Sistema de IA aplicado à avaliação de perfis profissionais
              </p>
            </div>

            {/* Passo 1: Verificação de Email */}
            {step === 'email-verification' && (
              <>
                <h2 className="text-xl min-[360px]:text-2xl font-black text-neo-secondary mt-3 flex items-center gap-2 justify-center">
                  <Mail className="w-6 h-6" />
                  VERIFICAR EMAIL
                </h2>

                {!verificationSent ? (
                  <>
                    <p className="text-sm text-gray-600 text-center mt-2 mb-4">
                      Digite seu email e nome para receber um código de verificação.
                    </p>
                    
                    <div className="space-y-2 mt-4">
                      <NeoInput
                        id="fullNameVerification"
                        label="Nome Completo"
                        type="text"
                        placeholder="DIGITE SEU NOME"
                        value={fullNameForVerification}
                        onChange={(e) => setFullNameForVerification(e.target.value)}
                        disabled={isLoading}
                        decorativePosition="right"
                      />

                      <NeoInput
                        id="emailVerification"
                        label="Email"
                        type="email"
                        placeholder="SEU@EMAIL.COM"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        decorativePosition="left"
                      />
                    </div>

                    <div className="flex flex-col gap-3 min-[360px]:gap-4 mt-6 relative">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="
                          
                          relative w-full min-w-0 py-2 min-[360px]:py-3 text-base min-[360px]:text-sm sm:text-sm font-black uppercase tracking-widest
                          bg-neo-primary text-neo-secondary border-2 border-neo-secondary
                          shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                          flex items-center justify-center gap-2 min-[360px]:gap-3 cursor-pointer
                          hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all
                        "
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 min-[360px]:h-6 min-[360px]:w-6 animate-spin shrink-0" />
                            <span className="truncate">ENVIANDO...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6" />
                            ENVIAR CÓDIGO
                          </>
                        )}
                      </button>

                      <p className="text-sm min-[360px]:text-base sm:text-lg text-neo-secondary text-center font-bold">
                        Já tem uma conta?{' '}
                        <Link 
                          to="/login" 
                          className="text-neo-secondary hover:text-neo-primary underline decoration-2 min-[360px]:decoration-4 underline-offset-2 font-black text-base min-[360px]:text-lg sm:text-xl transition-all duration-200"
                        >
                          Entrar
                        </Link>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-neo-primary border-2 border-neo-secondary rounded-lg p-4 mt-4 mb-4">
                      <div className="flex items-center gap-2 justify-center mb-2">
                        <CheckCircle className="w-5 h-5 text-neo-secondary" />
                        <span className="font-bold text-neo-secondary">Código enviado!</span>
                      </div>
                      <p className="text-sm text-neo-secondary text-center">
                        Um código de 6 dígitos foi enviado para <span className="font-bold">{email}</span>
                      </p>
                      {codeExpiration && (
                        <p className="text-xs text-neo-secondary text-center mt-2 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expira em 30 minutos
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 text-center mb-4">
                      Digite o código recebido no seu email.
                    </p>

                    <div className="space-y-2 mt-4">
                      <NeoInput
                        id="verificationCode"
                        label="Código de Verificação"
                        type="text"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(value);
                        }}
                        disabled={isLoading}
                        decorativePosition="center"
                      />
                    </div>

                    <div className="flex flex-col gap-3 min-[360px]:gap-4 mt-6 relative">
                      <button
                        type="submit"
                        disabled={isLoading || verificationCode.length !== 6}
                        className="
                          relative w-full min-w-0 py-2 min-[360px]:py-3 text-base min-[360px]:text-lg sm:text-xl font-black uppercase tracking-widest
                          bg-neo-primary text-neo-secondary border-2 border-neo-secondary
                          shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                          flex items-center justify-center gap-2 min-[360px]:gap-3 cursor-pointer
                          hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 min-[360px]:h-6 min-[360px]:w-6 animate-spin shrink-0" />
                            <span className="truncate">VERIFICANDO...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6" />
                            VERIFICAR CÓDIGO
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVerificationSent(false);
                          setVerificationCode('');
                          setCodeExpiration(null);
                        }}
                        className="text-sm text-neo-secondary underline hover:no-underline font-bold text-center"
                      >
                        Usar outro email
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Passo 2: Detalhes da Conta */}
            {step === 'account-details' && (
              <>
                <h2 className="text-xl min-[360px]:text-2xl font-black text-neo-secondary mt-3">CRIAR CONTA</h2>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mt-4 mb-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-bold">Email verificado:</span> {email}
                  </p>
                </div>

                {/* User Type Selection */}
                <div className="mb-3 min-[360px]:mb-4 relative">
                  <label className="label mb-2 min-[360px]:mb-4 py-0">
                    <span className="label-text text-sm min-[360px]:text-base font-black text-neo-secondary break-words">Escolha uma opção para se cadastrar</span>
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
                      {/* Decorações */}
                      <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-neo-primary border-2 border-neo-secondary transition-transform duration-300 ${userType === 'recruiter' ? 'scale-100 rotate-12' : 'scale-0 group-hover:scale-75'}`}></div>
                      <div className={`absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-neo-secondary border-2 border-neo-secondary transition-all duration-300 ${userType === 'recruiter' ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

                      <input
                        type="radio"
                        name="userType"
                        id="recruiter"
                        value="recruiter"
                        checked={userType === 'recruiter'}
                        onChange={() => setUserType('recruiter')}
                        className="hidden"
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
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    decorativePosition="right"
                  />

                  <NeoInput
                    id="password"
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    decorativePosition="right"
                  />

                  <div className="flex flex-col gap-3 min-[360px]:gap-4 mt-3 min-[360px]:mt-4 relative">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        relative w-full min-w-0 py-2 min-[360px]:py-1 text-base min-[360px]:text-lg sm:text-xl font-black uppercase tracking-widest
                        bg-neo-primary text-neo-secondary border-2 border-neo-secondary
                        shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-[360px]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                        flex items-center justify-center gap-2 min-[360px]:gap-3 cursor-pointer
                        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all
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

                    <button
                      type="button"
                      onClick={() => {
                        setStep('email-verification');
                        setVerificationCode('');
                        setVerificationSent(false);
                      }}
                      className="text-sm text-neo-secondary underline hover:no-underline font-bold text-center"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              </>
            )}
            
          </form>
        </div>
      </div>
    </div>
  );
}
