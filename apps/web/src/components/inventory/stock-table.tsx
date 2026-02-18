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
  TextArea
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
  Filter
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
  isLoading?: boolean;
}

export default function StockTable({ products, onTransaction, onAddProduct, isLoading = false }: StockTableProps) {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (existing filter logic)
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleTransaction = async () => {
     // ... (existing handler)
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
      {/* ... Search Bar ... */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar produto ou categoria..." 
            className="pl-10 h-10 bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 border-neutral-200 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border border-neutral-100 rounded-3xl bg-white overflow-hidden shadow-sm">
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
             // ... existing map

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
                        <div className="flex items-center gap-1.5 text-amber-600 font-medium text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Estoque Baixo
                        </div>
                      ) : (
                        <Badge variant="success" className="bg-teal-50 text-teal-700 border-none">
                          Normal
                        </Badge>
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
