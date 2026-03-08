import { z } from 'zod';

/**
 * Anamnese Validation Schemas
 */

export const sendAnamneseLinkSchema = z.object({
  appointment_id: z.string().uuid('ID de agendamento inválido'),
});

export const getAnamnesePublicSchema = z.object({
  token: z.string()
    .min(32, 'Token inválido')
    .regex(/^[a-f0-9]+$/i, 'Formato de token inválido'),
});

export const submitAnamneseSchema = z.object({
  token: z.string()
    .min(32, 'Token inválido')
    .regex(/^[a-f0-9]+$/i, 'Formato de token inválido'),
  answers: z.record(
    z.string().uuid('ID de questão inválido'),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  ).refine(
    (answers) => Object.keys(answers).length > 0,
    'Pelo menos uma resposta é obrigatória'
  ),
  consentAccepted: z.boolean(),
  signatureDataUrl: z.string().url('Formato de assinatura inválido').or(z.string().startsWith('data:image/')),
});

export const createAnamneseTemplateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  questions: z.array(z.object({
    question_text: z.string().min(3, 'Texto da questão é obrigatório'),
    question_type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'date']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    order: z.number().int().min(0),
  })).min(1, 'Pelo menos uma questão é obrigatória'),
});

export const checkAnamneseStatusSchema = z.object({
  appointment_id: z.string().uuid('ID de agendamento inválido'),
});

export type SendAnamneseLinkInput = z.infer<typeof sendAnamneseLinkSchema>;
export type GetAnamnesePublicInput = z.infer<typeof getAnamnesePublicSchema>;
export type SubmitAnamneseInput = z.infer<typeof submitAnamneseSchema>;
export type CreateAnamneseTemplateInput = z.infer<typeof createAnamneseTemplateSchema>;
export type CheckAnamneseStatusInput = z.infer<typeof checkAnamneseStatusSchema>;
