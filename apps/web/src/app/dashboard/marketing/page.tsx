import AutomationClient from './automation-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketing e Automação | Agenda Inteligente',
  description: 'Gerencie automações de WhatsApp e avaliações de clientes.',
};

export default function MarketingPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6 animate-fade-in">
      <AutomationClient />
    </div>
  );
}
