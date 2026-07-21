-- Migration: Production Safe Idempotent Backfill & Audit Script
-- Date: 2026-07-21
-- Purpose: Safely update cancellation fields, backfill missing maintenance appointments,
-- and normalize financial data without deleting or overwriting any production data.

BEGIN;

-- 1. Ensure all cancellation columns exist idempotently
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_by uuid references public.profiles(id);

-- 2. Normalize existing cancelled appointments (Etapa 2)
UPDATE public.appointments
SET 
  cancellation_reason = COALESCE(cancellation_reason, 'Cancelado anteriormente'),
  cancelled_at = COALESCE(cancelled_at, updated_at, created_at, NOW())
WHERE status = 'cancelled' OR payment_status = 'cancelled';

-- 3. Idempotent Backfill of Missing Maintenance Appointments (Etapa 3)
-- Rule: For completed/confirmed normal appointments where procedure has maintenance_required = true,
-- create future maintenance appointment if not already existing.
DO $$
DECLARE
  rec RECORD;
  calc_date TIMESTAMP WITH TIME ZONE;
  days_to_add INT;
  existing_count INT;
  target_slot_occupied INT;
BEGIN
  FOR rec IN 
    SELECT 
      a.id AS parent_id,
      a.company_id,
      a.client_id,
      a.professional_id,
      a.procedure_id,
      a.start_time,
      p.maintenance_days_limit,
      p.maintenance_duration_minutes,
      p.duration_minutes
    FROM public.appointments a
    JOIN public.procedures p ON a.procedure_id = p.id
    WHERE (a.status = 'completed' OR a.status = 'confirmed' OR a.status = 'scheduled')
      AND (a.is_maintenance = false OR a.is_maintenance IS NULL)
      AND p.maintenance_required = true
      AND p.maintenance_days_limit > 0
      AND (a.notes IS NULL OR (a.notes NOT LIKE '%[Lançado]%' AND a.notes NOT LIKE '%Atendimento Lançado%'))
  LOOP
    -- Check if child maintenance appointment already exists for this parent
    SELECT COUNT(*) INTO existing_count
    FROM public.appointments
    WHERE parent_appointment_id = rec.parent_id
       OR (company_id = rec.company_id AND client_id = rec.client_id AND procedure_id = rec.procedure_id AND is_maintenance = true);

    IF existing_count = 0 THEN
      days_to_add := rec.maintenance_days_limit;
      calc_date := rec.start_time + (days_to_add || ' days')::INTERVAL;

      -- Saturday (6) -> Monday (+2 days)
      IF EXTRACT(ISODOW FROM calc_date) = 6 THEN
        calc_date := calc_date + INTERVAL '2 days';
      -- Sunday (7) -> Monday (+1 day)
      ELSIF EXTRACT(ISODOW FROM calc_date) = 7 THEN
        calc_date := calc_date + INTERVAL '1 day';
      END IF;

      -- Check if target time slot is occupied by professional
      SELECT COUNT(*) INTO target_slot_occupied
      FROM public.appointments
      WHERE company_id = rec.company_id
        AND professional_id = rec.professional_id
        AND status != 'cancelled'
        AND start_time = calc_date;

      -- If occupied, shift by 1 hour
      IF target_slot_occupied > 0 THEN
        calc_date := calc_date + INTERVAL '1 hour';
      END IF;

      -- Create the maintenance appointment idempotently
      INSERT INTO public.appointments (
        company_id,
        client_id,
        professional_id,
        procedure_id,
        start_time,
        end_time,
        status,
        payment_status,
        is_maintenance,
        parent_appointment_id,
        notes,
        created_at,
        updated_at
      ) VALUES (
        rec.company_id,
        rec.client_id,
        rec.professional_id,
        rec.procedure_id,
        calc_date,
        calc_date + ((COALESCE(rec.maintenance_duration_minutes, rec.duration_minutes, 60)) || ' minutes')::INTERVAL,
        'scheduled',
        'pending',
        true,
        rec.parent_id,
        'Manutenção gerada automaticamente via migração segura',
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END $$;

COMMIT;
