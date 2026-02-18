-- Create Enum for Trigger Types
CREATE TYPE automation_trigger_type AS ENUM ('birthday', 'pre_appointment', 'post_appointment', 'holiday');

-- Create Automation Rules Table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_type automation_trigger_type NOT NULL,
  time_offset_minutes INTEGER NOT NULL DEFAULT 0, -- -1440 = 24h before, 60 = 1h after
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Automation Logs Table (History)
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  recipient_phone TEXT,
  recipient_name TEXT,
  status TEXT DEFAULT 'sent', -- sent, failed, pending
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Automation Rules
CREATE POLICY "Users can view rules from their company"
  ON automation_rules FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert rules for their company"
  ON automation_rules FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update rules from their company"
  ON automation_rules FOR UPDATE
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete rules from their company"
  ON automation_rules FOR DELETE
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for Automation Logs
CREATE POLICY "Users can view logs from their company"
  ON automation_logs FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Add Trigger for Updated At
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
