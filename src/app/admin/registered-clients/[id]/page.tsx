
'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRegisteredClientById, 
  updateRegisteredClientStatus, 
  updateRegisteredClientNumber,
  updateClientCredentials,
  deleteRegisteredClient,
  deleteClientProduct,
  updateRegisteredClientCurrencyPreference,
  updateClientShippingRates,
  updateClientCommissionBasis,
  updateClientExchangeRate,
  RegisteredClient 
} from '@/actions/registered-clients';
import { 
  updateOrderStatus, 
  updateOrderPaymentStatus, 
  updateOrderFinancials,
  deleteOrder,
  Order,
  PaymentStatus
} from '@/actions/orders';
import { updateQuoteStatus, deleteQuote, Quote, syncQuoteFromOrder } from '@/actions/quotes';
import { deleteInvoice } from '@/actions/invoices';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updateEmail, updatePassword, deleteUser } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  Pencil, 
  Package, 
  Save, 
  ShieldCheck,
  FileText,
  Receipt,
  Eye,
  Plus,
  UploadCloud,
  X,
  Calculator,
  Check,
  Sparkles,
  MapPin,
  CreditCard,
  Euro,
  TrendingUp,
  CircleAlert,
  ShoppingCart,
  Mail,
  Phone,
  Truck,
  Scale,
  RefreshCw,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CurrencyContext } from '@/context/currency-context';
