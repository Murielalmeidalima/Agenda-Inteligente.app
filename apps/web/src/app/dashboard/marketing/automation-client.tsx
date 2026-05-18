'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Badge,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn
} from '@projeto/ui';
import { 
  MessageSquare, 
  Plus, 
  Calendar, 
  Clock, 
  Gift, 
  UserMinus,
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  Star
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import { ReviewsWidget } from '@/components/marketing/ReviewsWidget';

type Rule = {
  id: string;
  name: string;
  trigger_type: 'birthday' | 'pre_appointment' | 'post_appointment' | 'inactive_client';
  time_offset_minutes: number;
  message_template: string;
  benefit_text?: string | null;
  is_active: boolean;
  company_id: string;
};

type AutomationLog = {
  id: string;
  recipient_phone: string;
  status: string;
  sent_at: string;
  rule_id: string;
  error_message?: string;
  automation_rules?: { name: string };
};

function ReviewSettingsForm() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    google_review_url: '',
    enable_google_review: false,
    feedback_type: 'internal',
    external_forms_url: '',
    min_rating_for_google: 4,
    min_interval_days: 30,
    auto_send_enabled: true,
    preferred_channel: 'whatsapp'
  });

  const supabase = createBrowserClient();

  async function fetchSettings() {
    const { data, error } = await supabase
      .from('review_settings')
      .select('*')
      .eq('company_id', profile?.company_id)
      .single();

    if (data) {
      // Tentar carregar metadados da regra de automação vinculada
      const { data: rule } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('name', 'Sistema: Controle de Avaliação')
        .single();

      if (rule && rule.benefit_text) {
        try {
          const meta = JSON.parse(rule.benefit_text);
          setSettings({
            ...data,
            min_interval_days: meta.min_interval_days || 30,
            auto_send_enabled: rule.is_active,
            preferred_channel: meta.preferred_channel || 'whatsapp'
          });
        } catch (e) {
          setSettings({...data, ...settings});
        }
      } else {
        setSettings({...data, ...settings});
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.company_id) {
       fetchSettings();
    }
  }, [profile?.company_id]);

  async function handleSave() {
    setSaving(true);
    // 1. Salvar configurações básicas
    const { error } = await supabase
      .from('review_settings')
      .upsert({
        company_id: profile?.company_id,
        google_review_url: settings.google_review_url,
        enable_google_review: settings.enable_google_review,
        feedback_type: settings.feedback_type,
        external_forms_url: settings.external_forms_url,
        min_rating_for_google: settings.min_rating_for_google,
        updated_at: new Date().toISOString()
      });

    if (error) {
       alert('Erro ao salvar configurações principais');
       setSaving(false);
       return;
    }

    // 2. Salvar Controle Inteligente como uma Regra de Automação "Fantasma"
    const { error: ruleError } = await supabase
      .from('automation_rules')
      .upsert({
        company_id: profile?.company_id,
        name: 'Sistema: Controle de Avaliação',
        trigger_type: 'post_appointment',
        time_offset_minutes: 60, // 1 hora após
        is_active: settings.auto_send_enabled,
        message_template: 'Olá {cliente}! Como foi sua experiência na {clinica}? Sua avaliação nos ajuda muito! {link_agenda}',
        benefit_text: JSON.stringify({
           min_interval_days: settings.min_interval_days,
           preferred_channel: settings.preferred_channel
        })
      }, { onConflict: 'company_id,name' });

    if (ruleError) alert('Erro ao salvar automação inteligente: ' + ruleError.message);
    else alert('Configurações de avaliação salvas com sucesso!');
    
    setSaving(false);
  }

  if (loading) return <div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-2xl">
       <div className="space-y-4">
          <div className="flex items-center justify-between">
             <div className="space-y-0.5">
                <Label className="text-base font-bold">Redirecionar para Google Review</Label>
                <p className="text-sm text-muted-foreground">Clientes que derem nota alta serão convidados a avaliar no Google.</p>
             </div>
             <Switch 
                checked={settings.enable_google_review} 
                onCheckedChange={(val) => setSettings({...settings, enable_google_review: val})} 
             />
          </div>

          {settings.enable_google_review && (
             <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>Link do seu Perfil no Google</Label>
                <Input 
                   placeholder="https://g.page/r/YOUR_ID/review" 
                   value={settings.google_review_url || ''} 
                   onChange={(e) => setSettings({...settings, google_review_url: e.target.value})}
                />
             </div>
          )}
       </div>

       <div className="space-y-4 pt-4 border-t">
          <div className="space-y-0.5">
             <Label className="text-base font-bold">Fluxo de Críticas (1-3 Estrelas)</Label>
             <p className="text-sm text-muted-foreground">Como deseja receber o feedback de clientes insatisfeitos?</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => setSettings({...settings, feedback_type: 'internal'})}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  settings.feedback_type === 'internal' ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-neutral-200"
                )}
             >
                <p className="font-bold text-sm">Feedback Interno</p>
                <p className="text-[10px] text-muted-foreground">Registra apenas dentro do aplicativo.</p>
             </button>
             <button 
                onClick={() => setSettings({...settings, feedback_type: 'external_forms'})}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  settings.feedback_type === 'external_forms' ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-neutral-200"
                )}
             >
                <p className="font-bold text-sm">Google Forms</p>
                <p className="text-[10px] text-muted-foreground">Redireciona para um formulário externo.</p>
             </button>
          </div>

          {settings.feedback_type === 'external_forms' && (
             <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>Link do Google Forms</Label>
                <Input 
                   placeholder="https://docs.google.com/forms/..." 
                   value={settings.external_forms_url || ''} 
                   onChange={(e) => setSettings({...settings, external_forms_url: e.target.value})}
                />
             </div>
          )}
       </div>

       <div className="space-y-6 pt-6 border-t">
          <div className="flex items-center justify-between">
             <div className="space-y-0.5">
                <Label className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Controle Inteligente de Solicitação
                </Label>
                <p className="text-sm text-muted-foreground italic">Evite incomodar clientes frequentes enviando avaliações repetidas.</p>
             </div>
             <Switch 
                checked={settings.auto_send_enabled} 
                onCheckedChange={(val) => setSettings({...settings, auto_send_enabled: val})} 
             />
          </div>

          {settings.auto_send_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-left-4">
               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Prazo Mínimo entre Solicitações</Label>
                  <select 
                     className="flex h-12 w-full rounded-xl border border-neutral-100 bg-white px-3 py-2 text-sm font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     value={settings.min_interval_days}
                     onChange={(e) => setSettings({...settings, min_interval_days: parseInt(e.target.value)})}
                  >
                    <option value="7">7 dias (1 semana)</option>
                    <option value="15">15 dias (Quinzena)</option>
                    <option value="30">30 dias (Mensal)</option>
                    <option value="60">60 dias (Bimestral)</option>
                    <option value="90">90 dias (Trimestral)</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Canal de Envio Preferido</Label>
                  <select 
                     className="flex h-12 w-full rounded-xl border border-neutral-100 bg-white px-3 py-2 text-sm font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     value={settings.preferred_channel}
                     onChange={(e) => setSettings({...settings, preferred_channel: e.target.value})}
                  >
                    <option value="whatsapp">WhatsApp Business</option>
                    <option value="email">E-mail</option>
                    <option value="sms">SMS Marketing</option>
                    <option value="push">Notificação Push (App)</option>
                  </select>
               </div>
            </div>
          )}
       </div>

       <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto min-w-[200px] h-12 bg-primary text-white font-bold">
          {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Salvar Configurações'}
       </Button>
    </div>
  );
}

