import ProceduresClient from './procedures-client';

export const metadata = {
  title: 'Procedimentos | Agenda Inteligente',
  description: 'Gerenciamento de serviços e procedimentos',
};

export default function ProceduresPage() {
  return <ProceduresClient />;
}
