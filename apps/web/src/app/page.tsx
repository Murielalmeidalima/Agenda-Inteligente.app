import LandingPage from '@/components/landing/landing-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agenda Inteligente | Sistema de Gestão para Clínicas',
  description: 'Transforme sua clínica em uma máquina de agendamentos e faturamento. Agenda, financeiro, estoque e automações em um só lugar.',
  openGraph: {
    title: 'Agenda Inteligente',
    description: 'Sistema completo para gestão e escala de clínicas e consultórios.',
    type: 'website',
  }
};

export default function Home() {
  return <LandingPage />;
}
