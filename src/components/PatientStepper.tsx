import { Check, Clock, Stethoscope, Heart, Home, Hourglass, CheckCircle } from 'lucide-react';
import { PATIENT_STATUS, STATUS_ORDER, PatientStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PatientStepperProps {
  currentStatus: PatientStatus;
  patientName: string;
}

const STEP_ICONS: Record<PatientStatus, LucideIcon> = {
  aguardando: Hourglass,
  em_preparacao: Clock,
  em_procedimento: Stethoscope,
  recuperacao_pos_anestesica: Heart,
  no_quarto: Home,
  em_alta: CheckCircle,
};

export function PatientStepper({ currentStatus, patientName }: PatientStepperProps) {
  const currentStep = PATIENT_STATUS[currentStatus].step;

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Acompanhamento de {patientName}
        </h2>
        <p className="text-muted-foreground">
          Status atual: <span className="font-semibold text-primary">{PATIENT_STATUS[currentStatus].label}</span>
        </p>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / (STATUS_ORDER.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_ORDER.map((status, index) => {
            const Icon = STEP_ICONS[status];
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={status} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-4',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'bg-primary/20 border-primary text-primary animate-pulse',
                    !isCompleted && !isCurrent && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-8 h-8" />
                  ) : (
                    <Icon className="w-8 h-8" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-3 text-sm font-medium text-center max-w-[80px]',
                    (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {PATIENT_STATUS[status].label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
