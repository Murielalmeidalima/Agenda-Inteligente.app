-- Migration to add maintenance duration and period unit to procedures
ALTER TABLE procedures
ADD COLUMN IF NOT EXISTS maintenance_duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS maintenance_period_unit TEXT DEFAULT 'days';
