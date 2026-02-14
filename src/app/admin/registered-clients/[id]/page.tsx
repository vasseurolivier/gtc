
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
  RegisteredClient 
} from '@/actions/registered-clients';
import { 
  updateOrderStatus, 
  updateOrderPaymentStatus, 
  updateOrderTransportCost,
  deleteOrder,
  Order,
  PaymentStatus
} from '@/actions/orders';
import { updateQuoteStatus, deleteQuote, Quote } from '@/actions/quotes';
import { deleteInvoice } from '@/actions/invoices';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, getDocs } from 'firebase/firestore';
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
  Globe,
  Truck
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const [shippingRate, setShippingRate] = useState<string>('0');
  const [shippingFee, setShippingFee] = useState<string>('0');

  // States for Orders Management
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<Order | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);
  const [isUpdatingTransport, setIsUpdatingTransport] = useState<string | null>(null);
  const [transportInputs, setTransportInputs] = useState<Record<string, string>>({});
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcWeight, setCalcWeight] = useState(0);
  const [calcRate, setCalcRate] = useState(0);
  const [calcFixed, setCalcFixed] = useState(0);
  const [calcTargetId, setCalcTargetId] = useState<string | null>(null);

  // States for Catalogue
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
          setLoginEmail(clientData.email || '');
          setLoginPassword(clientData.password || '');
          setShippingRate((clientData.shippingRatePerKg || 0).toString());
          setShippingFee((clientData.shippingFixedFee || 0).toString());
        }
        setGlobalProducts(productsData || []);
      } catch (error) {
        console.error("Fetch client error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [clientId]);

  // Queries
  const quotesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: quotes } = useCollection(quotesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'invoices'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const listsQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return collection(db, 'clients', clientId, 'productLists');
  }, [db, clientId]);
  const { data: productLists } = useCollection(listsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'orders'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: orders } = useCollection(ordersQuery);

  // Stats Calculation
  const stats = useMemo(() => {
    if (!orders || !invoices) return { totalOrders: 0, processingOrders: 0, totalRevenue: 0, pendingBalance: 0 };
    
    const totalOrders = orders.length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
      
    const pendingBalance = invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + ((Number(i.totalAmount) || 0) - (Number(i.amountPaid) || 0)), 0);
      
    return { totalOrders, processingOrders, totalRevenue, pendingBalance };
  }, [orders, invoices]);

  // Priority Sorting Logic (Actionable first, then date desc)
  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const priorityA = a.status === 'processing' ? 0 : 1;
      const priorityB = b.status === 'processing' ? 0 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [orders]);

  const sortedQuotes = useMemo(() => {
    if (!quotes) return [];
    return [...quotes].sort((a, b) => {
      const priorityA = (a.status === 'draft' || a.status === 'sent') ? 0 : 1;
      const priorityB = (b.status === 'draft' || b.status === 'sent') ? 0 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [quotes]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      const priorityA = (a.status !== 'paid' && a.status !== 'cancelled') ? 0 : 1;
      const priorityB = (b.status !== 'paid' && b.status !== 'cancelled') ? 0 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [invoices]);

  useEffect(() => {
    if (orders) {
      const inputs: Record<string, string> = {};
      orders.forEach(o => {
        inputs[o.id] = (o.transportCost || 0).toString();
      });
      setTransportInputs(inputs);
    }
  }, [orders]);

  // Handlers
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

  const handleUpdateTransportCost = async (orderId: string) => {
    const rawVal = transportInputs[orderId];
    const costValue = rawVal === "" ? 0 : parseFloat(rawVal || '0');
    if (isNaN(costValue)) return;
    setIsUpdatingTransport(orderId);
    const result = await updateOrderTransportCost(orderId, costValue);
    setIsUpdatingTransport(null);
    if (result.success) toast({ title: "Transport mis à jour" });
  };

  const handleDeleteOrderRow = async (id: string) => {
    const result = await deleteOrder(id);
    if (result.success) toast({ title: "Commande supprimée" });
  };

  const handleDeleteQuoteRow = async (id: string) => {
    const result = await deleteQuote(id);
    if (result.success) toast({ title: "Proforma supprimée" });
  };

  const handleDeleteInvoiceRow = async (id: string) => {
    const result = await deleteInvoice(id);
    if (result.success) toast({ title: "Facture supprimée" });
  };

  const openCalculator = (order: Order) => {
    const totalWeight = order.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);
    setCalcWeight(totalWeight);
    setCalcTargetId(order.id);
    // Use client defaults if available
    setCalcRate(parseFloat(shippingRate) || 0);
    setCalcFixed(parseFloat(shippingFee) || 0);
    setIsCalcOpen(true);
  };

  const applyCalculatedCost = () => {
    if (!calcTargetId) return;
    const total = (calcWeight * calcRate) + calcFixed;
    setTransportInputs(prev => ({ ...prev, [calcTargetId]: total.toFixed(2) }));
    setIsCalcOpen(false);
    toast({ title: "Calcul appliqué", description: "Cliquez sur l'icône (V) pour enregistrer." });
  };

  const handleNavigateToQuote = (orderId: string) => {
    router.push(`/admin/quotes?fromOrder=${orderId}`);
  };

  const aggregateProducts = async () => {
    if (!db || !clientId || !productLists) return;
    try {
      const published: any[] = [];
      for (const list of productLists!) {
        const prodCol = collection(db!, 'clients', clientId, 'productLists', list.id, 'products');
        const q = query(prodCol, where('status', '==', 'published'));
        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          published.push({ ...data, id: doc.id, listName: list.name, listId: list.id });
        });
      }
      setPublishedProducts(published);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    aggregateProducts();
  }, [db, clientId, productLists]);

  const handleEditProduct = (product: any) => {
    setEditingProduct({ 
      ...product, 
      hasSizeSelection: product.hasSizeSelection ?? false,
      availableSizes: product.availableSizes ?? [],
      availability: product.availability ?? 'both',
      moq: product.moq ?? 1,
      images: product.images ?? []
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveToGlobal = async (product: any) => {
    setIsExportingToGlobal(product.id);
    try {
      const result = await addProduct({
        name: product.name,
        sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
        description: product.description || '',
        price: Number(product.price || 0),
        purchasePrice: 0,
        stock: 0,
        category: 'Importé du client ' + (client?.firstName || ''),
        imageUrl: product.images?.[0] || '',
        weight: Number(product.weight || 0),
        height: 0,
        width: 0,
        length: 0,
      });
      if (result.success) {
        toast({ title: "Produit copié !", description: "L'article est désormais dans votre inventaire global." });
      } else {
        toast({ variant: "destructive", title: "Erreur", description: result.message });
      }
    } finally {
      setIsExportingToGlobal(null);
    }
  };

  const handleAddNewProduct = () => {
    if (!productLists || productLists.length === 0) {
      toast({ variant: "destructive", title: "Liste requise", description: "Veuillez créer une liste de produits pour ce client." });
      return;
    }
    setEditingProduct({
      id: `PROD-MANUAL-${Date.now()}`,
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      price: 0,
      description: '',
      images: [],
      availableSizes: [],
      hasSizeSelection: false,
      availability: 'both',
      moq: 1,
      listId: productLists[0].id,
      status: 'published',
      clientId: clientId
    });
    setIsProductDialogOpen(true);
  };

  const handleImportFromGlobal = (productId: string) => {
    const p = globalProducts.find(gp => gp.id === productId);
    if (p && editingProduct) {
      setEditingProduct({
        ...editingProduct,
        name: p.name,
        sku: p.sku,
        price: p.price,
        description: p.description || '',
        images: p.imageUrl ? [p.imageUrl] : [],
        weight: p.weight || 0,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newUrls = [...(editingProduct.images || [])];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('folder', `clients/${clientId}/catalogue`);
        const result = await uploadImage(formData);
        if (result.success && result.url) newUrls.push(result.url);
      }
      setEditingProduct({ ...editingProduct, images: newUrls });
    } finally { setIsUploading(false); }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !db) return;
    setIsSaving(true);
    try {
      const listId = editingProduct.listId || editingProduct.productListId;
      const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', editingProduct.id);
      await setDoc(productRef, { 
        ...editingProduct, 
        status: 'published', 
        validatedAt: new Date().toISOString() 
      }, { merge: true });
      setIsProductDialogOpen(false);
      aggregateProducts();
      toast({ title: "Catalogue mis à jour" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleUpdateCredentials = async () => {
    setIsUpdatingCredentials(true);
    const result = await updateClientCredentials(clientId, loginEmail, loginPassword);
    if (result.success) toast({ title: "Identifiants mis à jour" });
    else toast({ variant: "destructive", title: "Erreur", description: result.message });
    setIsUpdatingCredentials(false);
  };

  const handleUpdateShippingRates = async () => {
    setIsSaving(true);
    const result = await updateClientShippingRates(clientId, parseFloat(shippingRate), parseFloat(shippingFee));
    if (result.success) {
      toast({ title: "Tarifs transport enregistrés" });
      setClient(prev => prev ? { ...prev, shippingRatePerKg: parseFloat(shippingRate), shippingFixedFee: parseFloat(shippingFee) } : null);
    }
    setIsSaving(false);
  };

  const handleToggleStatus = async () => {
    if (!client) return;
    const newStatus = client.status === 'validated' ? 'pending' : 'validated';
    const result = await updateRegisteredClientStatus(clientId, newStatus);
    if (result.success) setClient({ ...client, status: newStatus } as RegisteredClient);
  };

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientNumber(clientId, clientNumber);
    if (result.success) toast({ title: "Numéro client sauvé" });
    setIsSaving(false);
  };

  const handleCurrencyPrefChange = async (pref: 'EUR' | 'CNY' | 'BOTH') => {
    const result = await updateRegisteredClientCurrencyPreference(clientId, pref);
    if (result.success) {
      toast({ title: "Devise mise à jour" });
      setClient(prev => prev ? { ...prev, currencyPreference: pref } : null);
    }
  };

  const renderPrice = (priceCny: number, mainClass = "text-primary font-black") => {
    const priceEur = priceCny * rate;
    return (
      <div className="flex flex-col">
        <div className={mainClass}>€{priceEur.toFixed(2)}</div>
        <div className="text-[10px] text-zinc-400 font-bold">¥{priceCny.toFixed(2)}</div>
      </div>
    );
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild><Link href="/admin/registered-clients"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></Button>
        <div className="flex items-center gap-3">
          {client?.status === 'validated' ? <Badge className="bg-green-500">Compte Validé</Badge> : <Badge variant="outline">En attente de validation</Badge>}
          <Button size="sm" variant="outline" onClick={handleToggleStatus}>{client?.status === 'validated' ? 'Suspendre' : 'Valider'}</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Confirmer la suppression ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={async () => { await deleteRegisteredClient(clientId); router.push('/admin/registered-clients'); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* DASHBOARD METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.totalOrders}</div>
            <p className="text-[10px] text-zinc-400 mt-1">Depuis l'inscription</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">¥{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-400 mt-1">Sur factures payées</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Solde à percevoir</CardTitle>
            <Euro className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600">¥{stats.pendingBalance.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-400 mt-1">En-cours client total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Demandes actives</CardTitle>
            <CircleAlert className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-orange-600">{stats.processingOrders}</div>
            <p className="text-[10px] text-zinc-400 mt-1">Commandes en traitement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100"><CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Identité Client</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-inner">{client?.firstName?.charAt(0)}</div>
                <div>
                  <div className="font-black text-xl text-zinc-900 leading-none">{client?.firstName} {client?.lastName}</div>
                  <div className="text-xs text-zinc-400 mt-1 font-bold italic">Client depuis {client?.createdAt ? format(new Date(client.createdAt), 'yyyy') : '-'}</div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-sm font-medium"><Mail className="h-4 w-4 text-zinc-300" /> {client?.email}</div>
                <div className="flex items-center gap-3 text-sm font-medium"><Phone className="h-4 w-4 text-zinc-300" /> {client?.phone || 'Non renseigné'}</div>
                
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Préférence Devise</Label>
                  <Select value={client?.currencyPreference || 'EUR'} onValueChange={(val: any) => handleCurrencyPrefChange(val)}>
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euros (€) uniquement</SelectItem>
                      <SelectItem value="CNY">Yuans (¥) uniquement</SelectItem>
                      <SelectItem value="BOTH">Les deux (EUR & ¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-4"><Label className="text-[10px] font-black uppercase text-zinc-400">N° Dossier</Label><Input value={clientNumber} onChange={e => setClientNumber(e.target.value)} className="h-8 font-black text-primary" /><Button size="sm" variant="outline" onClick={handleUpdateNumber} disabled={isSaving} className="h-8 w-8 p-0"><Save className="h-4 w-4" /></Button></div>
                
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2"><Truck className="h-3 w-3" /> Base de calcul transport</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-zinc-500">Prix / kg (CNY)</Label>
                      <Input type="number" step="0.01" value={shippingRate} onChange={e => setShippingRate(e.target.value)} className="h-8 text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-zinc-500">Fixe (CNY)</Label>
                      <Input type="number" step="0.01" value={shippingFee} onChange={e => setShippingFee(e.target.value)} className="h-8 text-xs font-bold" />
                    </div>
                  </div>
                  <Button size="sm" className="w-full h-8 text-[10px] font-black" onClick={handleUpdateShippingRates} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                    ENREGISTRER TARIFS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList className="bg-white border p-1 h-12 rounded-xl mb-6 w-full justify-start overflow-x-auto shadow-sm">
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="quotes">Proformas</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="pl-6">Order #</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-center">Port (CNY)</TableHead>
                        <TableHead className="text-center">Paiement</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.map(order => {
                        const isTransportDirty = (transportInputs[order.id] || "0") !== (order.transportCost || 0).toString();
                        const linkedQuote = sortedQuotes.find(q => q.orderId === order.id);
                        const isLocked = linkedQuote && (linkedQuote.status === 'accepted' || linkedQuote.status === 'paid');
                        return (
                          <TableRow key={order.id} className={cn(order.status === 'processing' && "bg-primary/5")}>
                            <TableCell className="font-black pl-6">
                              <div className="flex items-center gap-2">{order.orderNumber}{isLocked && <ShieldCheck className="h-3 w-3 text-green-600" />}</div>
                            </TableCell>
                            <TableCell>
                              <Select onValueChange={(val: any) => handleStatusChange(order.id, val)} defaultValue={order.status}>
                                <SelectTrigger className="h-8 w-32 text-[10px] font-bold uppercase"><Badge variant="outline" className="border-none">{order.status}</Badge></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="validated">Validated</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              {!isLocked ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400" onClick={() => openCalculator(order)}><Calculator className="h-3.5 w-3.5" /></Button>
                                  <Input type="number" className="w-16 h-7 text-xs text-center font-bold" value={transportInputs[order.id] || ''} onChange={e => setTransportInputs({...transportInputs, [order.id]: e.target.value})} />
                                  <Button size="icon" variant={isTransportDirty ? "default" : "ghost"} className="h-7 w-7" onClick={() => handleUpdateTransportCost(order.id)} disabled={isUpdatingTransport === order.id}>{isUpdatingTransport === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}</Button>
                                </div>
                              ) : <span className="font-black text-xs">¥{order.transportCost?.toFixed(2)}</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <Select onValueChange={(val: PaymentStatus) => handlePaymentStatusChange(order.id, val)} defaultValue={order.paymentStatus}>
                                <SelectTrigger className="h-8 w-32 text-[10px] font-black">
                                  {order.paymentStatus === 'paid' ? <Badge className="bg-green-500 text-[8px]">PAYÉ</Badge> : order.paymentStatus === 'deposit_paid' ? <Badge variant="outline" className="text-blue-600 text-[8px] border-blue-200">ACOMPTE</Badge> : <Badge variant="outline" className="text-zinc-400 text-[8px]">NON PAYÉ</Badge>}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unpaid">Non payé</SelectItem>
                                  <SelectItem value="deposit_paid">Acompte payé</SelectItem>
                                  <SelectItem value="paid">Total payé</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">{renderPrice(order.totalAmount, "font-black text-zinc-900")}</TableCell>
                            <TableCell className="text-right pr-6 space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedOrderPreview(order); setIsOrderPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                              <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tighter" onClick={() => handleNavigateToQuote(order.id)}><Sparkles className="h-3 w-3 mr-1" /> {linkedQuote ? "Gérer PI" : "Générer PI"}</Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle><AlertDialogDescription>Cela supprimera la commande définitivement du système.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOrderRow(order.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotes">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow><TableHead className="pl-6">N° PI</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedQuotes.map(q => (
                        <TableRow key={q.id} className={cn((q.status === 'draft' || q.status === 'sent') && "bg-primary/5")}>
                          <TableCell className="font-black pl-6">{q.quoteNumber}</TableCell>
                          <TableCell className="text-xs font-medium text-zinc-400">{format(parseSafeDate(q.issueDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell><Badge variant={q.status === 'accepted' || q.status === 'paid' ? 'default' : q.status === 'rejected' ? 'destructive' : 'outline'} className="text-[9px] uppercase font-black">{q.status}</Badge></TableCell>
                          <TableCell className="text-right font-black">¥{q.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right pr-6 space-x-1">
                            <Button variant="ghost" size="icon" asChild><Link href={`/admin/quotes/${q.id}`}><Eye className="h-4 w-4" /></Link></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Supprimer la Proforma ?</AlertDialogTitle><AlertDialogDescription>Ce document sera supprimé partout.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteQuoteRow(q.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow><TableHead className="pl-6">N° INV</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedInvoices.map(i => (
                        <TableRow key={i.id} className={cn(i.status !== 'paid' && "bg-red-50/20")}>
                          <TableCell className="font-black pl-6">{i.invoiceNumber}</TableCell>
                          <TableCell className="text-xs font-medium text-zinc-400">{format(parseSafeDate(i.issueDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell><Badge className={cn("text-[9px] font-black uppercase", i.status === 'paid' ? 'bg-green-500' : 'bg-red-500')}>{i.status}</Badge></TableCell>
                          <TableCell className="text-right font-black">¥{i.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right pr-6 space-x-1">
                            <Button variant="ghost" size="icon" asChild><Link href={`/admin/invoices/${i.id}`}><Eye className="h-4 w-4" /></Link></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Supprimer la Facture ?</AlertDialogTitle><AlertDialogDescription>Ce document sera supprimé partout.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvoiceRow(i.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalogue">
              <div className="flex justify-end mb-4"><Button onClick={handleAddNewProduct} className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4 mr-2" /> Ajouter manuel</Button></div>
              <Card className="border-none shadow-md bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50"><TableRow><TableHead className="w-16 pl-6">Photo</TableHead><TableHead>Produit</TableHead><TableHead>Prix</TableHead><TableHead>Tailles</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {publishedProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6"><div className="w-10 h-10 rounded-lg border overflow-hidden shadow-inner">{p.images?.[0] ? <img src={p.images[0]} className="object-contain w-full h-full" alt="" /> : <Package className="h-4 w-4 text-zinc-200 mx-auto mt-3" />}</div></TableCell>
                        <TableCell className="font-black text-sm"><div className="flex flex-col"><span>{p.name}</span><span className="text-[9px] text-zinc-400 font-mono tracking-tighter">{p.sku}</span></div></TableCell>
                        <TableCell className="font-bold">¥{Number(p.price || 0).toFixed(2)}</TableCell>
                        <TableCell>{p.hasSizeSelection ? <div className="flex flex-wrap gap-1">{p.availableSizes?.map((s:string) => <Badge key={s} variant="secondary" className="text-[8px] h-4 font-black">{s}</Badge>)}</div> : <span className="text-zinc-300 text-xs italic">Taille unique</span>}</TableCell>
                        <TableCell className="text-right pr-6 space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-500" 
                            onClick={() => handleSaveToGlobal(p)}
                            disabled={isExportingToGlobal === p.id}
                            title="Copier vers catalogue global"
                          >
                            {isExportingToGlobal === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(p)} title="Modifier"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={async () => { await deleteClientProduct(clientId, p.listId, p.id); aggregateProducts(); }} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-none shadow-md bg-white">
                <CardHeader><CardTitle className="text-lg">Accès Client</CardTitle><CardDescription>Identifiants de connexion du client.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="font-black text-[10px] uppercase text-zinc-400">Email Login</Label><Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="font-black text-[10px] uppercase text-zinc-400">Mot de passe</Label><Input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></div>
                  </div>
                  <Button onClick={handleUpdateCredentials} disabled={isUpdatingCredentials} className="font-black uppercase text-[10px] tracking-widest">{isUpdatingCredentials ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />} Enregistrer les modifications</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter text-xl">Calculateur Transport</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-sm font-medium">
            <div className="space-y-2"><Label>Poids Total (kg)</Label><Input type="number" value={calcWeight} onChange={e => setCalcWeight(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-2">
              <Label>Tarif par kg (CNY)</Label>
              <Input type="number" value={calcRate} onChange={e => setCalcRate(parseFloat(e.target.value) || 0)} />
              {client?.shippingRatePerKg && calcRate === client.shippingRatePerKg && <p className="text-[10px] text-green-600 font-bold italic">Utilisation du tarif client par défaut</p>}
            </div>
            <div className="space-y-2">
              <Label>Frais fixes (CNY)</Label>
              <Input type="number" value={calcFixed} onChange={e => setCalcFixed(parseFloat(e.target.value) || 0)} />
              {client?.shippingFixedFee && calcFixed === client.shippingFixedFee && <p className="text-[10px] text-green-600 font-bold italic">Utilisation des frais client par défaut</p>}
            </div>
            <div className="pt-4 border-t font-black flex justify-between items-center text-lg"><span>TOTAL :</span><span className="text-primary text-2xl">¥{((calcWeight * calcRate) + calcFixed).toFixed(2)}</span></div>
          </div>
          <DialogFooter><Button onClick={applyCalculatedCost} className="w-full font-black uppercase text-xs h-12">Appliquer le montant</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tighter text-2xl"><FileText className="text-primary h-6 w-6" /> Détail Commande {selectedOrderPreview?.orderNumber}</DialogTitle></DialogHeader>
          {selectedOrderPreview && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-50 rounded-3xl border shadow-inner">
                <div><Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Client</Label><div className="font-black text-xl">{selectedOrderPreview.customerName}</div></div>
                <div className="text-right"><Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total Final</Label><div className="text-3xl font-black text-primary">¥{selectedOrderPreview.totalAmount.toFixed(2)}</div></div>
              </div>
              <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-zinc-50"><TableRow><TableHead className="w-16 pl-6">Photo</TableHead><TableHead>Article</TableHead><TableHead className="text-center">Qté</TableHead><TableHead className="text-right pr-6">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedOrderPreview.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-6"><div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-white shadow-sm">{item.photo ? <img src={item.photo} className="object-contain w-full h-full" alt="" /> : <Package className="h-4 w-4 text-zinc-200" />}</div></TableCell>
                        <TableCell className="font-bold text-sm"><div>{item.description}</div>{item.sku && <div className="text-[10px] text-zinc-400 font-mono tracking-tighter mt-1">{item.sku}</div>}</TableCell>
                        <TableCell className="text-center font-black">{item.quantity}</TableCell>
                        <TableCell className="text-right font-black pr-6">¥{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="font-black text-[10px] uppercase text-zinc-400 tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> Adresse Livraison</Label><div className="p-4 bg-white border rounded-xl text-sm font-medium whitespace-pre-wrap shadow-sm">{selectedOrderPreview.shippingAddress}</div></div>
                <div className="space-y-2"><Label className="font-black text-[10px] uppercase text-zinc-400 tracking-widest flex items-center gap-2"><CreditCard className="h-3 w-3 text-primary" /> Paiement</Label><div className="p-4 bg-white border rounded-xl flex items-center gap-3 font-black shadow-sm">{selectedOrderPreview.paymentStatus === 'paid' ? <Badge className="bg-green-500">PAYÉ</Badge> : <Badge variant="outline">{selectedOrderPreview.paymentStatus}</Badge>}</div></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" className="w-full font-black h-12" onClick={() => setIsOrderPreviewOpen(false)}>Fermer l'aperçu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter text-2xl">Catalogue Client</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="space-y-8 py-4">
              <div className="p-6 bg-primary/5 border-2 border-primary/10 rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="flex items-center gap-3 text-primary shrink-0"><Sparkles className="h-6 w-6" /><Label className="font-black text-xs uppercase tracking-widest">Importer Global :</Label></div>
                <Select onValueChange={handleImportFromGlobal}>
                  <SelectTrigger className="bg-white border-zinc-200 h-12 font-bold"><SelectValue placeholder="Choisir un produit de l'inventaire principal..." /></SelectTrigger>
                  <SelectContent>{globalProducts.map(gp => <SelectItem key={gp.id} value={gp.id}>{gp.name} ({gp.sku})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div><Label className="font-black text-[10px] uppercase text-zinc-400">Nom Commercial</Label><Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="h-12 font-bold" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="font-black text-[10px] uppercase text-zinc-400">SKU</Label><Input value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="h-12 font-mono" /></div>
                    <div><Label className="font-black text-[10px] uppercase text-zinc-400">Prix Vente (CNY)</Label><Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="h-12 font-black text-primary" /></div>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <Label className="font-black text-xs uppercase text-zinc-600">Configuration Options</Label>
                    <div className="space-y-4 p-4 bg-zinc-50 rounded-2xl border">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400">Disponibilité</Label>
                        <RadioGroup 
                          value={editingProduct.availability} 
                          onValueChange={(val) => setEditingProduct({...editingProduct, availability: val})}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center space-x-2"><RadioGroupItem value="both" id="both" /><Label htmlFor="both" className="text-xs cursor-pointer">Les deux (Standard &amp; Perso)</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="standard_only" id="std_only" /><Label htmlFor="std_only" className="text-xs cursor-pointer">Standard uniquement</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="personalized_only" id="perso_only" /><Label htmlFor="perso_only" className="text-xs cursor-pointer">Personnalisé uniquement</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400">MOQ Personnalisation</Label>
                        <Input type="number" value={editingProduct.moq} onChange={e => setEditingProduct({...editingProduct, moq: Number(e.target.value)})} className="h-8" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-center justify-between"><Label className="font-black text-xs uppercase text-zinc-600">Activer choix tailles ?</Label><Switch checked={editingProduct.hasSizeSelection} onCheckedChange={checked => setEditingProduct({...editingProduct, hasSizeSelection: checked})} /></div>
                    {editingProduct.hasSizeSelection && (
                      <div className="flex flex-wrap gap-3 p-4 bg-zinc-50 rounded-2xl border">
                        {SIZES.map(s => (
                          <div key={s} className="flex items-center gap-2"><Checkbox id={`sz-${s}`} checked={editingProduct.availableSizes?.includes(s)} onCheckedChange={checked => {
                            const sizes = [...(editingProduct.availableSizes || [])];
                            if (checked) { if (!sizes.includes(s)) sizes.push(s); }
                            else { const i = sizes.indexOf(s); if (i > -1) sizes.splice(i, 1); }
                            setEditingProduct({...editingProduct, availableSizes: sizes});
                          }} /><Label htmlFor={`sz-${s}`} className="font-black text-xs cursor-pointer">{s}</Label></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className="font-black text-[10px] uppercase text-zinc-400">Visuels &amp; Media</Label>
                  <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 rounded-2xl border">
                    {editingProduct.images?.map((url: string, i: number) => (
                      <div key={i} className="relative aspect-square border-2 border-white rounded-xl bg-white group shadow-sm overflow-hidden">
                        <img src={url} className="w-full h-full object-contain" alt="" />
                        <button type="button" onClick={() => { const ni = [...editingProduct.images]; ni.splice(i, 1); setEditingProduct({...editingProduct, images: ni}); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-primary transition-all group">
                      <UploadCloud className="h-6 w-6 text-zinc-300 group-hover:text-primary transition-colors" /><span className="text-[8px] font-black uppercase mt-1 text-zinc-400 group-hover:text-primary">Upload</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {isUploading && <div className="flex items-center gap-2 text-xs text-primary font-bold animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Téléchargement des images...</div>}
                  <div><Label className="font-black text-[10px] uppercase text-zinc-400">Description Technique</Label><Textarea rows={6} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="font-medium text-sm" /></div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t mt-6"><DialogClose asChild><Button variant="ghost" className="font-bold">Annuler</Button></DialogClose><Button onClick={handleSaveProduct} disabled={isSaving || isUploading} className="bg-primary hover:bg-primary/90 font-black uppercase text-xs h-12 px-10 shadow-lg shadow-primary/20">{isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />} Publier au Catalogue Client</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
