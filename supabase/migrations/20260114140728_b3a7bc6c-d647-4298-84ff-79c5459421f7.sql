-- Rename em_cirurgia to em_procedimento and add em_alta to patient_status enum

-- Step 1: Drop the default on status column first
ALTER TABLE public.patients ALTER COLUMN status DROP DEFAULT;

-- Step 2: Create the new enum with updated values
CREATE TYPE patient_status_new AS ENUM (
  'aguardando',
  'em_preparacao',
  'em_procedimento',
  'recuperacao_pos_anestesica',
  'no_quarto',
  'em_alta'
);

-- Step 3: Update the patients table to use the new enum
ALTER TABLE public.patients 
  ALTER COLUMN status TYPE patient_status_new 
  USING (
    CASE status::text
      WHEN 'em_cirurgia' THEN 'em_procedimento'::patient_status_new
      ELSE status::text::patient_status_new
    END
  );

-- Step 4: Drop the old enum
DROP TYPE patient_status;

-- Step 5: Rename the new enum to the original name
ALTER TYPE patient_status_new RENAME TO patient_status;

-- Step 6: Restore the default
ALTER TABLE public.patients ALTER COLUMN status SET DEFAULT 'aguardando'::patient_status;