import { z } from 'zod';

/**
 * Appointments Validation Schemas
 */

export const createAppointmentSchema = z.object({
  client_id: z.string().uuid('ID de cliente inválido'),
  professional_id: z.string().uuid('ID de profissional inválido'),
  procedure_id: z.string().uuid('ID de procedimento inválido'),
  start_time: z.string().datetime('Data/hora de início inválida'),
  end_time: z.string().datetime('Data/hora de término inválida'),
  notes: z.string().optional(),
  is_maintenance: z.boolean().optional().default(false),
  parent_appointment_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
  },
  {
    message: 'A data de término deve ser posterior à data de início',
    path: ['end_time'],
  }
);

export const updateAppointmentSchema = z.object({
  id: z.string().uuid('ID de agendamento inválido'),
  client_id: z.string().uuid('ID de cliente inválido').optional(),
  professional_id: z.string().uuid('ID de profissional inválido').optional(),
  procedure_id: z.string().uuid('ID de procedimento inválido').optional(),
  start_time: z.string().datetime('Data/hora de início inválida').optional(),
  end_time: z.string().datetime('Data/hora de término inválida').optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  notes: z.string().optional(),
});

export const confirmAppointmentSchema = z.object({
  token: z.string().min(32, 'Token inválido'),
});

export const reviewAppointmentSchema = z.object({
  token: z.string().min(32, 'Token inválido'),
  rating: z.number().int().min(1).max(5, 'Avaliação deve ser entre 1 e 5'),
  comment: z.string().max(500, 'Comentário muito longo').optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>;
export type ReviewAppointmentInput = z.infer<typeof reviewAppointmentSchema>;
