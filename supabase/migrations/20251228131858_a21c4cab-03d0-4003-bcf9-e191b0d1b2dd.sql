-- Drop existing enum and recreate with new values
ALTER TYPE patient_status RENAME TO patient_status_old;

CREATE TYPE patient_status AS ENUM (
  'aguardando',
  'em_preparacao', 
  'em_cirurgia',
  'recuperacao_pos_anestesica',
  'no_quarto'
);

-- Update existing data to map to new values
ALTER TABLE patients 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE patient_status USING (
    CASE status::text
      WHEN 'preparacao' THEN 'em_preparacao'::patient_status
      WHEN 'cirurgia' THEN 'em_cirurgia'::patient_status
      WHEN 'recuperacao' THEN 'recuperacao_pos_anestesica'::patient_status
      WHEN 'liberado' THEN 'no_quarto'::patient_status
      ELSE 'aguardando'::patient_status
    END
  ),
  ALTER COLUMN status SET DEFAULT 'aguardando'::patient_status;

DROP TYPE patient_status_old;