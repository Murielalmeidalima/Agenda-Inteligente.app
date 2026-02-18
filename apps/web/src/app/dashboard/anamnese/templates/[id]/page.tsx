'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, TextArea, Label, Card } from '@projeto/ui';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import QuestionEditor from '@/components/anamnese/question-editor';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  async function fetchTemplate() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('anamnese_templates')
        .select('*, anamnese_questions(*)')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      
      setName(data.name);
      setDescription(data.description || '');
      // Sort questions by order
      const sortedQuestions = (data.anamnese_questions || []).sort((a: any, b: any) => a.order - b.order);
      setQuestions(sortedQuestions);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar modelo');
      router.push('/dashboard/anamnese/templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name) return toast.error('Nome do modelo é obrigatório');
    if (questions.length === 0) return toast.error('Adicione pelo menos uma pergunta');

    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // 1. Atualizar Template
      const { error: tmplError } = await supabase
        .from('anamnese_templates')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (tmplError) throw tmplError;

      // 2. Upsert Perguntas
      const questionsToUpsert = questions.map((q: any, index: number) => ({
        id: q.id, 
        template_id: params.id,
        question_text: q.question_text,
        type: q.type,
        is_required: q.is_required,
        order: index + 1
      }));

      const { data: upsertedData, error: qError } = await supabase
        .from('anamnese_questions')
        .upsert(questionsToUpsert, { onConflict: 'id' })
        .select('id');

      if (qError) throw qError;

      // 3. Deletar perguntas removidas de forma segura
      const { data: existingQuestions } = await supabase
        .from('anamnese_questions')
        .select('id')
        .eq('template_id', params.id);
      
      const existingIds = existingQuestions?.map((q: any) => q.id) || [];
      const currentIds = questions.map(q => q.id);
      const toDelete = existingIds.filter(id => !currentIds.includes(id));

      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from('anamnese_questions')
          .delete()
          .in('id', toDelete);
        
        if (delError) throw delError;
      }
      
      // Let's refine delete logic in code below to be safe.

      toast.success('Modelo atualizado!');
      router.push('/dashboard/anamnese/templates');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza? Isso apagará todas as respostas vinculadas.')) return;
    
    setSaving(true);
    try {
        const supabase = createBrowserClient();
        const { error } = await supabase.from('anamnese_templates').delete().eq('id', params.id);
        if (error) throw error;
        toast.success('Modelo excluído');
        router.push('/dashboard/anamnese/templates');
    } catch(err: any) {
        toast.error('Erro ao excluir: ' + err.message);
        setSaving(false);
    }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/anamnese/templates">
                <Button variant="ghost" size="icon" className="text-[#2C2825] hover:bg-[#5C5855] rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-black text-[#2C2825]">Editar Modelo</h1>
                <p className="text-[#8A847C] text-sm">Atualize as perguntas e descrições.</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleDelete}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold rounded-xl"
          >
             <Trash2 className="mr-2 h-4 w-4" />
             Excluir
          </Button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
             <Card className="bg-white border-[#E5E0D8] rounded-3xl p-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[#5C5855] font-bold">Nome do Modelo</Label>
                      <Input 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] h-12 rounded-xl"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[#5C5855] font-bold">Descrição</Label>
                        <TextArea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] min-h-[100px] rounded-xl"
                      />
                   </div>
                </div>
             </Card>

             <Button 
               onClick={handleSave} 
               className="w-full bg-primary-500 hover:bg-primary-600 text-[#2C2825] font-bold h-14 rounded-2xl text-lg shadow-lg shadow-primary-500/20"
               loading={saving}
             >
                <Save className="mr-2 h-5 w-5" />
                Salvar Alterações
             </Button>
          </div>

          <div className="lg:col-span-2 space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2C2825]">Perguntas</h2>
                <span className="text-[#2C2825] bg-neutral-100 px-3 py-1 rounded-full">{questions.length}</span>
             </div>
             
             <QuestionEditor questions={questions} onChange={setQuestions} />
          </div>
       </div>
    </div>
  );
}
