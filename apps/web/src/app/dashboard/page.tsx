import { createServerClient } from '@/lib/auth';
import { StitchDashboardClient } from './StitchDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();
  
  // Check Authentication
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-bold mb-2 text-[#2C2825]">Acesso Negado</h2>
            <p className="text-[#8A847C]">Por favor, faça login novamente.</p>
          </div>
       </div>
    );
  }

  // Get User Profile & Company ID in a single query
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, approved, permissions, full_name, companies(name, logo_url)')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.company_id) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#2C2825]">Configuração Pendente</h2>
            <p className="text-[#5C5855] leading-relaxed">
              Sua conta ainda não está vinculada a nenhuma clínica. Entre em contato com o suporte ou aguarde a aprovação do administrador.
            </p>
          </div>
       </div>
    );
  }

  if (!profile.approved) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#2C2825]">Aprovação Pendente</h2>
            <p className="text-[#5C5855] leading-relaxed">
              Sua conta aguarda aprovação do administrador da clínica. Você receberá um e-mail assim que o acesso for liberado.
            </p>
          </div>
       </div>
    );
  }

  const company = (profile as any).companies;

  return (
    <StitchDashboardClient
      profile={profile}
      company={company}
    />
  );
}