import { uploadImage } from '@/actions/upload';
import { getProducts, Product, addProduct } from '@/actions/products';
import { cn } from '@/lib/utils';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const currencyContext = useContext(CurrencyContext);
  const rate = currencyContext?.exchangeRate || 0.13;

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [clientNumber, setClientNumber] = useState('');
  const [clientRate, setClientRate] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const [shippingRate, setShippingRate] = useState<string>('0');
  const [shippingFee, setShippingFee] = useState<string>('0');
  const [commissionBasis, setCommissionBasis] = useState<'products_only' | 'total'>('products_only');

  const [selectedOrderPreview, setSelectedOrderPreview] = useState<Order | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);
  const [isUpdatingFinance, setIsUpdatingFinance] = useState<string | null>(null);
  const [isSyncingPI, setIsSyncingPI] = useState<string | null>(null);
  const [transportInputs, setTransportInputs] = useState<Record<string, string>>({});
  const [commissionInputs, setCommissionInputs] = useState<Record<string, string>>({});
  const [basisInputs, setBasisInputs] = useState<Record<string, 'products_only' | 'total'>>({});
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcWeight, setCalcWeight] = useState(0);
  const [calcRate, setCalcRate] = useState(0);
  const [calcFixed, setCalcFixed] = useState(0);
  const [calcTargetId, setCalcTargetId] = useState<string | null>(null);

  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isExportingToGlobal, setIsExportingToGlobal] = useState<string | null>(null);

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  useEffect(() => {
    if (!clientId) return;
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientData, productsData] = await Promise.all([
          getRegisteredClientById(clientId),
          getProducts()
        ]);
        if (clientData) {
          setClient(clientData);
          setClientNumber(clientData.clientNumber || '');
          setClientRate(clientData.exchangeRate?.toString() || '');
          setLoginEmail(clientData.email || '');
          setLoginPassword(clientData.password || '');
          setShippingRate((clientData.shippingRatePerKg || 0).toString());
          setShippingFee((clientData.shippingFixedFee || 0).toString());
          setCommissionBasis(clientData.commissionBasis || 'products_only');
        }
        setGlobalProducts(productsData || []);
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [clientId]);

  const quotesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: quotes } = useCollection(quotesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return collection(db, 'clients', clientId, 'invoices');
  }, [db, clientId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const productListsQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return collection(db, 'clients', clientId, 'productLists');
  }, [db, clientId]);
  const { data: productLists } = useCollection(productListsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'orders'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: orders } = useCollection(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const pA = a.status === 'processing' ? 0 : 1;
      const pB = b.status === 'processing' ? 0 : 1;
      if (pA !== pB) return pA - pB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [orders]);

  const sortedQuotes = useMemo(() => {
    if (!quotes) return [];
    return [...quotes].sort((a, b) => {
      const pA = (a.status === 'draft' || a.status === 'sent') ? 0 : 1;
      const pB = (b.status === 'draft' || b.status === 'sent') ? 0 : 1;
      if (pA !== pB) return pA - pB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [quotes]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      const pA = a.status !== 'paid' ? 0 : 1;
      const pB = a.status !== 'paid' ? 0 : 1;
      if (pA !== pB) return pA - pB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [invoices]);

  useEffect(() => {
    if (orders) {
      const t = {}; const c = {}; const b = {};
      orders.forEach(o => {
        t[o.id] = (o.transportCost || 0).toString();
        c[o.id] = (o.commissionRate || 0).toString();
        b[o.id] = o.commissionBasis || 'products_only';
      });
      setTransportInputs(t); setCommissionInputs(c); setBasisInputs(b);
    }
  }, [orders]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) toast({ title: 'Statut mis à jour' });
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    const result = await updateOrderPaymentStatus(orderId, newStatus);
    if (result.success) {
      toast({ title: "Paiement mis à jour" });
      if (newStatus === 'paid') toast({ title: "Facture générée" });
    }
  };

  const handleUpdateFinance = async (orderId: string) => {
    const t = parseFloat(transportInputs[orderId] || '0');
    const c = parseFloat(commissionInputs[orderId] || '0');
    const b = basisInputs[orderId] || 'products_only';
    setIsUpdatingFinance(orderId);
    const res = await updateOrderFinancials(orderId, { transportCost: t, commissionRate: c, commissionBasis: b });
    setIsUpdatingFinance(null);
    if (res.success) toast({ title: "Données financières sauvées" });
  };

  const handleSyncPI = async (orderId: string) => {
    setIsSyncingPI(orderId);
    const res = await syncQuoteFromOrder(orderId);
    setIsSyncingPI(null);
    if (res.success) toast({ title: "PI mise à jour et renvoyée" });
  };

  const handleUpdateClientRate = async () => {
    setIsSaving(true);
    const res = await updateClientExchangeRate(clientId, parseFloat(clientRate));
    if (res.success) toast({ title: "Taux client mis à jour" });
    setIsSaving(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = client?.status === 'validated' ? 'pending' : 'validated';
    const res = await updateRegisteredClientStatus(clientId, newStatus);
    if (res.success) setClient({ ...client, status: newStatus } as RegisteredClient);
  };

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const res = await updateRegisteredClientNumber(clientId, clientNumber);
    if (res.success) toast({ title: "N° client sauvé" });
    setIsSaving(false);
  };

  const handleCurrencyPrefChange = async (pref: any) => {
    const res = await updateRegisteredClientCurrencyPreference(clientId, pref);
    if (res.success) {
      toast({ title: "Devise mise à jour" });
      setClient({ ...client, currencyPreference: pref } as RegisteredClient);
    }
  };

  const handleAddNewProduct = async () => {
    let listId = '';
    if (!productLists || productLists.length === 0) {
      setIsSaving(true);
      const lId = `LST-AUTO-${Date.now()}`;
      await setDoc(doc(db!, 'clients', clientId, 'productLists', lId), { id: lId, clientId, name: 'Catalogue par défaut', createdAt: new Date().toISOString() });
      listId = lId;
      setIsSaving(false);
    } else { listId = productLists[0].id; }
    setEditingProduct({ id: `PROD-${Date.now()}`, name: '', sku: `SKU-${Date.now().toString().slice(-6)}`, price: 0, listId, status: 'published', clientId });
    setIsProductDialogOpen(true);
  };

  const aggregateProducts = async () => {
    if (!db || !clientId || !productLists) return;
    const published: any[] = [];
    for (const list of productLists!) {
      const snap = await getDocs(query(collection(db!, 'clients', clientId, 'productLists', list.id, 'products'), where('status', '==', 'published')));
      snap.forEach(d => published.push({ ...d.data(), id: d.id, listId: list.id }));
    }
    setPublishedProducts(published);
  };

  useEffect(() => { aggregateProducts(); }, [db, clientId, productLists]);

  const handleSaveProduct = async () => {
    setIsSaving(true);
    try {
      const ref = doc(db!, 'clients', clientId, 'productLists', editingProduct.listId, 'products', editingProduct.id);
      await setDoc(ref, { ...editingProduct, status: 'published' }, { merge: true });
      setIsProductDialogOpen(false);
      aggregateProducts();
      toast({ title: "Catalogue à jour" });
    } finally { setIsSaving(false); }
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') router.push('/admin/login');
  }, [router]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild><Link href="/admin/registered-clients"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></Button>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push(`/admin/quotes?clientId=${clientId}`)} className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest">
            <Plus className="h-4 w-4 mr-2" /> Créer Proforma
          </Button>
          {client?.status === 'validated' ? <Badge className="bg-green-500">Compte Validé</Badge> : <Badge variant="outline">En attente</Badge>}
          <Button size="sm" variant="outline" onClick={handleToggleStatus}>{client?.status === 'validated' ? 'Suspendre' : 'Valider'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100"><CardTitle className="text-sm font-black uppercase text-zinc-400">Identité Client</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl">{client?.firstName?.charAt(0)}</div>
                <div className="font-black text-xl">{client?.firstName} {client?.lastName}</div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-zinc-300" /> {client?.email}</div>
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Taux de change spécifique (CNY -> Devise)</Label>
                  <div className="flex gap-2">
                    <Input type="number" step="0.0001" value={clientRate} onChange={e => setClientRate(e.target.value)} className="h-8 font-black text-blue-600" placeholder="ex: 0.1320" />
                    <Button size="sm" variant="outline" className="h-8" onClick={handleUpdateClientRate} disabled={isSaving}><Save className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-[9px] text-zinc-400 italic">* Utilisé pour les PI et Factures de ce client.</p>
                </div>
                <div className="flex items-center gap-2 pt-4"><Label className="text-[10px] font-black uppercase text-zinc-400">N° Client</Label><Input value={clientNumber} onChange={e => setClientNumber(e.target.value)} className="h-8 font-black text-primary" /><Button size="sm" variant="outline" onClick={handleUpdateNumber} className="h-8"><Save className="h-4 w-4" /></Button></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList className="bg-white border p-1 h-12 rounded-xl mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="quotes">Proformas</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="pl-6">Order #</TableHead>
                        <TableHead>Port (CNY)</TableHead>
                        <TableHead>Comm (%)</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.map(o => {
                        const linkedPI = sortedQuotes.find(q => q.orderId === o.id);
                        const isLocked = linkedPI && (linkedPI.status === 'accepted' || linkedPI.status === 'paid');
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="font-black pl-6">{o.orderNumber}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Input type="number" className="w-16 h-7 text-xs font-bold" value={transportInputs[o.id]} onChange={e => setTransportInputs({...transportInputs, [o.id]: e.target.value})} />
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCalculator(o)}><Calculator className="h-3 w-3" /></Button>
                              </div>
                            </TableCell>
                            <TableCell><Input type="number" className="w-12 h-7 text-xs font-bold" value={commissionInputs[o.id]} onChange={e => setCommissionInputs({...commissionInputs, [o.id]: e.target.value})} /></TableCell>
                            <TableCell>
                              <Select value={basisInputs[o.id]} onValueChange={v => setBasisInputs({...basisInputs, [o.id]: v})}>
                                <SelectTrigger className="h-7 w-16 text-[8px] font-black uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="products_only" className="text-[10px]">Prod</SelectItem><SelectItem value="total" className="text-[10px]">Total</SelectItem></SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-black">¥{o.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-right pr-6 space-x-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 bg-green-50" onClick={() => handleUpdateFinance(o.id)} disabled={isUpdatingFinance === o.id}><Check className="h-4 w-4 text-green-600" /></Button>
                              {linkedPI && <Button variant="ghost" size="icon" className="text-primary animate-pulse" onClick={() => handleSyncPI(o.id)} disabled={isSyncingPI === o.id}><RefreshCw className="h-4 w-4" /></Button>}
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedOrderPreview(o); setIsOrderPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotes">
              <Card className="border-none shadow-md bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50"><TableRow><TableHead className="pl-6">PI #</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sortedQuotes.map(q => (
                      <TableRow key={q.id}>
                        <TableCell className="font-black pl-6">{q.quoteNumber}</TableCell>
                        <TableCell className="text-xs">{format(parseSafeDate(q.issueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><Badge variant={q.status === 'accepted' || q.status === 'paid' ? 'default' : 'outline'}>{q.status}</Badge></TableCell>
                        <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" asChild><Link href={`/admin/quotes/${q.id}`} target="_blank"><Eye className="h-4 w-4" /></Link></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="catalogue">
              <div className="flex justify-end mb-4"><Button onClick={handleAddNewProduct} size="sm"><Plus className="h-4 w-4 mr-2" /> Ajouter manuel</Button></div>
              <Card className="border-none shadow-md bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50"><TableRow><TableHead className="pl-6">Produit</TableHead><TableHead>Prix (CNY)</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {publishedProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold pl-6">{p.name}</TableCell>
                        <TableCell className="font-black">¥{p.price?.toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="text-red-500" onClick={async () => { await deleteClientProduct(clientId, p.listId, p.id); aggregateProducts(); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Édition Catalogue Client</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nom Commercial</Label><Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SKU</Label><Input value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} /></div>
                <div className="space-y-2"><Label>Prix Vente (CNY)</Label><Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={handleSaveProduct} disabled={isSaving}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Calculateur Transport</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="space-y-2"><Label>Poids Total (kg)</Label><Input type="number" value={calcWeight} onChange={e => setCalcWeight(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Tarif par kg (CNY)</Label><Input type="number" value={calcRate} onChange={e => setCalcRate(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Frais fixes (CNY)</Label><Input type="number" value={calcFixed} onChange={e => setCalcFixed(parseFloat(e.target.value) || 0)} /></div>
            <div className="pt-4 border-t font-black flex justify-between items-center text-lg"><span>TOTAL :</span><span className="text-primary">¥{((calcWeight * calcRate) + calcFixed).toFixed(2)}</span></div>
          </div>
          <DialogFooter><Button onClick={applyCalculatedCost} className="w-full">Appliquer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
