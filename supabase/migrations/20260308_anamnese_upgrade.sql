-- Upgrading Anamnese Module
-- Adding Configuration Fields to Templates
ALTER TABLE anamnese_templates
ADD COLUMN IF NOT EXISTS validity_months INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS external_form_url TEXT;

-- Adding LGPD Consent and Digital Signature to Responses
ALTER TABLE anamnese_responses
ADD COLUMN IF NOT EXISTS consent_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_text TEXT,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consent_ip TEXT,
ADD COLUMN IF NOT EXISTS consent_user_agent TEXT,
ADD COLUMN IF NOT EXISTS signature_image_url TEXT,
ADD COLUMN IF NOT EXISTS signature_hash TEXT,
ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 1. Ficha de Atendimento Clínico (Medical Records)
CREATE TABLE IF NOT EXISTS appointment_medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    procedure_performed TEXT,
    materials_used TEXT,
    notes TEXT,
    had_complications BOOLEAN DEFAULT false,
    complication_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: appointment_medical_records
ALTER TABLE appointment_medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view medical records of their company"
    ON appointment_medical_records FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert medical records to their company"
    ON appointment_medical_records FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update medical records of their company"
    ON appointment_medical_records FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete medical records of their company"
    ON appointment_medical_records FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- 2. Anexos Clínicos (Medical Attachments)
CREATE TABLE IF NOT EXISTS medical_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: medical_attachments
ALTER TABLE medical_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view medical attachments of their company"
    ON medical_attachments FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert medical attachments to their company"
    ON medical_attachments FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update medical attachments of their company"
    ON medical_attachments FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete medical attachments of their company"
    ON medical_attachments FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- 3. Histórico e Evolução do Paciente (Progress Notes)
CREATE TABLE IF NOT EXISTS patient_progress_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    progress_notes TEXT NOT NULL,
    next_recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: patient_progress_notes
ALTER TABLE patient_progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view progress notes of their company"
    ON patient_progress_notes FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert progress notes to their company"
    ON patient_progress_notes FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update progress notes of their company"
    ON patient_progress_notes FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete progress notes of their company"
    ON patient_progress_notes FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- 4. Storage Buckets (if they do not exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinical_attachments', 'clinical_attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('anamnese_documents', 'anamnese_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: clinical_attachments
CREATE POLICY "Users can upload clinical attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'clinical_attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can view clinical attachments" ON storage.objects FOR SELECT USING (
  bucket_id = 'clinical_attachments' AND auth.role() = 'authenticated'
);

-- Storage Policies: anamnese_documents
CREATE POLICY "Users can upload anamnese documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'anamnese_documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can view anamnese documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'anamnese_documents'
);