export default function AutomationClient() {
  const { profile } = useProfile();
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfiguringReviews, setIsConfiguringReviews] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [saving, setSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    name: '',
    trigger_type: 'pre_appointment',
    time_offset_minutes: 0,
    message_template: '',
    is_active: true
  });

  const supabase = createBrowserClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchRules();
      fetchLogs();
    }
  }, [profile?.company_id]);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*, automation_rules(name)')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }

  // Automações agora processadas exclusivamente pelo Cron Job no servidor

  const handleToggleRule = async (id: string, currentState: boolean) => {
    // Optimistic Update
    setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentState } : r));

    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      console.error('Error updating rule:', error);
      // Revert if failed
      setRules(rules.map(r => r.id === id ? { ...r, is_active: currentState } : r));
      alert('Erro ao atualizar regra');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    setRules(rules.filter(r => r.id !== id));

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting rule:', error);
      fetchRules(); // Revert
      alert('Erro ao excluir regra');
    }
  };

  const handleSaveRule = async () => {
    if (!newRule.name || !newRule.message_template || !profile?.company_id) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          company_id: profile.company_id,
          name: newRule.name,
          trigger_type: newRule.trigger_type,
          time_offset_minutes: newRule.time_offset_minutes,
          message_template: newRule.message_template,
          benefit_text: newRule.benefit_text,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setRules([data, ...rules]);
      setIsCreating(false);
      setNewRule({
        name: '',
        trigger_type: 'pre_appointment',
        time_offset_minutes: 0,
        message_template: '',
        benefit_text: '',
        is_active: true
      });
      alert('Regra criada com sucesso!');
    } catch (err: any) {
      console.error('Error saving rule:', err);
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
     return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-200">
              <MessageCircle className="h-8 w-8 text-rose-500" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Marketing Inteligente</h2>
              <p className="text-slate-400 font-medium mt-1">Conecte-se com seus clientes de forma automática e estratégica</p>
           </div>
        </div>
        <Button 
          onClick={() => {
            setActiveTab('rules');
            setIsCreating(true);
          }} 
          className="h-14 px-10 bg-slate-950 hover:bg-black text-white font-black rounded-2xl shadow-2xl shadow-slate-200 gap-3 transition-all active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5 text-rose-500" /> Nova Automação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
        <StatsCard 
          label="Mensagens Enviadas" 
          value={logs.length} 
          icon={MessageCircle} 
          color="emerald" 
          description="Últimos 30 dias"
          onClick={() => setActiveTab('history')}
        />
        <StatsCard 
          label="Regras Ativas" 
          value={rules.filter(r => r.is_active).length} 
          icon={CheckCircle2} 
          color="blue" 
          description="Automações rodando"
          onClick={() => setActiveTab('rules')}
        />
        <StatsCard 
          label="Aniversariantes" 
          value={0} // Mocked or calculated
          icon={Gift} 
          color="amber" 
          description="No mês atual"
          onClick={() => setActiveTab('birthday_campaign')}
        />
        <StatsCard 
          label="Satisfação (NPS)" 
          value="4.9" 
          icon={Star} 
          color="rose" 
          description="Média das avaliações"
          onClick={() => setActiveTab('reviews')}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="flex w-fit h-auto p-1.5 bg-slate-900/5 backdrop-blur-sm rounded-2xl border border-slate-200/50">
            <TabsTrigger value="rules" className="gap-2.5 py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all font-black uppercase text-[10px] tracking-widest text-slate-400">
              <MessageSquare className="w-4 h-4" />
              Regras
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2.5 py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all font-black uppercase text-[10px] tracking-widest text-slate-400">
              <Clock className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="birthday_campaign" className="gap-2.5 py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all font-black uppercase text-[10px] tracking-widest text-slate-400">
              <Gift className="w-4 h-4" />
              Aniversariantes
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2.5 py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all font-black uppercase text-[10px] tracking-widest text-slate-400">
              <Star className="w-4 h-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="inactive" className="gap-2.5 py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all font-black uppercase text-[10px] tracking-widest text-slate-400">
              <UserMinus className="w-4 h-4" />
              Inativos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rules" className="space-y-6 mt-6">
          {isCreating && (
            <Card className="bg-card border-l-4 border-l-primary animate-in slide-in-from-top-4">
              <CardHeader>
                <CardTitle>Nova Automação</CardTitle>
                <CardDescription>Configure quando e o que enviar para seus clientes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Regra</Label>
                    <Input 
                      placeholder="Ex: Lembrete Matinal" 
                      value={newRule.name} 
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gatilho (Quando enviar?)</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newRule.trigger_type}
                      onChange={(e) => setNewRule({...newRule, trigger_type: e.target.value as any})}
                    >
                      <option value="pre_appointment">Antes do Agendamento (Lembrete)</option>
                      <option value="post_appointment">Depois do Agendamento (Pesquisa)</option>
                      <option value="birthday">Aniversário do Cliente</option>
                      <option value="inactive_client">Clientes Inativos (Recuperação)</option>
                    </select>
                  </div>
                </div>

                {newRule.trigger_type === 'inactive_client' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label>Prazo de Inatividade (Dias)</Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number" 
                        min="1"
                        value={Math.trunc((newRule.time_offset_minutes || 0) / 1440)} 
                        onChange={(e) => {
                          const days = Math.max(1, parseInt(e.target.value) || 1);
                          setNewRule({...newRule, time_offset_minutes: days * 1440});
                        }}
                        className="w-32 h-12 text-center font-bold"
                      />
                      <span className="text-sm text-muted-foreground font-medium">dias sem retorno</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">O sistema enviará a mensagem automaticamente após esse período sem visitas.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Tempo de Disparo</Label>
                    <div className="flex gap-4 items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Horas</span>
                        <Input 
                          type="number" 
                          value={Math.trunc((newRule.time_offset_minutes || 0) / 60)} 
                          onChange={(e) => {
                            const h = parseInt(e.target.value) || 0;
                            const currentM = Math.abs((newRule.time_offset_minutes || 0) % 60);
                            const isNegative = h < 0 || (h === 0 && e.target.value.startsWith('-'));
                            setNewRule({...newRule, time_offset_minutes: h * 60 + (isNegative ? -currentM : currentM)});
                          }}
                          className="w-24 h-12 text-center font-bold"
                        />
                      </div>
                      <div className="text-2xl font-serif text-muted-foreground pb-2">:</div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Minutos</span>
                        <Input 
                          type="number" 
                          min="0"
                          max="59"
                          value={Math.abs((newRule.time_offset_minutes || 0) % 60)} 
                          onChange={(e) => {
                            const m = Math.min(59, Math.abs(parseInt(e.target.value) || 0));
                            const currentH = Math.trunc((newRule.time_offset_minutes ?? 0) / 60);
                            const isNegative = currentH < 0 || (Object.is(currentH, -0) || ((newRule.time_offset_minutes ?? 0) < 0));
                            setNewRule({...newRule, time_offset_minutes: currentH * 60 + (isNegative ? -m : m)});
                          }}
                          className="w-24 h-12 text-center font-bold"
                        />
                      </div>
                      <div className="pb-1">
                        <p className="text-xs text-muted-foreground italic">
                          {newRule.trigger_type === 'pre_appointment' && 'Antes da consulta (use horas negativas)'}
                          {newRule.trigger_type === 'post_appointment' && 'Depois da consulta (use horas positivas)'}
                          {newRule.trigger_type === 'birthday' && 'Horário do dia (Ex: 09:00)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Mensagem (WhatsApp)</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Olá {cliente}, sentimos sua falta! ..."
                    value={newRule.message_template}
                    onChange={(e) => setNewRule({...newRule, message_template: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis: {'{cliente}, {clinica}, {ultima_visita}, {link_agenda}'}
                  </p>
                </div>

                {newRule.trigger_type === 'birthday' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label className="text-primary font-bold">Benefício de Aniversário (Opcional)</Label>
                    <Input 
                      placeholder="Ex: 20% de desconto em qualquer procedimento" 
                      value={newRule.benefit_text || ''} 
                      onChange={(e) => setNewRule({...newRule, benefit_text: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">Este benefício será destacado para a equipe quando o cliente agendar no mês.</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)} disabled={saving}>Cancelar</Button>
                  <Button onClick={handleSaveRule} className="bg-green-600 hover:bg-green-700 text-white" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Regra'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {rules.length === 0 && !loading && (
               <div className="text-center py-12 text-muted-foreground">Nenhuma regra de automação criada.</div>
            )}
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-all group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${rule.is_active ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                      {rule.trigger_type === 'birthday' ? <Gift className="w-6 h-6" /> : 
                       rule.trigger_type === 'inactive_client' ? <UserMinus className="w-6 h-6" /> :
                       rule.trigger_type === 'pre_appointment' ? <Clock className="w-6 h-6" /> : 
                       <MessageSquare className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{rule.message_template}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground uppercase tracking-wide">
                          {rule.trigger_type === 'birthday' ? 'Aniversário' : 
                           rule.trigger_type === 'inactive_client' ? 'Cliente Inativo' :
                           rule.trigger_type === 'pre_appointment' ? 'Pré-Agendamento' : 'Pós-Agendamento'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rule.trigger_type === 'inactive_client' 
                            ? `${Math.trunc(rule.time_offset_minutes / 1440)} dias de inatividade`
                            : `${Math.abs(rule.time_offset_minutes)} min ${rule.time_offset_minutes < 0 ? 'antes' : 'depois'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${rule.id}`} className="text-sm text-muted-foreground">
                        {rule.is_active ? 'Ativo' : 'Pausado'}
                        </Label>
                        <Switch 
                        id={`active-${rule.id}`} 
                        checked={rule.is_active} 
                        onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)} 
                        />
                    </div>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
              <CardDescription>Últimos envios automáticos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum envio registrado recentemente.</div>
                ) : logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {log.status === 'sent' ? <MessageCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Destino: {log.recipient_phone}</p>
                        <p className="text-xs text-muted-foreground">Regra: {log.automation_rules?.name || 'Regra excluída'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`flex items-center gap-1 text-xs font-bold ${log.status === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
                        {log.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status === 'sent' ? 'Entregue' : 'Falha'}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(log.sent_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="birthday_campaign" className="mt-6 space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Campanha de Aniversariantes do Mês</CardTitle>
                  <CardDescription>Clientes que fazem aniversário em {new Date().toLocaleDateString('pt-BR', { month: 'long' })} e não possuem agendamento.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* Esta lógica precisaria de uma busca por clientes aniversariantes via props ou nova consulta */}
             {/* Por enquanto, como o componente é Client-Side, vamos sugerir a consulta ou o uso de filtros */}
             <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <p className="text-muted-foreground font-medium">Filtre seus clientes para iniciar o disparo de mensagens personalizadas.</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => window.location.href='/dashboard/clients'}>
                  Ir para Lista de Clientes
                </Button>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 space-y-6">
          <ReviewsWidget />
          
          <Card className="border-[#E5E0D8] bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
               <div className="space-y-1">
                  <CardTitle className="font-serif">Avaliação Híbrida</CardTitle>
                  <CardDescription>Configure como os clientes avaliam seu atendimento.</CardDescription>
               </div>
               <Button 
                  variant="outline" 
                  onClick={() => setIsConfiguringReviews(!isConfiguringReviews)}
                  className={cn("gap-2 font-bold", isConfiguringReviews && "bg-primary/5 text-primary border-primary")}
               >
                  {isConfiguringReviews ? 'Ocultar Configurações' : 'Configurar Avaliação'}
               </Button>
            </CardHeader>
            {isConfiguringReviews && (
              <CardContent className="border-t animate-in slide-in-from-top-4">
                 <ReviewSettingsForm />
              </CardContent>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="inactive" className="mt-6 space-y-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-amber-600" />
                <div>
                  <CardTitle className="text-amber-900">Monitoramento de Inativos</CardTitle>
                  <CardDescription className="text-amber-800/80">
                    O sistema identifica automaticamente clientes sem retorno e sem agendamentos futuros para envio de convites de retorno.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 gap-4">
             {rules.filter(r => r.trigger_type === 'inactive_client' && r.is_active).length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed rounded-3xl">
                  <p className="text-muted-foreground">Clique em "Nova Regra" e crie uma automação para <b>Clientes Inativos</b> para ativar esta aba.</p>
               </div>
             ) : isProcessing ? (
               <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Analisando base de clientes...</p>
               </div>
             ) : (
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Clientes em Fase de Recuperação</CardTitle>
                   <CardDescription>Estes clientes receberão (ou já receberam) mensagens com base nas suas regras de inatividade.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                       <p className="text-xs text-muted-foreground italic">Dica: O sistema verifica automaticamente a última data de atendimento e se não existem agendamentos futuros antes de disparar.</p>
                       <div className="rounded-xl border overflow-hidden">
                          <table className="w-full text-sm">
                             <thead className="bg-muted/50 border-b">
                                <tr>
                                   <th className="px-4 py-3 text-left font-bold uppercase text-[10px]">Cliente</th>
                                   <th className="px-4 py-3 text-right font-bold uppercase text-[10px]">Status</th>
                                </tr>
                             </thead>
                             <tbody>
                                {logs.filter(l => rules.find(r => r.id === l.rule_id)?.trigger_type === 'inactive_client').length === 0 ? (
                                   <tr>
                                      <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Nenhuma mensagem disparada ainda.</td>
                                   </tr>
                                ) : (
                                   logs.filter(l => rules.find(r => r.id === l.rule_id)?.trigger_type === 'inactive_client').map(log => (
                                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                         <td className="px-4 py-4 font-medium">{log.recipient_phone}</td>
                                         <td className="px-4 py-4 text-right">
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Recuperado (Log Enviado)</Badge>
                                         </td>
                                      </tr>
                                   ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </CardContent>
               </Card>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color, description, onClick }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <Card 
      className={cn(
        "border-none shadow-sm bg-white rounded-3xl overflow-hidden relative group transition-all",
        onClick ? "cursor-pointer hover:-translate-y-1 active:scale-95" : ""
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl border transition-colors bg-white shadow-sm", colors[color as keyof typeof colors])}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant="secondary" className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest border-none">
            {description}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</p>
        </div>
      </CardContent>
      {/* Subtle Glow */}
      <div className={cn(
        "absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity",
        color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
      )} />
    </Card>
  );
}
