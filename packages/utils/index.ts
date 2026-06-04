export const formatDate = (date: Date) => {
  return date.toISOString();
};

export * from './supabase';
export * from './notifications/sms/sms-service';
export * from './notifications/whatsapp/whatsapp-service';

