
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
  updateClientShippingRates,
  updateClientExchangeRate,
  updateClientProduct,
  RegisteredClient 
} from '@/actions/registered-clients';
import { 
  updateOrderStatus, 
  updateOrderPaymentStatus, 
  updateOrderFinancials,
  deleteOrder,
  Order,
  PaymentStatus,
} from '@/actions/orders';
import { updateQuoteStatus, deleteQuote, Quote, syncQuoteFromOrder } from '@/actions/quotes';
import { deleteInvoice } from '@/actions/invoices';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  Save, 
  ShieldCheck,
  FileText,
  Eye,
  Plus,
  Calculator,
  Check,
  RefreshCw,
  Mail,
  Lock,
  Euro,
  Truck,
  Sparkles,
  CircleAlert,
  Globe,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CurrencyContext } from '@/context/currency-context';
import { cn } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const currencyContext = useContext(CurrencyContext);

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientRate, setClientRate] = useState('');
  const [shippingRate, setShippingRate] = useState('');
  const [shippingFixed, setShippingFixed] = useState('');

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

  const [allSourcingProducts, setAllSourcingProducts] = useState<any[]>([]);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState<string | null>(null);

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
        const clientData = await getRegisteredClientById(clientId);
        if (clientData) {
          setClient(clientData);
          setClientEmail(clientData.email || '');
          setClientPassword(clientData.password || '');
          setClientNumber(clientData.clientNumber || '');
          setClientRate(clientData.exchangeRate?.toString() || '');
          setShippingRate(clientData.shippingRatePerKg?.toString() || '0');
          setShippingFixed(clientData.shippingFixedFee?.toString() || '0');
        }
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
    return [...orders].sort((a, b) => parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime());
  }, [orders]);

  const sortedQuotes = useMemo(() => {
    if (!quotes) return [];
    return [...quotes].sort((a, b) => parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime());
  }, [quotes]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime());
  }, [invoices]);

  useEffect(() => {
    if (orders) {
      const t: Record<string, string> = {}; 
      const c: Record<string, string> = {}; 
      const b: Record<string, 'products_only' | 'total'> = {};
      orders.forEach(o => {
        t[o.id] = (o.transportCost || 0).toString();
        c[o.id] = (o.commissionRate || 0).toString();
        b[o.id] = o.commissionBasis || 'products_only';
      });
      setTransportInputs(t); 
      setCommissionInputs(c); 
      setBasisInputs(b);
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
    if (res.success) toast({ title: "PI mise à jour" });
  };

  const handleUpdateCredentials = async () => {
    setIsSaving(true);
    const res = await updateClientCredentials(clientId, clientEmail, clientPassword);
    if (res.success) toast({ title: "Identifiants mis à jour" });
    setIsSaving(false);
  };

  const handleUpdateClientRate = async () => {
    setIsSaving(true);
    const res = await updateClientExchangeRate(clientId, parseFloat(clientRate));
    if (res.success) toast({ title: "Taux de change client mis à jour" });
    setIsSaving(false);
  };

  const handleUpdateShippingRates = async () => {
    setIsSaving(true);
    const res = await updateClientShippingRates(clientId, parseFloat(shippingRate), parseFloat(shippingFixed));
    if (res.success) toast({ title: "Tarifs de transport enregistrés" });
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
    if (res.success) toast({ title: "Numéro client enregistré" });
    setIsSaving(false);
  };

  const handleDeleteOrderAction = async (id: string) => {
    const res = await deleteOrder(id);
    if (res.success) toast({ title: "Commande supprimée" });
  };

  const handleDeleteQuoteAction = async (id: string) => {
    const res = await deleteQuote(id);
    if (res.success) toast({ title: "Proforma supprimée" });
  };

  const handleDeleteInvoiceAction = async (id: string) => {
    const res = await deleteInvoice(id);
    if (res.success) toast({ title: "Facture supprimée" });
  };

  const aggregateProducts = async () => {
    if (!db || !clientId || !productLists) return;
    const all: any[] = [];
    for (const list of productLists!) {
      const prodCol = collection(db!, 'clients', clientId, 'productLists', list.id, 'products');
      const snap = await getDocs(prodCol);
      snap.forEach(d => all.push({ ...d.data(), id: d.id, listId: list.id }));
    }
    setAllSourcingProducts(all);
  };

  useEffect(() => { aggregateProducts(); }, [db, clientId, productLists]);

  const handleUpdateProductData = async (productId: string, listId: string, data: any) => {
    setIsUpdatingProduct(productId);
    const res = await updateClientProduct(clientId, listId, productId, data);
    setIsUpdatingProduct(null);
    if (res.success) {
      toast({ title: "Produit mis à jour" });
      aggregateProducts();
    }
  };

  const openCalculator = (order: Order) => {
    const totalWeight = order.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);
    setCalcWeight(totalWeight);
    setCalcTargetId(order.id);
    setCalcRate(parseFloat(shippingRate) || 0);
    setCalcFixed(parseFloat(shippingFixed) || 0);
    setIsCalcOpen(true);
  };

  const applyCalculatedCost = () => {
    if (!calcTargetId) return;
    const total = (calcWeight * calcRate) + calcFixed;
    setTransportInputs(prev => ({ ...prev, [calcTargetId]: total.toFixed(2) }));
    setIsCalcOpen(false);
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') router.push('/admin/login');
  }, [router]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'shipped': return 'secondary';
        case 'validated': return 'default';
        case 'processing': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'outline';
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
        case 'paid': return <Badge className="bg-green-500 text-[10px] h-5">PAYÉ</Badge>;
        case 'deposit_paid': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] h-5">ACOMPTE OK</Badge>;
        case 'unpaid': return <Badge variant="outline" className="text-zinc-400 text-[10px] h-5">NON PAYÉ</Badge>;
        default: return null;
    }
  };

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
            <CardHeader className="bg-zinc-50 border-b border-zinc-100"><CardTitle className="text-sm font-black uppercase text-zinc-400">Identité & Sécurité</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl">{client?.firstName?.charAt(0)}</div>
                <div className="font-black text-xl">{client?.firstName} {client?.lastName}</div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Email de connexion</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
                      <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="h-8 pl-7 text-xs font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Mot de passe</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
                      <Input type="text" value={clientPassword} onChange={e => setClientPassword(e.target.value)} className="h-8 pl-7 text-xs font-bold" placeholder="Nouveau mot de passe" />
                    </div>
                  </div>
                </div>

                <Button size="sm" className="w-full h-8 bg-zinc-900 text-white" onClick={handleUpdateCredentials} disabled={isSaving}>
                  <Save className="h-3 w-3 mr-2" /> Mettre à jour les accès
                </Button>

                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Taux de change spécifique (CNY &rarr; Devise)</Label>
                  <div className="flex gap-2">
                    <Input type="number" step="0.0001" value={clientRate} onChange={e => setClientRate(e.target.value)} className="h-8 font-black text-blue-600" placeholder="ex: 0.1320" />
                    <Button size="sm" variant="outline" className="h-8" onClick={handleUpdateClientRate} disabled={isSaving}><Save className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Paramètres Transport</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[8px] uppercase">Prix / kg (¥)</Label>
                      <Input type="number" step="0.01" value={shippingRate} onChange={e => setShippingRate(e.target.value)} className="h-8 text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] uppercase">Frais fixe (¥)</Label>
                      <Input type="number" step="0.01" value={shippingFixed} onChange={e => setShippingFixed(e.target.value)} className="h-8 text-xs font-bold" />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-8 mt-2" onClick={handleUpdateShippingRates} disabled={isSaving}>
                    <Save className="h-3 w-3 mr-2" /> Sauver les tarifs
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <div className="flex-grow space-y-1">
                    <Label className="text-[10px] font-black uppercase text-zinc-400">N° Client</Label>
                    <Input value={clientNumber} onChange={e => setClientNumber(e.target.value)} className="h-8 font-black text-primary" />
                  </div>
                  <Button size="sm" variant="outline" onClick={handleUpdateNumber} className="h-8 self-end"><Save className="h-4 w-4" /></Button>
                </div>
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
              <TabsTrigger value="catalogue">Sourcing & Catalogue</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card className="border-none shadow-md bg-white overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="pl-6">Order #</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Port (CNY)</TableHead>
                        <TableHead>Comm (%)</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.map(o => {
                        const linkedPI = sortedQuotes.find(q => q.orderId === o.id);
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="font-black pl-6">{o.orderNumber}</TableCell>
                            <TableCell>
                                <Select 
                                    onValueChange={(value: Order['status']) => handleStatusChange(o.id, value)} 
                                    defaultValue={o.status}
                                >
                                    <SelectTrigger className="w-28 h-7 text-[10px]">
                                        <Badge variant={getStatusBadgeVariant(o.status)} className="h-4 text-[8px] uppercase">{o.status}</Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="processing">En cours</SelectItem>
                                        <SelectItem value="validated">Validé</SelectItem>
                                        <SelectItem value="shipped">Expédié</SelectItem>
                                        <SelectItem value="delivered">Livré</SelectItem>
                                        <SelectItem value="cancelled">Annulé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Input type="number" className="w-16 h-7 text-xs font-bold" value={transportInputs[o.id] || ''} onChange={e => setTransportInputs({...transportInputs, [o.id]: e.target.value})} />
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCalculator(o)}><Calculator className="h-3 w-3" /></Button>
                              </div>
                            </TableCell>
                            <TableCell><Input type="number" className="w-12 h-7 text-xs font-bold" value={commissionInputs[o.id] || ''} onChange={e => setCommissionInputs({...commissionInputs, [o.id]: e.target.value})} /></TableCell>
                            <TableCell>
                                <Select 
                                    defaultValue={o.paymentStatus} 
                                    onValueChange={(value: PaymentStatus) => handlePaymentStatusChange(o.id, value)}
                                >
                                    <SelectTrigger className="w-32 h-7 text-[10px]">
                                        {getPaymentBadge(o.paymentStatus)}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unpaid">Non payé</SelectItem>
                                        <SelectItem value="deposit_paid">Acompte</SelectItem>
                                        <SelectItem value="paid">Payé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-right font-black text-xs">¥{o.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-right pr-6 space-x-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 bg-green-50" onClick={() => handleUpdateFinance(o.id)} disabled={isUpdatingFinance === o.id} title="Sauver"><Check className="h-4 w-4 text-green-600" /></Button>
                              
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-7 px-2 text-[10px] font-bold"
                                onClick={() => router.push(`/admin/quotes?fromOrder=${o.id}`)}
                              >
                                {linkedPI ? "Gérer PI" : "Générer PI"}
                              </Button>

                              {linkedPI && <Button variant="ghost" size="icon" className="text-primary h-7 w-7" onClick={() => handleSyncPI(o.id)} disabled={isSyncingPI === o.id} title="Sync documents liés"><RefreshCw className="h-4 w-4" /></Button>}
                              
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedOrderPreview(o); setIsOrderPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 h-7 w-7"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible et supprimera définitivement les données.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteOrderAction(o.id)}>Supprimer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                        <TableCell className="text-right pr-6 space-x-1">
                          <Button variant="ghost" size="icon" asChild title="Voir PDF"><Link href={`/admin/quotes/${q.id}`} target="_blank"><Eye className="h-4 w-4" /></Link></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Supprimer la proforma ?</AlertDialogTitle><AlertDialogDescription>Action irréversible.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteQuoteAction(q.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card className="border-none shadow-md bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50"><TableRow><TableHead className="pl-6">Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sortedInvoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-black pl-6">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs">{format(parseSafeDate(inv.issueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><Badge variant={inv.status === 'paid' ? 'default' : 'outline'}>{inv.status}</Badge></TableCell>
                        <TableCell className="text-right pr-6 space-x-1">
                          <Button variant="ghost" size="icon" asChild><Link href={`/admin/invoices/${inv.id}`} target="_blank"><Eye className="h-4 w-4" /></Link></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle><AlertDialogDescription>Action irréversible.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteInvoiceAction(inv.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="catalogue">
              <Card className="border-none shadow-md bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">Produit</TableHead>
                      <TableHead>Prix Manuels (¥ / €)</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSourcingProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] && <div className="w-10 h-10 rounded border overflow-hidden"><img src={p.images[0]} className="object-cover w-full h-full" alt="" /></div>}
                            <div>
                              <div className="font-bold text-sm">{p.name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">{p.sku || 'SANS SKU'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 items-center">
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">¥</span>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="CNY"
                                className="h-8 pl-5 text-xs font-bold" 
                                defaultValue={p.price || ''} 
                                onBlur={(e) => handleUpdateProductData(p.id, p.listId, { price: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">€</span>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="EUR"
                                className="h-8 pl-5 text-xs font-bold text-blue-600" 
                                defaultValue={p.priceEur || ''} 
                                onBlur={(e) => handleUpdateProductData(p.id, p.listId, { priceEur: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            defaultValue={p.status || 'pending'} 
                            onValueChange={(val) => handleUpdateProductData(p.id, p.listId, { status: val })}
                          >
                            <SelectTrigger className="h-8 w-32 text-[10px] font-bold uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En analyse</SelectItem>
                              <SelectItem value="published">Publié (Catalog)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500" 
                            onClick={async () => { await deleteClientProduct(clientId, p.listId, p.id); aggregateProducts(); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails Commande</DialogTitle>
            <DialogDescription>Aperçu des articles et de la livraison.</DialogDescription>
          </DialogHeader>
          {selectedOrderPreview && (
            <div className="space-y-4 py-4">
              <p className="font-bold">Commande {selectedOrderPreview.orderNumber}</p>
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-center">Qté</TableHead><TableHead className="text-right">Total (¥)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selectedOrderPreview.items.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">¥{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Fermer</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Calculateur de Frais d'Envoi</DialogTitle>
            <DialogDescription>Calculez le coût basé sur le poids total de la commande.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Poids Total (kg)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={calcWeight} 
                onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Tarif fixe par kg (CNY)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={calcRate} 
                onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Frais fixes dossier (CNY)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={calcFixed} 
                onChange={(e) => setCalcFixed(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Total calculé :</span>
                <span className="text-xl text-primary">¥{((calcWeight * calcRate) + calcFixed).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={applyCalculatedCost}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
