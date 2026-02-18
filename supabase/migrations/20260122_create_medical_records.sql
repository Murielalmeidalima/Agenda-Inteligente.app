-- Migration: Create medical_records table
-- Description: Stores clinical evolutions and patient records.

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  content TEXT NOT NULL, -- Rich text or Markdown content
  status TEXT DEFAULT 'finalized' CHECK (status IN ('draft', 'finalized')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view records from their company"
  ON medical_records FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE company_id = medical_records.company_id
  ));

CREATE POLICY "Professionals can create records for their company"
  ON medical_records FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE company_id = medical_records.company_id
  ));

CREATE POLICY "Professionals can update their own draft records"
  ON medical_records FOR UPDATE
  USING (
    auth.uid() = professional_id AND 
    status = 'draft'
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_records_client ON medical_records(client_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_company ON medical_records(company_id);
