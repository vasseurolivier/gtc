
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRegisteredClientById, 
  updateRegisteredClientStatus, 
  updateRegisteredClientNumber,
  updateRegisteredClientPrefix,
  updateRegisteredClientCurrencyPreference,
  updateClientCredentials,
  deleteRegisteredClient,
  deleteProductList,
  deleteClientProduct,
  RegisteredClient 
} from '@/actions/registered-clients';
import { updateOrderStatus, updateOrderPaymentStatus, updateOrderTransportCost, deleteOrder, type PaymentStatus } from '@/actions/orders';
import { deleteQuote, Quote, updateQuoteStatus } from '@/actions/quotes';
import { deleteInvoice, Invoice } from '@/actions/invoices';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building, 
  ClipboardList, 
  Receipt, 
  ShoppingCart, 
  Eye, 
  Save, 
  CheckCircle2, 
  Package, 
  Plus, 
  Link as LinkIcon, 
  Star, 
  ChevronRight, 
  Trash2, 
  Pencil, 
  Scale, 
  Maximize, 
  UploadCloud, 
  X, 
  PlayCircle, 
  ImageIcon, 
  Sparkles, 
  MapPin, 
  FileText, 
  History, 
  Clock, 
  AlertCircle, 
  Truck, 
  Check, 
  Tag, 
  Ruler, 
  Coins,
  ShieldAlert,
  Settings2,
  Lock,
  ShieldCheck,
  KeyRound,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getProducts, Product } from '@/actions/products';
