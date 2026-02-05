export const PATIENT_STATUS = {
  aguardando: { label: 'Aguardando', step: 0 },
  em_preparacao: { label: 'Em Preparação', step: 1 },
  em_procedimento: { label: 'Em Procedimento', step: 2 },
  recuperacao_pos_anestesica: { label: 'Recuperação Pós-Anestésica', step: 3 },
  no_quarto: { label: 'No Quarto', step: 4 },
  em_alta: { label: 'Em Alta', step: 5 },
} as const;

export type PatientStatus = keyof typeof PATIENT_STATUS;

export const STATUS_ORDER: PatientStatus[] = [
  'aguardando',
  'em_preparacao',
  'em_procedimento',
  'recuperacao_pos_anestesica',
  'no_quarto',
  'em_alta'
];
