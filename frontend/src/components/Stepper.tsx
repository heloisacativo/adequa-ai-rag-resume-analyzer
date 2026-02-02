import { Check } from "lucide-react";

import { cn } from "../lib/utils";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="relative flex items-start justify-between max-w-2xl mx-auto">
        {/* Linha de Conexão de Fundo (Cinza) */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10 rounded" />

        {/* Linha de Conexão de Progresso (Preta) */}
        <div
          className="absolute top-5 left-0 h-1 bg-black transition-all duration-500 ease-out -z-10 rounded"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div key={index} className="flex flex-col items-center group">
              {/* CÍRCULO / CAIXA DO PASSO */}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 border-2 transition-all duration-300 z-10",
                  "rounded-md", // Use rounded-full se preferir círculos perfeitos

                  // ESTADO: COMPLETADO (Verde + Check)
                  isCompleted &&
                    "bg-green-400 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",

                  // ESTADO: ATIVO (Amarelo + Número)
                  isActive &&
                    "bg-neo-secondary border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-110",

                  // ESTADO: PENDENTE (Branco + Cinza)
                  isPending && "bg-white border-gray-300 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-black",
                      isActive ? "text-black" : "text-gray-400"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* TEXTO DO PASSO */}
              <div className="mt-4 text-center">
                <p
                  className={cn(
                    "text-xs font-black uppercase tracking-wider transition-colors duration-300",
                    isActive || isCompleted ? "text-black" : "text-gray-400"
                  )}
                >
                  {step.label}
                </p>

                {/* Descrição (Opcional, esconde no mobile se quiser limpar) */}
                {step.description && (
                  <p
                    className={cn(
                      "text-[10px] font-medium mt-1 hidden sm:block",
                      isActive ? "text-gray-600" : "text-gray-300"
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
