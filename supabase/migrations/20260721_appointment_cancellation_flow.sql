-- Migration: Add cancellation fields to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_by uuid references public.profiles(id);