import { uploadFile } from '@/actions/upload';
import { cn } from '@/lib/utils';
import { CurrencyContext } from '@/context/currency-context';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const currencyContext = useContext(CurrencyContext);
  const { exchangeRate } = currencyContext || { exchangeRate: 0.13 };

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  
  const [clientNumber, setClientNumber] = useState('');
  const [orderPrefix, setOrderPrefix] = useState('');
  const [currencyPreference, setCurrencyPreference] = useState<'EUR' | 'CNY' | 'BOTH'>('EUR');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcWeight, setCalcWeight] = useState(0);
  const [calcRate, setCalcRate] = useState(0);
  const [calcFixed, setCalcFixed] = useState(0);

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);
  const [pendingSourcingProducts, setPendingSourcingProducts] = useState<any[]>([]);
  const [isAggregationLoading, setIsAggregationLoading] = useState(false);
  
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [isInvoiceLinkDialogOpen, setIsInvoiceLinkDialogOpen] = useState(false);
  const [isQuoteLinkDialogOpen, setIsQuoteLinkDialogOpen] = useState(false);

  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);

  const [selectedOrderPreview, setSelectedOrderPreview] = useState<any | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);
  const [orderTransportInput, setOrderTransportInput] = useState('');
  const [isUpdatingOrderTransport, setIsUpdatingOrderTransport] = useState(false);

  const [editingMoqId, setEditingMoqId] = useState<string | null>(null);
  const [tempMoq, setTempMoq] = useState<string>('');

  useEffect(() => {
    if (!clientId) return;
    async function fetchData() {
      setIsLoading(true);
      try {
        const clientData = await getRegisteredClientById(clientId);
        const prods = await getProducts();
        const invs = await getDocs(collection(db!, 'invoices'));
        const qts = await getDocs(collection(db!, 'quotes'));
        
        if (clientData) {
          setClient(clientData);
          setClientNumber(clientData.clientNumber || '');
          setOrderPrefix(clientData.orderPrefix || '');
          setCurrencyPreference(clientData.currencyPreference || 'EUR');
          setLoginEmail(clientData.email || '');
          setLoginPassword(clientData.password || '');
        }
        setGlobalProducts(prods || []);
        setAllInvoices(invs.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
        setAllQuotes(qts.docs.map(d => ({ id: d.id, ...d.data() } as Quote)));
      } catch (error) {
        console.error("Fetch client error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [clientId, db]);

  const handleUpdateCredentials = async () => {
    if (!loginEmail) {
      toast({ variant: "destructive", title: "Erreur", description: "L'email est requis." });
      return;
    }
    setIsUpdatingCredentials(true);
    try {
      const result = await updateClientCredentials(clientId, loginEmail, loginPassword);
      if (result.success) {
        toast({ title: "Succès", description: "Accès mis à jour." });
      } else {
        toast({ variant: "destructive", title: "Erreur", description: result.message });
      }
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

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

  const linkedQuotesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: linkedQuotes } = useCollection(linkedQuotesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return collection(db, 'clients', clientId, 'invoices');
  }, [db, clientId]);
  const { data: linkedInvoices } = useCollection(invoicesQuery);

  const { activeOrders, archivedOrders, pendingOrdersCount } = useMemo(() => {
    if (!orders) return { activeOrders: [], archivedOrders: [], pendingOrdersCount: 0 };
    const active = orders.filter(o => o.status === 'processing' || o.status === 'validated' || o.status === 'shipped');
    const archived = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    const pending = orders.filter(o => o.status === 'processing').length;
    return { activeOrders: active, archivedOrders: archived, pendingOrdersCount: pending };
  }, [orders]);

  const sortedLinkedInvoices = useMemo(() => {
    if (!linkedInvoices) return [];
    return [...linkedInvoices].sort((a, b) => parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime());
  }, [linkedInvoices]);

  const sortedLinkedQuotes = useMemo(() => {
    if (!linkedQuotes) return [];
    return [...linkedQuotes].sort((a, b) => parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime());
  }, [linkedQuotes]);

  useEffect(() => {
    if (!db || !clientId || !productLists) return;
    async function aggregate() {
      setIsAggregationLoading(true);
      try {
        const published: any[] = [];
        const pending: any[] = [];
        for (const list of productLists!) {
          const prodCol = collection(db!, 'clients', clientId, 'productLists', list.id, 'products');
          const snap = await getDocs(prodCol);
          snap.forEach(doc => {
            const data = doc.data();
            const item = { ...data, id: doc.id, listName: list.name, listId: list.id };
            if (data.status === 'published') published.push(item);
            else pending.push(item);
          });
        }
        setPublishedProducts(published);
        setPendingSourcingProducts(pending);
      } catch (e) {
        console.error("Aggregation error:", e);
      } finally {
        setIsAggregationLoading(false);
      }
    }
    aggregate();
  }, [db, clientId, productLists]);

  const handleToggleStatus = async () => {
    if (!client) return;
    const newStatus = client.status === 'validated' ? 'pending' : 'validated';
    const result = await updateRegisteredClientStatus(clientId, newStatus);
    if (result.success) {
      setClient({ ...client, status: newStatus });
      toast({ title: result.message });
    }
  };

  const handleDeleteClientActual = async () => {
    if (!client) return;
    setIsDeletingClient(true);
    const result = await deleteRegisteredClient(clientId);
    if (result.success) {
      toast({ title: "Supprimé" });
      router.push('/admin/registered-clients');
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
      setIsDeletingClient(false);
    }
  };

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientNumber(clientId, clientNumber);
    if (result.success) toast({ title: "Mis à jour" });
    setIsSaving(false);
  };

  const handleUpdatePrefix = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientPrefix(clientId, orderPrefix);
    if (result.success) toast({ title: "Préfixe mis à jour" });
    setIsSaving(false);
  };

  const handleUpdateCurrencyPreference = async (pref: any) => {
    setIsSaving(true);
    const result = await updateRegisteredClientCurrencyPreference(clientId, pref);
    if (result.success) {
      setCurrencyPreference(pref);
      toast({ title: "Préférence devise enregistrée" });
    }
    setIsSaving(false);
  };

  const openCalculator = (order: any) => {
    const totalWeight = (order.items || []).reduce((sum: number, item: any) => sum + ((item.weight || 0) * item.quantity), 0);
    setCalcWeight(totalWeight);
    setIsCalcOpen(true);
  };

  const applyCalculatedCost = () => {
    const total = (calcWeight * calcRate) + calcFixed;
    setOrderTransportInput(total.toFixed(2));
    setIsCalcOpen(false);
  };

  const handleUpdateTransport = async () => {
    if (!selectedOrderPreview) return;
    const cost = parseFloat(orderTransportInput);
    if (isNaN(cost)) return;
    setIsUpdatingOrderTransport(true);
    const result = await updateOrderTransportCost(selectedOrderPreview.id, cost);
    setIsUpdatingOrderTransport(false);
    if (result.success) {
      toast({ title: "Transport mis à jour" });
      setSelectedOrderPreview({ ...selectedOrderPreview, transportCost: cost, totalAmount: result.newTotal });
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsMediaUploading(true);
    const newImages = [...(editingProduct?.images || [])];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('folder', `branding`);
      const result = await uploadFile(formData);
      if (result.success && result.url) newImages.push(result.url);
    }
    setEditingProduct({ ...editingProduct, images: newImages });
    setIsMediaUploading(false);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({ ...product });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !db) return;
    setIsSaving(true);
    try {
      const listId = editingProduct.listId || editingProduct.productListId;
      const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', editingProduct.id);
      await setDoc(productRef, { ...editingProduct, status: 'published', validatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Produit publié" });
      setIsProductDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProductActual = async (product: any) => {
    const result = await deleteClientProduct(clientId, product.productListId, product.id);
    if (result.success) toast({ title: "Supprimé" });
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-500">Livré</Badge>;
      case 'shipped': return <Badge className="bg-blue-500">Expédié</Badge>;
      case 'processing': return <Badge variant="outline">En cours</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild><Link href="/admin/registered-clients"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></Button>
        <div className="flex items-center gap-3">
          {client?.status === 'validated' ? <Badge className="bg-green-500">Validé</Badge> : <Badge variant="outline">En attente</Badge>}
          <Button size="sm" variant="outline" onClick={handleToggleStatus}>{client?.status === 'validated' ? 'Suspendre' : 'Valider'}</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle><AlertDialogDescription>Cette action est définitive.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDeleteClientActual}>Confirmer</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Profil Client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom</Label><div className="font-bold">{client?.firstName} {client?.lastName}</div></div>
              <div><Label>Email</Label><div>{client?.email}</div></div>
              <div className="pt-4 border-t space-y-3">
                <Label>Numéro Client</Label>
                <div className="flex gap-2"><Input value={clientNumber} onChange={e => setClientNumber(e.target.value)} /><Button size="sm" onClick={handleUpdateNumber}><Save className="h-4 w-4" /></Button></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="catalogue">
            <TabsList className="bg-white border p-1 h-12 rounded-xl mb-6">
              <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
              <TabsTrigger value="lists">Sourcing</TabsTrigger>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>

            <TabsContent value="catalogue">
              <Card><Table>
                <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Prix</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {publishedProducts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>¥{Number(p.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduct(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteProductActual(p)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {activeOrders.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-bold">{o.orderNumber}</TableCell>
                        <TableCell>{o.orderDate ? format(parseSafeDate(o.orderDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{getOrderStatusBadge(o.status)}</TableCell>
                        <TableCell className="text-right font-bold">¥{o.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card><CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email connexion</Label><Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Mot de passe</Label><Input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></div>
                </div>
                <Button onClick={handleUpdateCredentials} disabled={isUpdatingCredentials}>{isUpdatingCredentials ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />} Enregistrer</Button>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Éditer Produit</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Nom</Label><Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <Label>Prix (CNY)</Label><Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} />
                <Label>MOQ</Label><Input type="number" value={editingProduct.moq} onChange={e => setEditingProduct({...editingProduct, moq: e.target.value})} />
              </div>
              <div className="space-y-4">
                <Label>Description</Label><Textarea rows={10} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={handleSaveProduct}>Publier</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
