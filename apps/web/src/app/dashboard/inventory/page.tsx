'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Card, 
  CardContent, 
  Badge,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@projeto/ui';
import { Package, AlertTriangle, ArrowUpRight, Printer, Plus } from 'lucide-react';
import StockTable from '@/components/inventory/stock-table';
import { useProfile } from '@/providers/profile-provider';

export default function InventoryPage() {
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'ok'>('all');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Materiais',
    current_stock: 0,
    min_stock: 5,
    unit: 'un',
    sale_price: 0
  });

  // Guard screen access
  useEffect(() => {
    if (profile) {
      if (profile.role !== 'admin' && profile.role !== 'chefe') {
        const hasAccess = profile.permissions?.inventory?.view;
        if (!hasAccess) {
          router.push('/dashboard');
        }
      }
    }
  }, [profile, router]);

  // Optimize: Fetch on mount, trust RLS to filter by company
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const supabase = createBrowserClient();
      // Remove explicit .eq('company_id') check as RLS handles it
      // This allows parallel fetching without waiting for profile
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
      console.error('Error fetching inventory:', err.message || err);
      if (err && typeof err === 'object') {
        console.error('Error Details:', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const lowStockCount = products?.filter((p: any) => p.current_stock <= p.min_stock).length || 0;
  // Corrigido para sale_price conforme migração
  const totalInvestment = products?.reduce((acc: number, p: any) => acc + (p.sale_price || p.price || 0) * (p.current_stock || 0), 0) || 0;

  async function handleTransaction(productId: string, type: 'in' | 'out', quantity: number, reason: string) {
    if (!profile?.company_id) {
       alert('Erro: Perfil da empresa não encontrado. Tente recarregar a página.');
       return;
    }

    const targetProduct = products.find(p => p.id === productId);
    const calculatedNewStock = type === 'in' 
        ? Number(targetProduct?.current_stock || 0) + quantity 
        : Number(targetProduct?.current_stock || 0) - quantity;

    // Atualização otimista local
    setProducts(current => current.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          current_stock: calculatedNewStock
        };
      }
      return p;
    }));

    try {
      const supabase = createBrowserClient();
      
      // 1. Gravar histórico da transação
      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert({
          company_id: profile.company_id,
          product_id: productId,
          professional_id: profile.id,
          type,
          quantity,
          reason
        });

      if (txError) throw txError;
      
      // 2. Forçar a baixa via API (Fallback de segurança caso o Trigger esteja ausente ou bloqueado)
      const { error: stockError } = await supabase
        .from('products')
        .update({ current_stock: calculatedNewStock })
        .eq('id', productId);
        
      if (stockError) throw stockError;

      // Re-fetch para garantir sincronia total com o servidor
      await fetchProducts();
    } catch (err: any) {
      console.error('Error recording transaction:', err.message || err);
      if (err && typeof err === 'object') {
        console.error('Error Details:', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
      }
      alert(`Falha ao registrar movimentação: ${err.message || 'Erro no servidor'}`);
      fetchProducts(); // Reverte para o estado do servidor
    }
  }

  async function handleCreateProduct() {
    if (!profile?.company_id) return;
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          current_stock: newProduct.current_stock,
          min_stock: newProduct.min_stock,
          unit: newProduct.unit,
          sale_price: newProduct.sale_price,
          description: `Categoria: ${newProduct.category}`,
          company_id: profile.company_id
        }]);

      if (error) throw error;
      
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        category: 'Materiais',
        current_stock: 0,
        min_stock: 5,
        unit: 'un',
        sale_price: 0
      });
      fetchProducts();
      alert("Produto cadastrado com sucesso!");
    } catch (err: any) {
      console.error('Error creating product:', err.message || err);
      if (err && typeof err === 'object') {
        console.error('Error Details:', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
      }
      alert(`Erro ao cadastrar produto: ${err.message || err.details || 'Verifique o console'}`);
    }
  }

  // Removed blocking loader
  // We render the shell immediately and show skeleton in table

  function handleGenerateReport() {
    if (!products.length) return;
    
    const headers = ['Produto', 'Categoria', 'Estoque Atual', 'Mínimo', 'Unidade', 'Preço de Venda'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        `"${p.name}"`,
        `"${p.description?.includes('Categoria: ') ? p.description.split('Categoria: ')[1] : 'Sem Categoria'}"`,
        p.current_stock,
        p.min_stock,
        `"${p.unit}"`,
        p.sale_price || p.price || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-[#B5952F] fill-[#D4AF37]/20" />
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Estoque</h1>
              <p className="text-slate-500 text-sm mt-1">Controle de insumos e revenda</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleGenerateReport}
            className="border-neutral-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-semibold rounded-xl h-11 px-6 transition-all"
          >
            <Printer className="h-4 w-4 mr-2" />
            Relatório CSV
          </Button>
          <Button 
            onClick={() => setIsAddingProduct(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl h-11 px-6 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIItem 
          title="Total de Itens" 
          value={products?.length || 0} 
          icon={Package} 
          color="primary" 
          isActive={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        <KPIItem 
           title="Alertas Críticos" 
           value={lowStockCount} 
           icon={AlertTriangle} 
           color="amber" 
           accent={lowStockCount > 0} 
           isActive={filterStatus === 'critical'}
           onClick={() => setFilterStatus('critical')}
        />
        <KPIItem 
          title="Estoque Saudável" 
          value={products?.length - lowStockCount} 
          icon={ArrowUpRight} 
          color="emerald" 
          isActive={filterStatus === 'ok'}
          onClick={() => setFilterStatus('ok')}
        />
      </div>

      {/* Main Table */}
      <Card className="bg-white border-neutral-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
         <StockTable 
            isLoading={loading}
            products={products.map(p => ({
              ...p,
              category: p.description?.includes('Categoria: ') ? p.description.split('Categoria: ')[1] : 'Sem Categoria'
            })) || []} 
            onTransaction={handleTransaction}
            onAddProduct={() => setIsAddingProduct(true)}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
         />
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="bg-white border-neutral-100 text-slate-900 rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              Novo Produto
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-6">
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-semibold text-slate-600 ml-1">Nome do Produto</Label>
              <Input 
                placeholder="Ex: Botox 50U" 
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="bg-white border-neutral-200 h-12 rounded-xl text-slate-900 font-medium" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Categoria</Label>
              <Select 
                value={newProduct.category} 
                onValueChange={(val) => setNewProduct({...newProduct, category: val})}
              >
                <SelectTrigger className="bg-white border-neutral-200 h-12 rounded-xl text-slate-900 font-medium">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-slate-900">
                  <SelectItem value="Materiais">Materiais</SelectItem>
                  <SelectItem value="Revenda">Revenda</SelectItem>
                  <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Unidade</Label>
              <Select 
                value={newProduct.unit} 
                onValueChange={(val) => setNewProduct({...newProduct, unit: val})}
              >
                <SelectTrigger className="bg-white border-neutral-200 h-12 rounded-xl text-slate-900 font-medium">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-slate-900">
                  <SelectItem value="un">un (Unidade)</SelectItem>
                  <SelectItem value="ml">ml (Mililitro)</SelectItem>
                  <SelectItem value="cx">cx (Caixa)</SelectItem>
                  <SelectItem value="pct">pct (Pacote)</SelectItem>
                  <SelectItem value="g">g (Grama)</SelectItem>
                  <SelectItem value="kg">kg (Quilograma)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Estoque Inicial</Label>
              <Input 
                type="number"
                value={newProduct.current_stock}
                onChange={(e) => setNewProduct({...newProduct, current_stock: parseInt(e.target.value) || 0})}
                className="bg-white border-neutral-200 h-12 rounded-xl text-slate-900 font-medium" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Mínimo de Segurança</Label>
              <Input 
                type="number"
                value={newProduct.min_stock}
                onChange={(e) => setNewProduct({...newProduct, min_stock: parseInt(e.target.value) || 0})}
                className="bg-white border-neutral-200 h-12 rounded-xl text-slate-900 font-medium" 
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Preço de Venda (Opcional)</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newProduct.sale_price}
                onChange={(e) => setNewProduct({...newProduct, sale_price: parseFloat(e.target.value) || 0})}
                className="bg-white border-neutral-200 h-12 rounded-xl text-slate-900 font-medium" 
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAddingProduct(false)}
              className="border-neutral-200 bg-white text-slate-500 hover:bg-neutral-50 hover:text-slate-900 font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateProduct}
              className="bg-primary-500 hover:bg-primary-600 font-bold px-8 rounded-xl"
            >
              Cadastrar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIItem({ title, value, icon: Icon, color, accent, onClick, isActive }: any) {
   return (
    <Card 
      onClick={onClick}
      className={cn(
        "bg-blue-950 border-blue-900 rounded-3xl overflow-hidden shadow-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        accent && `border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/20`,
        isActive && `ring-2 ring-amber-500 ring-offset-4 ring-offset-slate-50 border-transparent bg-blue-900`
    )}>
      <CardContent className="pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">{title}</p>
            <div className="flex items-center gap-3 mt-2">
              <h3 className="text-3xl font-black text-white italic">{value}</h3>
              {accent && (
                <Badge className={cn("bg-amber-500/10 text-amber-500 border-none animate-pulse px-2.5")}>Crítico</Badge>
              )}
            </div>
          </div>
          <div className={cn(
              "p-4 rounded-2xl border transition-colors",
              accent ? `bg-blue-900/50 border-amber-500/20` : "bg-blue-900/50 border-blue-800"
          )}>
            <Icon className={cn("h-7 w-7", accent ? `text-amber-500` : "text-blue-400")} />
          </div>
        </div>
      </CardContent>
    </Card>
   )
}
