-- 1. APPOINTMENTS UPDATES
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_token TEXT,
ADD COLUMN IF NOT EXISTS review_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_token TEXT,
ADD COLUMN IF NOT EXISTS email_status TEXT, -- 'pending', 'sent', 'failed'
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- 2. EMAIL LOGS
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  recipient_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder', 'review', 'cancellation')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company email logs" ON email_logs
  FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 3. NOTIFICATIONS
CREATE TYPE notification_type AS ENUM ('appointment', 'reminder', 'confirmation', 'system');

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  user_id UUID REFERENCES profiles(id), -- Nullable if for all users in company, but usually specific
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT, -- Optional link to action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (user_id IS NULL AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );
