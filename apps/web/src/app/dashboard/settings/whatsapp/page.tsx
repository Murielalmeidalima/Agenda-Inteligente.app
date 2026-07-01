'use client';

import { WhatsAppFallback } from '@/components/marketing/WhatsAppFallback';

export default function WhatsAppSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conexão WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecte o número de WhatsApp da sua clínica para enviar lembretes e confirmações automáticas.
        </p>
      </div>

      <WhatsAppFallback />
    </div>
  );
}


