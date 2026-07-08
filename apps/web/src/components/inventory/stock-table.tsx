'use client';

import { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  TextArea,
  cn
} from '@projeto/ui';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  Package,
  History,
  MoreVertical,
  Filter,
  Trash2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  sale_price?: number;
}

interface StockTableProps {
  products: Product[];
  onTransaction: (productId: string, type: 'in' | 'out', quantity: number, reason: string) => Promise<void>;
  onAddProduct: () => void;
  onDeleteProduct?: (id: string) => Promise<void>;
  isLoading?: boolean;
  filterStatus: 'all' | 'critical' | 'ok';
  setFilterStatus: (val: 'all' | 'critical' | 'ok') => void;
}

export default function StockTable({ 
  products, 
  onTransaction, 
  onAddProduct,
  onDeleteProduct,
  isLoading = false,
  filterStatus,
  setFilterStatus
}: StockTableProps) {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.category.toLowerCase().includes(search.toLowerCase());
    
    const isCritical = p.current_stock <= p.min_stock;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'critical' && isCritical) || 
                         (filterStatus === 'ok' && !isCritical);

    return matchesSearch && matchesStatus;
  });

  const handleTransaction = async () => {
     if (!selectedProduct) return;
     setIsSubmitting(true);
     await onTransaction(selectedProduct.id, transactionType, quantity, reason);
     setIsSubmitting(false);
     setSelectedProduct(null);
     setQuantity(1);
     setReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-neutral-100 bg-slate-50/30">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white border rounded-xl shadow-sm">
              <Filter className="h-4 w-4 text-slate-400" />
           </div>
           <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700">Filtro Ativo</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest text-primary">
                {filterStatus === 'all' ? 'Ver Todos' : filterStatus === 'critical' ? 'Estoque Crítico' : 'Estoque Saudável'}
              </p>
           </div>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar produto ou categoria..." 
            className="pl-10 h-11 bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-blue-500 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filterStatus !== 'all' && (
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilterStatus('all')}
            className="text-primary font-bold hover:bg-primary/10 rounded-xl px-4"
           >
             Limpar Filtro
           </Button>
        )}
      </div>

      {/* Desktop view: Table layout */}
      <div className="hidden md:block bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 border-b border-neutral-100 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-6 py-4">Produto</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Categoria</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-widest">Estoque Atual</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-widest">Mínimo</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-widest pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <TableRow key={i} className="border-b border-neutral-100">
                    <TableCell className="pl-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-12 bg-slate-100 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" /></TableCell>
                    <TableCell className="pr-6"><div className="h-8 w-8 bg-slate-100 rounded ml-auto animate-pulse" /></TableCell>
                 </TableRow>
               ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-neutral-500 italic">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.current_stock <= product.min_stock;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-50 p-2 rounded-lg">
                          <Package className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-700">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none uppercase text-[10px] font-bold">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.current_stock} {product.unit}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {product.min_stock} {product.unit}
                    </TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-full w-fit border border-red-100 animate-pulse">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          ESTOQUE CRÍTICO
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full w-fit border border-emerald-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           ESTOQUE OK
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setSelectedProduct(product);
                            setTransactionType('in');
                          }}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Entrada
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setSelectedProduct(product);
                            setTransactionType('out');
                          }}
                        >
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          Saída
                        </Button>
                        {onDeleteProduct && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDeleteProduct(product.id)}
                            title="Excluir Produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view: Card layout */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-neutral-100 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 h-10 w-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="flex justify-between border-t pt-2">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100 text-neutral-500 italic">
            Nenhum produto encontrado.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isLowStock = product.current_stock <= product.min_stock;
            return (
              <div 
                key={product.id} 
                className={cn(
                  "p-4 bg-white rounded-2xl border transition-all shadow-sm space-y-3",
                  isLowStock ? "border-red-200 bg-red-50/5" : "border-neutral-100"
                )}
              >
                {/* Top row: Icon, Name and Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      isLowStock ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none uppercase text-[8px] font-black tracking-wider px-1.5 py-0.5 mt-1">
                        {product.category || 'Sem Categoria'}
                      </Badge>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isLowStock ? (
                      <div className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                        <AlertTriangle className="h-3 w-3" />
                        CRÍTICO
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        OK
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle row: Stock counts */}
                <div className="flex items-center justify-between text-xs bg-slate-50/50 p-2.5 rounded-xl border border-neutral-100">
                  <div>
                    <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Estoque Atual</span>
                    <span className="font-bold text-slate-700">{product.current_stock} {product.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Estoque Mínimo</span>
                    <span className="font-bold text-slate-500">{product.min_stock} {product.unit}</span>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 border-[#E5E0D8] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs"
                    onClick={() => {
                      setSelectedProduct(product);
                      setTransactionType('in');
                    }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                    Entrada
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 border-[#E5E0D8] text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl font-bold text-xs"
                    onClick={() => {
                      setSelectedProduct(product);
                      setTransactionType('out');
                    }}
                  >
                    <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                    Saída
                  </Button>
                  {onDeleteProduct && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl shrink-0"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transaction Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {transactionType === 'in' ? (
                <ArrowUpRight className="h-5 w-5 text-teal-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-amber-600" />
              )}
              {transactionType === 'in' ? 'Registrar Entrada' : 'Registrar Saída/Uso'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <div className="p-3 bg-slate-50 rounded-lg border font-medium">
                {selectedProduct?.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade ({selectedProduct?.unit})</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="0.1" 
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo / Observação</Label>
              <TextArea 
                id="reason" 
                placeholder={transactionType === 'in' ? 'Ex: Compra com fornecedor X' : 'Ex: Uso em atendimento do cliente Y'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTransaction} 
              loading={isSubmitting}
              className={transactionType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              Confirmar {transactionType === 'in' ? 'Entrada' : 'Saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
