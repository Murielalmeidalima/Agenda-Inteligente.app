-- APPOINTMENT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS appointment_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE appointment_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company reviews" ON appointment_reviews
  FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
