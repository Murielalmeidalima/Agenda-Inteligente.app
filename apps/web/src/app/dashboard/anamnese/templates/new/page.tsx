'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Input, 
  TextArea, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  Label, 
  Badge, 
  Card, 
  CardContent 
} from '@projeto/ui';
import { Save, ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import QuestionEditor from '@/components/anamnese/question-editor';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewTemplatePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validityValue, setValidityValue] = useState<number>(6);
  const [validityUnit, setValidityUnit] = useState<'days' | 'months' | 'years'>('months');
  const [externalFormUrl, setExternalFormUrl] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name) return toast.error('Nome do modelo é obrigatório');
    if (questions.length === 0) return toast.error('Adicione pelo menos uma pergunta');

    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // 1. Criar Template
      const { data: template, error: tmplError } = await supabase
        .from('anamnese_templates')
        .insert({
          company_id: profile?.company_id,
          name,
          description,
          validity_value: validityValue,
          validity_unit: validityUnit,
          external_form_url: externalFormUrl || null,
          is_active: true
        })
        .select()
        .single();

      if (tmplError) throw tmplError;

      // 2. Criar Perguntas
      const questionsToInsert = questions.map((q, index) => ({
        template_id: template.id,
        question_text: q.question_text,
        type: q.type,
        is_required: q.is_required,
        order: index + 1 // Garante ordem correta
      }));

      const { error: qError } = await supabase
        .from('anamnese_questions')
        .insert(questionsToInsert);

      if (qError) throw qError;

      toast.success('Modelo criado com sucesso!');
      router.push('/dashboard/anamnese/templates');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar modelo: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
       <div className="flex items-center gap-4">
          <Link href="/dashboard/anamnese/templates">
             <Button variant="ghost" size="icon" className="text-[#2C2825] hover:bgtext-[#5C5855] rounded-xl">
                <ArrowLeft className="h-5 w-5" />
             </Button>
          </Link>
          <div>
             <h1 className="text-2xl font-black text-[#2C2825]">Criar Novo Modelo</h1>
             <p className="text-[#8A847C] text-sm">Configure as perguntas para seus pacientes.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Configurações Básicas */}
          <div className="space-y-6">
             <Card className="bg-white border-[#E5E0D8] rounded-3xl p-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[#5C5855] font-bold">Nome do Modelo</Label>
                      <Input 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ex: Anamnese Facial Completa"
                        className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] h-12 rounded-xl"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[#5C5855] font-bold">Descrição (Opcional)</Label>
                        <TextArea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="Breve descrição para o paciente ver..."
                        className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] min-h-[100px] rounded-xl"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[#5C5855] font-bold">Validade</Label>
                         <Input 
                           type="number"
                           value={validityValue}
                           onChange={e => setValidityValue(Number(e.target.value))}
                           className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] h-12 rounded-xl"
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[#5C5855] font-bold">Unidade</Label>
                         <Select 
                           value={validityUnit} 
                           onValueChange={(v: any) => setValidityUnit(v)} 
                         >
                             <SelectTrigger className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] h-12 rounded-xl">
                                <SelectValue placeholder="Unidade" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="days">Dias</SelectItem>
                                <SelectItem value="months">Meses</SelectItem>
                                <SelectItem value="years">Anos</SelectItem>
                             </SelectContent>
                         </Select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[#5C5855] font-bold text-sm">Formulário Externo (Google Forms) Opcional</Label>
                      <p className="text-xs text-[#8A847C] mb-1">Se preenchido, os pacientes serão redirecionados para este link.</p>
                      <Input 
                        value={externalFormUrl} 
                        onChange={e => setExternalFormUrl(e.target.value)} 
                        placeholder="https://docs.google.com/forms/..."
                        className="bg-[#FAF9F6] border-[#E5E0D8] text-[#2C2825] h-12 rounded-xl"
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
                Salvar Modelo
             </Button>
          </div>

          {/* Coluna Direita: Perguntas */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2C2825]">Perguntas</h2>
                <span className="text-[#2C2825]xt-[#8A847C] bg-neutral-900 px-3 py-1 rounded-full">{questions.length} perguntas</span>
             </div>
             
             <QuestionEditor questions={questions} onChange={setQuestions} />
          </div>
       </div>
    </div>
  );
}
