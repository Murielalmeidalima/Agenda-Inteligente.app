'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Input, Label, Badge } from '@projeto/ui';
import { Plus, Edit, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AnamneseTemplatesPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard screen access
  useEffect(() => {
    if (profile) {
      if (profile.role !== 'admin' && profile.role !== 'chefe') {
        const hasAccess = profile.permissions?.anamnese?.view;
        if (!hasAccess) {
          router.push('/dashboard');
        }
      }
    }
  }, [profile, router]);

  useEffect(() => {
    if (profile?.company_id) fetchTemplates();
  }, [profile]);

  async function fetchTemplates() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('anamnese_templates')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-[#2C2825] tracking-tight">Modelos de Anamnese</h1>
           <p className="text-[#8A847C] text-[10px] uppercase font-black tracking-widest mt-1">Configure as fichas dos seus pacientes</p>
        </div>
        <Link href="/dashboard/anamnese/templates/new">
           <Button className="bg-primary-500 hover:bg-primary-600 font-bold rounded-xl h-11 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Novo Modelo
           </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <Card key={t.id} className="bg-white border-[#E5E0D8] rounded-3xl backdrop-blur-sm group hover:border-primary-500/50 transition-all">
            <CardContent className="p-6 space-y-4">
               <div className="flex items-start justify-between">
                  <div className="bg-primary-500/10 p-3 rounded-2xl text-primary-500">
                     <FileText className="h-6 w-6" />
                  </div>
                  {t.is_active && (
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5">Ativo</Badge>
                  )}
               </div>
               
               <div>
                  <h3 className="text-[#2C2825] font-bold text-lg">{t.name}</h3>
                  <p className="text-[#5C5855] text-sm line-clamp-2 mt-1">{t.description || 'Sem descrição'}</p>
               </div>

               <div className="flex items-center gap-2 pt-2">
                  <Link href={`/dashboard/anamnese/templates/${t.id}`} className="flex-1">
                     <Button variant="outline" className="w-full border-neutral-800 hover:bg-primary-500 hover:text-[#2C2825] rounded-xl">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                     </Button>
                  </Link>
               </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && !loading && (
           <div className="col-span-full text-center py-20 text-neutral-500">
              <p>Nenhum modelo criado. Crie o primeiro para começar.</p>
           </div>
        )}
      </div>
    </div>
  );
}
