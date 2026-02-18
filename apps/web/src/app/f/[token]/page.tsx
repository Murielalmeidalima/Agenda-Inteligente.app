import AnamneseForm from '@/components/anamnese/anamnese-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anamnese Digital | Agenda Inteligente',
  description: 'Preencha sua ficha de anamnese com segurança.',
};

export default function PublicAnamnesePage({ params }: { params: { token: string } }) {
  return <AnamneseForm token={params.token} />;
}
