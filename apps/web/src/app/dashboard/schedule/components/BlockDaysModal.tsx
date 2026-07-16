'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  cn
} from '@projeto/ui';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  Info,
  Loader2,
  CalendarDays,
  RefreshCw,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { format, addDays, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showToast } from '@/lib/toast-helpers';

interface Block {
  id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string | null;
  recurring_day: number | null;
  is_active: boolean;
}

interface BlockDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onRefresh: () => void;
}

const parseUTCDate = (isoStr: string) => {
  if (!isoStr) return new Date();
  const datePart = isoStr.substring(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function BlockDaysModal({ isOpen, onClose, companyId, onRefresh }: BlockDaysModalProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [blockHolidays, setBlockHolidays] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'manual', // 'manual', 'vacation', 'recurring'
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    start_time: '08:00',
    end_time: '18:00',
    is_full_day: true,
    recurring_day: '0', // 0 = Domingo
    notes: ''
  });

  const [companySettings, setCompanySettings] = useState<any>({});

  const supabase = createBrowserClient();

  async function fetchSettings() {
    const { data } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', companyId)
      .single();
    
    if (data?.settings) {
      setCompanySettings(data.settings);
      setShowHolidays(data.settings.show_holidays || false);
      setBlockHolidays(data.settings.block_holidays || false);
    }
  }

  async function fetchBlocks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('company_id', companyId)
      .order('start_date', { ascending: true });

    if (!error) setBlocks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen && companyId) {
      fetchBlocks();
      fetchSettings();
    }
  }, [isOpen, companyId]);

  async function handleToggleHolidays(val: boolean) {
    setShowHolidays(val);
    const newSettings = { ...companySettings, show_holidays: val };
    setCompanySettings(newSettings);
    
    const { error } = await supabase
      .from('companies')
      .update({ settings: newSettings })
      .eq('id', companyId);
    
    if (error) {
      showToast.error('Erro ao salvar: ' + error.message);
      setShowHolidays(!val);
    }
    onRefresh();
  }

  async function handleToggleBlockHolidays(val: boolean) {
    setBlockHolidays(val);
    const newSettings = { ...companySettings, block_holidays: val };
    setCompanySettings(newSettings);
    
    const { error } = await supabase
      .from('companies')
      .update({ settings: newSettings })
      .eq('id', companyId);
    
    if (error) {
      showToast.error('Erro ao salvar: ' + error.message);
      setBlockHolidays(!val);
    }
    onRefresh();
  }

  async function handleSaveBlock() {
    if (!formData.title || !formData.start_date) {
      showToast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('schedule_blocks')
      .insert({
        company_id: companyId,
        title: formData.title,
        type: formData.type,
        start_date: `${formData.start_date}T00:00:00.000Z`,
        end_date: formData.end_date ? `${formData.end_date}T00:00:00.000Z` : null,
        start_time: formData.is_full_day ? null : formData.start_time,
        end_time: formData.is_full_day ? null : formData.end_time,
        is_full_day: formData.is_full_day,
        recurring_day: formData.type === 'recurring' ? parseInt(formData.recurring_day) : null,
        notes: formData.notes
      });

    if (!error) {
      showToast.success('Bloqueio criado com sucesso!');
      setIsAdding(false);
      setFormData({
        title: '',
        type: 'manual',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        start_time: '08:00',
        end_time: '18:00',
        is_full_day: true,
        recurring_day: '0',
        notes: ''
      });
      fetchBlocks();
      onRefresh();
    } else {
      showToast.error('Erro ao salvar: ' + error.message);
    }
    setSaving(false);
  }

  async function handleDeleteBlock(id: string) {
    if (!confirm('Excluir este bloqueio?')) return;
    
    const { error } = await supabase
      .from('schedule_blocks')
      .delete()
      .eq('id', id);

    if (!error) {
      setBlocks(blocks.filter(b => b.id !== id));
      onRefresh();
    }
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl p-0 overflow-hidden border-[#E5E0D8] shadow-2xl">
        <DialogHeader className="p-8 pb-4 border-b border-[#F8F6F2] bg-[#FAF9F6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-2xl">
                <CalendarDays className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-[#2C2825]">Bloqueio de Agenda</DialogTitle>
                <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-0.5">Gestão de feriados, folgas e férias</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsAdding(!isAdding)}
              className={cn("rounded-xl border-slate-200 font-bold", isAdding && "bg-slate-100")}
            >
              {isAdding ? 'Ver Lista' : 'Novo Bloqueio'}
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-8 pt-6">
          {isAdding ? (
            <div className="space-y-6 animate-in slide-in-from-top-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Motivo / Título</Label>
                <Input 
                  placeholder="Ex: Feriado Local, Viagem, Reforma..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="rounded-xl h-12 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger className="rounded-xl h-12 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Dia Único</SelectItem>
                      <SelectItem value="vacation">Intervalo (Férias)</SelectItem>
                      <SelectItem value="recurring">Recorrente (Semanal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'recurring' ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dia da Semana</Label>
                    <Select value={formData.recurring_day} onValueChange={v => setFormData({...formData, recurring_day: v})}>
                      <SelectTrigger className="rounded-xl h-12 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Domingo</SelectItem>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Inicial</Label>
                    <Input 
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="rounded-xl h-12 border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bloquear dia completo?</Label>
                  </div>
                  <Switch 
                    checked={formData.is_full_day}
                    onCheckedChange={v => setFormData({...formData, is_full_day: v})}
                  />
                </div>

                {!formData.is_full_day && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Das (Início)</Label>
                      <Input 
                        type="time"
                        value={formData.start_time}
                        onChange={e => setFormData({...formData, start_time: e.target.value})}
                        className="rounded-xl h-12 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Até (Fim)</Label>
                      <Input 
                        type="time"
                        value={formData.end_time}
                        onChange={e => setFormData({...formData, end_time: e.target.value})}
                        className="rounded-xl h-12 border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {formData.type === 'vacation' && (
                <div className="space-y-2 animate-in slide-in-from-left-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Final</Label>
                  <Input 
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                    className="rounded-xl h-12 border-slate-200"
                  />
                </div>
              )}

              <Button 
                onClick={handleSaveBlock} 
                className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 mt-4 uppercase tracking-widest text-xs"
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar Bloqueio'}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Toggle Feriados */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Zap className={cn("h-5 w-5 text-blue-600", showHolidays && "animate-spin-slow")} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Exibir Feriados</p>
                      <p className="text-[10px] text-blue-700 uppercase font-black tracking-widest">Nacionais (Brasil)</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showHolidays}
                    onCheckedChange={handleToggleHolidays}
                  />
                </div>

                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-900">Bloquear Agendamentos?</p>
                      <p className="text-[10px] text-red-700 uppercase font-black tracking-widest">Impedir marcações nestes dias</p>
                    </div>
                  </div>
                  <Switch 
                    checked={blockHolidays}
                    onCheckedChange={handleToggleBlockHolidays}
                  />
                </div>
              </div>

              {/* Lista de Bloqueios */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bloqueios Cadastrados</Label>
                
                {loading ? (
                   <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : blocks.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-sm text-slate-400 font-medium italic">Nenhum bloqueio ativo.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {blocks.map(block => (
                      <div key={block.id} className="group p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-red-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center",
                            block.type === 'vacation' ? "bg-amber-50 text-amber-600" :
                            block.type === 'recurring' ? "bg-purple-50 text-purple-600" : "bg-red-50 text-red-600"
                          )}>
                            {block.type === 'recurring' ? <Clock className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{block.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {block.type === 'recurring' ? (
                                `Toda ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][block.recurring_day || 0]}`
                              ) : block.type === 'vacation' ? (
                                `${format(parseUTCDate(block.start_date), 'dd/MM/yy')} até ${format(parseUTCDate(block.end_date || ''), 'dd/MM/yy')}`
                              ) : (
                                format(parseUTCDate(block.start_date), 'dd/MM/yy')
                              )}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeleteBlock(block.id)}
                          className="h-9 w-9 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
