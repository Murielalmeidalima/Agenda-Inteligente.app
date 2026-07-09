-- ==========================================
-- MIGRATION: BLOCK APPOINTMENTS IN PAST DATES
-- ==========================================

-- 1. Criar a função que verifica a data/hora do agendamento
CREATE OR REPLACE FUNCTION check_appointment_start_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Permite apenas agendamentos futuros para os status 'scheduled' ou 'confirmed'.
  -- Permite criar agendamentos no passado apenas se o status for 'completed' (como na opção Lançar Atendimento) ou 'cancelled'.
  -- Fornece 5 minutos de tolerância para cobrir possíveis descompassos de relógio e atraso de rede.
  IF NEW.status IN ('scheduled', 'confirmed') AND NEW.start_time < (now() - interval '5 minutes') THEN
    RAISE EXCEPTION 'Não é possível criar um agendamento em uma data ou horário que já passou. Caso este atendimento tenha sido realizado sem agendamento prévio, utilize a opção ''Lançar Atendimento''.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Vincular a função ao gatilho BEFORE INSERT
DROP TRIGGER IF EXISTS trg_check_appointment_start_time ON appointments;
CREATE TRIGGER trg_check_appointment_start_time
BEFORE INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_start_time();
