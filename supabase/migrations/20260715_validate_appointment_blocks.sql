-- ==========================================================
-- MIGRATION: VALIDATE APPOINTMENTS AGAINST SCHEDULE BLOCKS
-- ==========================================================

CREATE OR REPLACE FUNCTION check_appointment_blocked_time()
RETURNS TRIGGER AS $$
DECLARE
  blocked_row RECORD;
  proc_duration INT;
  app_end_time TIMESTAMP WITH TIME ZONE;
  local_app_date DATE;
  local_app_start_time TIME;
  local_app_end_time TIME;
  local_dow INT;
BEGIN
  -- Se o status for cancelado, não valida bloqueio
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Calcular o end_time do agendamento se for nulo
  IF NEW.end_time IS NULL THEN
    SELECT COALESCE(duration_minutes, 60) INTO proc_duration FROM procedures WHERE id = NEW.procedure_id;
    app_end_time := NEW.start_time + (proc_duration || ' minutes')::interval;
  ELSE
    app_end_time := NEW.end_time;
  END IF;

  -- Obter a data, hora de início/fim e DOW (dia da semana) no fuso local do agendamento (America/Sao_Paulo)
  local_app_date := (timezone('America/Sao_Paulo', NEW.start_time))::date;
  local_app_start_time := (timezone('America/Sao_Paulo', NEW.start_time))::time;
  local_app_end_time := (timezone('America/Sao_Paulo', app_end_time))::time;
  local_dow := extract(dow from timezone('America/Sao_Paulo', NEW.start_time))::int;

  -- Buscar qualquer bloqueio ativo concorrente
  SELECT * INTO blocked_row FROM schedule_blocks
  WHERE company_id = NEW.company_id 
    AND is_active = true
    AND (
      -- 1. Bloqueio recorrente (Semanal)
      (type = 'recurring' AND recurring_day = local_dow AND (
        is_full_day = true OR
        (local_app_start_time < end_time AND local_app_end_time > start_time)
      ))
      OR
      -- 2. Bloqueio manual ou férias (usando timezone UTC para start_date/end_date pois foram salvos como meia-noite UTC)
      (type IN ('manual', 'vacation') AND (
        (is_full_day = true AND local_app_date >= (timezone('UTC', start_date))::date AND local_app_date <= COALESCE((timezone('UTC', end_date))::date, (timezone('UTC', start_date))::date))
        OR
        (is_full_day = false AND local_app_date >= (timezone('UTC', start_date))::date AND local_app_date <= COALESCE((timezone('UTC', end_date))::date, (timezone('UTC', start_date))::date) AND 
         (local_app_start_time < end_time AND local_app_end_time > start_time))
      ))
    )
  LIMIT 1;

  IF blocked_row.id IS NOT NULL THEN
    IF blocked_row.is_full_day THEN
      RAISE EXCEPTION 'Esta data foi bloqueada pela clínica e não está disponível para novos agendamentos.';
    ELSE
      RAISE EXCEPTION 'O horário selecionado está indisponível devido a um bloqueio da agenda.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vincular a função ao gatilho BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_check_appointment_blocked_time ON appointments;
CREATE TRIGGER trg_check_appointment_blocked_time
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_blocked_time();
