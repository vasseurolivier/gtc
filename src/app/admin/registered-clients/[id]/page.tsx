'use client';

import { useState, useEffect, useContext, useMemo, useRef } from 'react';
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
  addClientProduct,
  updateRegisteredClientCurrencyPreference,
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
import { getProducts, Product as GlobalProduct } from '@/actions/products';
import { sendChatMessage, deleteChatMessage, markMessagesAsRead } from '@/actions/messages';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, getDocs, addDoc, serverTimestamp, setDoc, orderBy } from 'firebase/firestore';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Truck,
  Sparkles,
  Package,
  Pencil,
  PlusCircle,
  Hash,
  ShoppingCart,
  CheckCircle2,
  X,
  MapPin,
  Building2,
  Home,
  ImageIcon,
  UploadCloud,
  Search,
  Minus,
  Percent as PercentIcon,
  SortAsc,
  MessageSquare,
  Send,
  Coins,
  CreditCard,
  FileSearch
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { CurrencyContext } from '@/context/currency-context';
import { uploadImage } from '@/actions/upload';
import { cn } from '@/lib/utils';

const WAREHOUSE_3PL_ADDRESS = "Entrepot GTC china";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const currencyContext = useContext(CurrencyContext);
  const exchangeRate = currencyContext?.exchangeRate || 0.13;

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientRate, setClientRate] = useState('');
  const [currencyPref, setCurrencyPref] = useState<'EUR' | 'CNY' | 'BOTH'>('BOTH');
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

  const [isAdminCreatingOrder, setIsAdminCreatingOrder] = useState(false);
  const [adminBasket, setAdminBasket] = useState<any[]>([]);
  const [orderSuffix, setOrderSuffix] = useState('');
  const [adminOrderTransport, setAdminOrderTransport] = useState('0');
  const [adminOrderCommission, setAdminOrderCommission] = useState('0');
  const [adminOrderBasis, setAdminOrderBasis] = useState<'products_only' | 'total'>('products_only');
  const [adminOrderAddress, setAdminOrderAddress] = useState('');
  const [isSubmittingAdminOrder, setIsSubmittingAdminOrder] = useState(false);

  const [globalProducts, setGlobalProducts] = useState<GlobalProduct[]>([]);
  const [allSourcingProducts, setAllSourcingProducts] = useState<any[]>([]);
  const [sortBySourcing, setSortBySourcing] = useState('date_desc');
  const [isUpdatingProduct, setIsUpdatingProduct] = useState<string | null>(null);
  const [editingProductData, setEditingProductData] = useState<any | null>(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [addProductMode, setAddProductMode] = useState<'global' | 'manual'>('global');
  const [isUploading, setIsUploading] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

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
        case 'paid': return <Badge className="bg-green-500 text-[10px] h-5">SOLDE PAYÉ</Badge>;
        case 'deposit_paid': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] h-5">ACOMPTE OK</Badge>;
        case 'unpaid': return <Badge variant="outline" className="text-zinc-400 text-[10px] h-5">NON PAYÉ</Badge>;
        default: return null;
    }
  };

  useEffect(() => {
    if (!clientId) return;
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientData, fetchedGlobalProducts] = await Promise.all([
          getRegisteredClientById(clientId),
          getProducts()
        ]);
        
        if (clientData) {
          setClient(clientData);
          setClientEmail(clientData.email || '');
          setClientPassword(clientData.password || '');
          setClientNumber(clientData.clientNumber || '');
          setClientRate(clientData.exchangeRate?.toString() || '');
          setCurrencyPref(clientData.currencyPreference || 'BOTH');
          setShippingRate(clientData.shippingRatePerKg?.toString() || '0');
          setShippingFixed(clientData.shippingFixedFee?.toString() || '0');
          setAdminOrderAddress(clientData.address || '');
          setAdminOrderCommission('0'); 
        }
        setGlobalProducts(fetchedGlobalProducts || []);
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

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'clients', clientId, 'messages'), orderBy('createdAt', 'asc'));
  }, [db, clientId]);
  const { data: chatMessages } = useCollection(messagesQuery);

  useEffect(() => {
    if (activeTab === 'messages' && clientId && chatMessages && chatMessages.some(m => !m.isAdmin && !m.read)) {
      markMessagesAsRead(clientId, true);
    }
  }, [activeTab, clientId, chatMessages]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  const handleUpdateCurrencyPreference = async (val: 'EUR' | 'CNY' | 'BOTH') => {
    setIsSaving(true);
    const res = await updateRegisteredClientCurrencyPreference(clientId, val);
    if (res.success) {
      setCurrencyPref(val);
      toast({ title: "Préférence de devise mise à jour" });
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMessage) return;
    setIsSendingMessage(true);
    const result = await sendChatMessage(clientId, {
      senderId: 'admin',
      senderName: 'Agent GTC',
      text: chatInput.trim(),
      isAdmin: true
    });
    if (result.success) setChatInput('');
    setIsSendingMessage(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const res = await deleteChatMessage(clientId, msgId);
    if (res.success) toast({ title: "Message supprimé" });
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

  const sortedSourcingProducts = useMemo(() => {
    let result = [...allSourcingProducts];
    result.sort((a, b) => {
      switch (sortBySourcing) {
        case 'date_desc':
          return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        case 'date_asc':
          return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sku':
          return (a.sku || '').localeCompare(b.sku || '');
        default:
          return 0;
      }
    });
    return result;
  }, [allSourcingProducts, sortBySourcing]);

  const handleUpdateProductData = async (productId: string, listId: string, data: any) => {
    setIsUpdatingProduct(productId);
    const res = await updateClientProduct(clientId, listId, productId, data);
    setIsUpdatingProduct(null);
    if (res.success) {
      toast({ title: "Produit mis à jour" });
      aggregateProducts();
    }
  };

  const handleOpenEditProduct = (product: any) => {
    setIsCreatingNewProduct(false);
    setEditingProductData({ 
      ...product, 
      images: product.images || [],
      availableSizes: product.availableSizes || [],
      hasSizeSelection: !!product.hasSizeSelection,
      availability: product.availability || 'both'
    });
    setIsEditProductOpen(true);
  };

  const handleOpenAddProduct = () => {
    setIsCreatingNewProduct(true);
    setAddProductMode('global');
    setEditingProductData({
      name: '',
      sku: '',
      description: '',
      price: 0,
      priceEur: 0,
      images: [],
      status: 'published',
      availability: 'both',
      hasSizeSelection: false,
      availableSizes: [],
      moq: 1,
      weight: 0,
      hsCode: '',
      length: 0,
      width: 0,
      height: 0
    });
    setIsEditProductOpen(true);
  };

  const handleGlobalProductSelect = (productId: string) => {
    const p = globalProducts.find(gp => gp.id === productId);
    if (p) {
      setEditingProductData({
        ...editingProductData,
        name: p.name,
        sku: p.sku,
        description: p.description || '',
        price: p.price,
        priceEur: p.price * (parseFloat(clientRate) || currencyContext?.exchangeRate || 0.13),
        images: p.imageUrl ? [p.imageUrl] : [],
        weight: p.weight || 0,
        hsCode: p.hsCode || '',
        length: p.length || 0,
        width: p.width || 0,
        height: p.height || 0
      });
    }
  };

  const handleSaveProductEdit = async () => {
    if (!editingProductData || !db) return;
    setIsSaving(true);
    
    try {
      if (isCreatingNewProduct) {
        let targetListId = productLists?.[0]?.id;
        if (!targetListId) {
          const newListId = `LST-MANUAL-${Date.now()}`;
          await setDoc(doc(db, 'clients', clientId, 'productLists', newListId), {
            id: newListId,
            clientId,
            name: "Catalogue Privé",
            description: "Produits ajoutés manuellement par l'administrateur.",
            createdAt: new Date().toISOString()
          });
          targetListId = newListId;
        }
        
        const res = await addClientProduct(clientId, targetListId, editingProductData);
        if (res.success) {
          toast({ title: "Produit créé et ajouté au catalogue" });
          setIsEditProductOpen(false);
          aggregateProducts();
        } else {
          toast({ variant: "destructive", title: "Erreur", description: res.message });
        }
      } else {
        const res = await updateClientProduct(clientId, editingProductData.listId, editingProductData.id, editingProductData);
        if (res.success) {
          toast({ title: "Fiche produit mise à jour" });
          setIsEditProductOpen(false);
          aggregateProducts();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `clients/${clientId}/sourcing`);
    const res = await uploadImage(formData);
    if (res.success && res.url) {
      setEditingProductData((prev: any) => ({
        ...prev,
        images: [...(prev.images || []), res.url]
      }));
    }
    setIsUploading(false);
  };

  const openCalculator = (orderOrBasket: Order | any[]) => {
    if (Array.isArray(orderOrBasket)) {
      const totalWeight = orderOrBasket.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);
      setCalcWeight(totalWeight);
      setCalcTargetId(null);
    } else {
      const totalWeight = orderOrBasket.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);
      setCalcWeight(totalWeight);
      setCalcTargetId(orderOrBasket.id);
    }
    setCalcRate(parseFloat(shippingRate) || 0);
    setCalcFixed(parseFloat(shippingFixed) || 0);
    setIsCalcOpen(true);
  };

  const applyCalculatedCost = () => {
    const total = (calcWeight * calcRate) + calcFixed;
    if (calcTargetId) {
      setTransportInputs(prev => ({ ...prev, [calcTargetId]: total.toFixed(2) }));
    } else {
      setAdminOrderTransport(total.toFixed(2));
    }
    setIsCalcOpen(false);
  };

  const addToAdminBasket = (product: any) => {
    const existing = adminBasket.find(i => i.id === product.id);
    if (existing) {
      setAdminBasket(adminBasket.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setAdminBasket([...adminBasket, {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        quantity: 1,
        unitPrice: product.price || 0,
        unitPriceEur: product.priceEur || 0,
        photo: product.images?.[0] || '',
        weight: product.weight || 0,
        hasSizeSelection: product.hasSizeSelection,
        availableSizes: product.availableSizes || [],
        selectedSize: product.availableSizes?.[0] || null,
        customDescription: ''
      }]);
    }
    toast({ title: "Produit ajouté au panier admin" });
  };

  const handleConfirmAdminOrder = async () => {
    if (!db || adminBasket.length === 0 || !orderSuffix) return;
    if (!clientId) return;
    setIsSubmittingAdminOrder(true);
    try {
      const prefix = client?.orderPrefix || 'ORD';
      const orderNumber = `${prefix}${orderSuffix.toUpperCase()}`;
      
      const itemsTotalCny = adminBasket.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
      const transport = parseFloat(adminOrderTransport) || 0;
      const commissionRateValue = parseFloat(adminOrderCommission) || 0;
      
      let finalTotal = 0;
      if (adminOrderBasis === 'total') {
        finalTotal = (itemsTotalCny + transport) * (1 + commissionRateValue / 100);
      } else {
        finalTotal = itemsTotalCny * (1 + commissionRateValue / 100) + transport;
      }

      const orderData = {
        orderNumber,
        customerId: clientId,
        customerName: `${client?.firstName} ${client?.lastName}`,
        items: adminBasket.map(item => ({
          description: (item.customDescription || item.name) + (item.selectedSize ? ` (${item.selectedSize})` : ''),
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitPriceEur: item.unitPriceEur || 0,
          purchasePrice: 0, 
          total: item.quantity * item.unitPrice,
          photo: item.photo,
          size: item.selectedSize || null,
          isPersonalized: false,
          weight: item.weight || 0
        })),
        totalAmount: finalTotal,
        status: 'processing' as const,
        shippingAddress: adminOrderAddress,
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        paymentStatus: 'unpaid' as any,
        transportCost: transport,
        commissionRate: commissionRateValue,
        commissionBasis: adminOrderBasis
      };

      await addDoc(collection(db, 'orders'), orderData);
      toast({ title: "Commande créée pour le client" });
      setAdminBasket([]);
      setOrderSuffix('');
      setIsAdminCreatingOrder(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur lors de la création" });
    } finally {
      setIsSubmittingAdminOrder(false);
    }
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

  const renderPriceText = (priceCny: number, mainClass = "text-primary font-black") => {
    const priceEur = priceCny * exchangeRate;
    return (
      <div className="flex flex-col">
        <div className={mainClass}>€{priceEur.toFixed(2)}</div>
        <div className="text-[10px] text-zinc-400 font-bold">¥{priceCny.toFixed(2)}</div>
      </div>
    );
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
          <Button onClick={() => setIsAdminCreatingOrder(true)} className="bg-zinc-900 text-white font-bold h-10 px-4 text-[10px] uppercase tracking-widest">
            <PlusCircle className="h-4 w-4 mr-2" /> Nouvelle Commande
          </Button>
          <Button onClick={() => router.push(`/admin/quotes?clientId=${clientId}`)} className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest h-10">
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
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Affichage des Devises</Label>
                  <div className="flex gap-2">
                    <Select value={currencyPref} onValueChange={(val: any) => handleUpdateCurrencyPreference(val)}>
                      <SelectTrigger className="h-8 text-xs font-bold">
                        <Coins className="h-3 w-3 mr-2 text-primary" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EURO (€)</SelectItem>
                        <SelectItem value="CNY">YUAN (¥)</SelectItem>
                        <SelectItem value="BOTH">LES DEUX (€ / ¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400">Taux de change (CNY &rarr; Devise)</Label>
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
          <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border p-1 h-12 rounded-xl mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="quotes">Proformas</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="catalogue">Sourcing & Catalogue</TabsTrigger>
              <TabsTrigger value="messages" className="relative">
                Messages
                {chatMessages && chatMessages.some((m:any) => !m.isAdmin && !m.read) && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
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
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Input type="number" className="w-12 h-7 text-xs font-bold" value={commissionInputs[o.id] || ''} onChange={e => setCommissionInputs({...commissionInputs, [o.id]: e.target.value})} />
                                <Select value={basisInputs[o.id] || 'products_only'} onValueChange={(v: 'products_only'|'total') => setBasisInputs({...basisInputs, [o.id]: v})}>
                                  <SelectTrigger className="w-8 h-7 p-0 flex justify-center">
                                    <PercentIcon className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="products_only" className="text-[10px]">Sur produits</SelectItem>
                                    <SelectItem value="total" className="text-[10px]">Sur total (+port)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
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
                                  <AlertDialogHeader><AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
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
                        <TableCell><Badge variant={q.status === 'accepted' || q.status === 'paid' ? 'default' : q.status === 'rejected' ? 'destructive' : 'outline'}>{q.status}</Badge></TableCell>
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
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div className="flex items-center gap-3">
                  <SortAsc className="h-4 w-4 text-zinc-400" />
                  <Select value={sortBySourcing} onValueChange={setSortBySourcing}>
                    <SelectTrigger className="h-9 w-40 bg-white border-zinc-200 font-bold text-xs">
                      <SelectValue placeholder="Trier par..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc" className="font-bold">Date (Récent)</SelectItem>
                      <SelectItem value="date_asc" className="font-bold">Date (Ancien)</SelectItem>
                      <SelectItem value="name" className="font-bold">Nom (A-Z)</SelectItem>
                      <SelectItem value="sku" className="font-bold">SKU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleOpenAddProduct} className="bg-primary hover:bg-primary/90 text-white font-bold h-9 text-xs">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un Produit
                </Button>
              </div>
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
                    {sortedSourcingProducts.map(p => (
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
                        <TableCell className="text-right pr-6 space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditProduct(p)} title="Modifier la fiche"><Pencil className="h-4 w-4" /></Button>
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

            <TabsContent value="messages">
              <Card className="border-none shadow-md bg-white flex flex-col h-[60vh]">
                <CardHeader className="bg-zinc-50 border-b p-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Conversation avec {client?.firstName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                  {chatMessages && chatMessages.length > 0 ? (
                    chatMessages.map((msg: any) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] group", msg.isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold uppercase text-zinc-400">{msg.isAdmin ? "Vous" : client?.firstName}</span>
                          <span className="text-[8px] text-zinc-300">{format(parseSafeDate(msg.createdAt), 'dd/MM HH:mm', { locale: fr })}</span>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all ml-2">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className={cn(
                          "p-3 rounded-xl text-xs leading-relaxed",
                          msg.isAdmin ? "bg-zinc-900 text-white rounded-tr-none" : "bg-zinc-100 text-zinc-800 rounded-tl-none border"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-300 italic text-sm">
                      Aucun historique de conversation.
                    </div>
                  )}
                </CardContent>
                <div className="p-4 border-t bg-zinc-50">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                      placeholder="Répondre au client..." 
                      className="bg-white h-10 text-xs" 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                    />
                    <Button type="submit" size="icon" disabled={!chatInput.trim() || isSendingMessage} className="bg-primary hover:bg-primary/90 h-10 w-10">
                      {isSendingMessage ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isAdminCreatingOrder} onOpenChange={setIsAdminCreatingOrder}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <ShoppingCart className="text-primary" /> Nouvelle Commande pour {client?.firstName}
            </DialogTitle>
            <DialogDescription>Sélectionnez les produits et configurez les détails logistiques et financiers.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Catalogue Privé</h4>
              <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                {allSourcingProducts.filter(p => p.status === 'published').map(p => (
                  <Card key={p.id} className="p-3 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded border bg-zinc-50 overflow-hidden shrink-0">
                        {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-contain" alt="" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs">{p.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{p.sku}</div>
                        <div className="text-[10px] font-bold text-primary mt-1">¥{p.price} / €{p.priceEur || (p.price * (currencyContext?.exchangeRate || 0.13)).toFixed(2)}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addToAdminBasket(p)} className="h-8 text-[10px] font-black">AJOUTER</Button>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Détails de la Commande</h4>
              
              <Card className="border-2 border-zinc-100 overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="pl-4">Article & Description</TableHead>
                        <TableHead className="text-center">Taille</TableHead>
                        <TableHead className="text-center">Qté</TableHead>
                        <TableHead className="text-right pr-4">Total</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminBasket.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-4 py-2 space-y-2">
                            <div>
                              <div className="font-bold text-xs">{item.name}</div>
                              <div className="text-[9px] text-zinc-400 font-mono">{item.sku}</div>
                            </div>
                            <Input 
                              placeholder="Description / Notes..." 
                              className="h-7 text-[10px] bg-zinc-50"
                              value={item.customDescription || ''}
                              onChange={(e) => {
                                const newBasket = [...adminBasket];
                                newBasket[idx].customDescription = e.target.value;
                                setAdminBasket(newBasket);
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {item.hasSizeSelection ? (
                              <Select 
                                value={item.selectedSize || ''} 
                                onValueChange={(val) => {
                                  const newBasket = [...adminBasket];
                                  newBasket[idx].selectedSize = val;
                                  setAdminBasket(newBasket);
                                }}
                              >
                                <SelectTrigger className="h-7 w-16 text-[9px] font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.availableSizes.map((s: string) => (
                                    <SelectItem key={s} value={s} className="text-[9px]">{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAdminBasket(adminBasket.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))}><Minus className="h-3 w-3"/></Button>
                              <Input 
                                type="number" 
                                className="h-7 w-12 text-center font-bold text-xs p-0"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setAdminBasket(adminBasket.map(i => i.id === item.id ? {...i, quantity: Math.max(1, val)} : i));
                                }}
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAdminBasket(adminBasket.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}><Plus className="h-3 w-3"/></Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">¥{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell className="pr-2">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-300 hover:text-red-500" onClick={() => setAdminBasket(adminBasket.filter(i => i.id !== item.id))}><Trash2 className="h-3 w-3"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400">Référence (Suffixe)</Label>
                    <div className="flex items-center">
                      <div className="h-9 px-2 bg-zinc-200 border border-r-0 rounded-l-md flex items-center justify-center font-black text-zinc-500 text-[10px]">
                        {client?.orderPrefix || 'ORD'}
                      </div>
                      <Input className="h-9 rounded-l-none font-bold uppercase text-xs" placeholder="ex: 2024-001" value={orderSuffix} onChange={(e) => setOrderSuffix(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400">Transport (¥)</Label>
                    <div className="flex gap-1">
                      <Input type="number" className="h-9 font-bold text-xs" value={adminOrderTransport} onChange={e => setAdminOrderTransport(e.target.value)} />
                      <Button size="icon" variant="ghost" className="h-9 w-9 bg-white border" onClick={() => openCalculator(adminBasket)}>
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2"><MapPin className="h-3 w-3" /> Lieu de Livraison</Label>
                  <div className="flex gap-2 mb-2">
                    <Button 
                      variant={adminOrderAddress === WAREHOUSE_3PL_ADDRESS ? "default" : "outline"} 
                      size="sm" 
                      className="h-7 text-[9px] font-black uppercase"
                      onClick={() => setAdminOrderAddress(WAREHOUSE_3PL_ADDRESS)}
                    >
                      <Building2 className="h-3 w-3 mr-1" /> Service 3PL
                    </Button>
                    <Button 
                      variant={adminOrderAddress === client?.address ? "default" : "outline"} 
                      size="sm" 
                      className="h-7 text-[9px] font-black uppercase"
                      onClick={() => setAdminOrderAddress(client?.address || '')}
                    >
                      <Home className="h-3 w-3 mr-1" /> Client (Defaut)
                    </Button>
                  </div>
                  <Textarea className="text-xs bg-white h-16" value={adminOrderAddress} onChange={e => setAdminOrderAddress(e.target.value)} placeholder="Adresse complète..." />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400">Commission (%)</Label>
                    <Input type="number" className="h-9 font-bold text-xs" value={adminOrderCommission} onChange={e => setAdminOrderCommission(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400">Base Commission</Label>
                    <Select value={adminOrderBasis} onValueChange={(val: any) => setAdminOrderBasis(val)}>
                      <SelectTrigger className="h-9 text-[10px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="products_only" className="text-[10px]">Produits uniquement</SelectItem>
                        <SelectItem value="total" className="text-[10px]">Total (Prod + Port)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-200 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Total Final Estimé</span>
                    <span className="text-xs text-zinc-400">Taux global: {currencyContext?.exchangeRate}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-primary">
                      ¥{(() => {
                        const it = adminBasket.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
                        const t = parseFloat(adminOrderTransport) || 0;
                        const cr = parseFloat(adminOrderCommission) || 0;
                        return adminOrderBasis === 'total' ? ((it + t) * (1 + cr / 100)).toFixed(2) : (it * (1 + cr / 100) + t).toFixed(2);
                      })()}
                    </div>
                    <div className="text-[10px] font-bold text-blue-600">
                      €{(() => {
                        const itEur = adminBasket.reduce((sum, i) => sum + (i.quantity * (i.unitPriceEur || (i.unitPrice * (currencyContext?.exchangeRate || 0.13)))), 0);
                        const tEur = (parseFloat(adminOrderTransport) || 0) * (currencyContext?.exchangeRate || 0.13);
                        const cr = parseFloat(adminOrderCommission) || 0;
                        return adminOrderBasis === 'total' ? ((itEur + tEur) * (1 + cr / 100)).toFixed(2) : (itEur * (1 + cr / 100) + tEur).toFixed(2);
                      })()}
                    </div>
                  </div>
                </div>

                <Button className="w-full h-12 bg-zinc-950 hover:bg-zinc-900 text-white font-black rounded-xl shadow-xl transition-all" onClick={handleConfirmAdminOrder} disabled={isSubmittingAdminOrder || adminBasket.length === 0 || !orderSuffix || !adminOrderAddress}>
                  {isSubmittingAdminOrder ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="h-5 w-5 mr-2" /> CRÉER LA COMMANDE</>}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreatingNewProduct ? 'Ajouter au Catalogue Client' : 'Modifier le Produit Client'}</DialogTitle>
            <DialogDescription>Configurez les détails techniques et options tarifaires.</DialogDescription>
          </DialogHeader>
          
          {isCreatingNewProduct && (
            <div className="bg-zinc-50 p-4 rounded-xl mb-4 border border-zinc-200">
              <RadioGroup value={addProductMode} onValueChange={(v:any) => setAddProductMode(v)} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="global" id="mode-global" />
                  <Label htmlFor="mode-global" className="font-bold cursor-pointer">Depuis le Catalogue Global</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="mode-manual" />
                  <Label htmlFor="mode-manual" className="font-bold cursor-pointer">Saisie Manuelle</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {editingProductData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-6">
                {isCreatingNewProduct && addProductMode === 'global' && (
                  <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Label className="font-black text-[10px] uppercase text-primary">Sélectionner un produit global</Label>
                    <Select onValueChange={handleGlobalProductSelect}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choisir un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {globalProducts.map(gp => (
                          <SelectItem key={gp.id} value={gp.id}>{gp.name} ({gp.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nom du produit</Label>
                    <Input value={editingProductData.name} onChange={e => setEditingProductData({...editingProductData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">SKU</Label>
                      <Input value={editingProductData.sku} onChange={e => setEditingProductData({...editingProductData, sku: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">MOQ (Perso)</Label>
                      <Input type="number" value={editingProductData.moq} onChange={e => setEditingProductData({...editingProductData, moq: parseInt(e.target.value) || 1})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Description technique</Label>
                    <Textarea rows={4} value={editingProductData.description} onChange={e => setEditingProductData({...editingProductData, description: e.target.value})} />
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border space-y-4">
                  <h4 className="font-black text-[10px] uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                    <Check className="h-3 w-3" /> Options Client
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Sélection de taille</Label>
                      <p className="text-[10px] text-zinc-500">Autoriser le choix d'une taille</p>
                    </div>
                    <Switch 
                      checked={editingProductData.hasSizeSelection} 
                      onCheckedChange={(checked) => setEditingProductData({...editingProductData, hasSizeSelection: checked})} 
                    />
                  </div>
                  {editingProductData.hasSizeSelection && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-[10px] font-bold uppercase">Tailles disponibles</Label>
                      <Input 
                        placeholder="ex: S, M, L, XL" 
                        value={editingProductData.availableSizes?.join(', ') || ''} 
                        onChange={(e) => setEditingProductData({
                          ...editingProductData, 
                          availableSizes: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')
                        })}
                      />
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Label className="text-sm font-bold">Type de vente</Label>
                    <Select 
                      value={editingProductData.availability} 
                      onValueChange={(val) => setEditingProductData({...editingProductData, availability: val})}
                    >
                      <SelectTrigger className="h-9 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard_only">Standard uniquement</SelectItem>
                        <SelectItem value="personalized_only">Personnalisé uniquement</SelectItem>
                        <SelectItem value="both">Standard & Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold">Images du produit</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {editingProductData.images?.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded border bg-muted group overflow-hidden">
                        <img src={img} className="w-full h-full object-contain" alt="" />
                        <button 
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditingProductData({...editingProductData, images: editingProductData.images.filter((_:any, i:number) => i !== idx)})}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Plus className="h-4 w-4 text-zinc-400" />}
                      <span className="text-[8px] font-bold mt-1 text-zinc-400">AJOUTER</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleProductImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="font-bold text-zinc-900">Prix CNY (¥)</Label>
                    <Input type="number" step="0.01" value={editingProductData.price} onChange={e => setEditingProductData({...editingProductData, price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-blue-600">Prix EUR (€)</Label>
                    <Input type="number" step="0.01" value={editingProductData.priceEur} onChange={e => setEditingProductData({...editingProductData, priceEur: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-black text-[10px] uppercase text-zinc-400 tracking-widest">Logistique & Douane</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-xs">Poids (kg)</Label><Input type="number" step="0.01" value={editingProductData.weight} onChange={e => setEditingProductData({...editingProductData, weight: parseFloat(e.target.value) || 0})} /></div>
                    <div className="space-y-1"><Label className="text-xs">HS Code</Label><Input value={editingProductData.hsCode} onChange={e => setEditingProductData({...editingProductData, hsCode: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><Label className="text-[10px]">L (cm)</Label><Input type="number" value={editingProductData.length} onChange={e => setEditingProductData({...editingProductData, length: parseFloat(e.target.value) || 0})} /></div>
                    <div className="space-y-1"><Label className="text-[10px]">W (cm)</Label><Input type="number" value={editingProductData.width} onChange={e => setEditingProductData({...editingProductData, width: parseFloat(e.target.value) || 0})} /></div>
                    <div className="space-y-1"><Label className="text-[10px]">H (cm)</Label><Input type="number" value={editingProductData.height} onChange={e => setEditingProductData({...editingProductData, height: parseFloat(e.target.value) || 0})} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
            <Button onClick={handleSaveProductEdit} disabled={isSaving || isUploading} className="bg-primary hover:bg-primary/90 font-bold">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isCreatingNewProduct ? 'Ajouter au catalogue' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-primary" /> Détails Commande {selectedOrderPreview?.orderNumber}
            </DialogTitle>
            <DialogDescription>Visualisez les articles, la logistique et le détail financier.</DialogDescription>
          </DialogHeader>
          {selectedOrderPreview && (
            <div className="space-y-8 py-4">
              <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border shadow-sm">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Statut Actuel</span>
                  <div><Badge variant={getStatusBadgeVariant(selectedOrderPreview.status)} className="h-6 px-3 uppercase text-[10px] font-black">{selectedOrderPreview.status}</Badge></div>
                </div>
                <div className="text-right space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Total Facturé</span>
                  <div>{renderPriceText(selectedOrderPreview.totalAmount, "text-3xl font-black text-primary")}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Articles de la commande
                </h4>
                <div className="border rounded-2xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow>
                        <TableHead className="w-20 pl-6">Photo</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qté</TableHead>
                        <TableHead className="text-right pr-6">Total (¥)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrderPreview.items?.map((item: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-zinc-50/30 transition-colors">
                          <TableCell className="py-3 pl-6">
                            <div className="w-14 h-14 rounded-xl border bg-white flex items-center justify-center overflow-hidden shadow-inner">
                              {item.photo ? (
                                <img src={item.photo} alt="Produit" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="h-6 w-6 text-zinc-200" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="font-bold text-zinc-900 leading-tight">{item.description}</div>
                            {item.sku && <div className="text-[10px] text-zinc-400 font-mono mt-1">{item.sku}</div>}
                          </TableCell>
                          <TableCell className="py-3 text-center font-black text-zinc-700">{item.quantity}</TableCell>
                          <TableCell className="py-3 text-right pr-6 font-bold text-zinc-900">¥{item.total?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Destination
                  </h4>
                  <div className={cn(
                    "p-5 rounded-2xl border min-h-[100px] text-sm leading-relaxed",
                    selectedOrderPreview.shippingAddress === WAREHOUSE_3PL_ADDRESS ? "bg-primary/5 border-primary/20" : "bg-white"
                  )}>
                    {selectedOrderPreview.shippingAddress === WAREHOUSE_3PL_ADDRESS && (
                      <Badge className="bg-primary mb-2">SERVICE 3PL GTC</Badge>
                    )}
                    <p className="whitespace-pre-wrap font-medium text-zinc-700">{selectedOrderPreview.shippingAddress || "Non renseignée"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Coins className="h-4 w-4" /> Détail Financier
                  </h4>
                  <div className="p-5 bg-zinc-900 text-white rounded-2xl shadow-xl space-y-3 border-none">
                    <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold">
                      <span>Statut Paiement</span>
                      <span>{getPaymentBadge(selectedOrderPreview.paymentStatus)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Frais de Port :</span>
                      <span className="font-black text-blue-400">¥{selectedOrderPreview.transportCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Commission ({selectedOrderPreview.commissionRate || 0}%) :</span>
                      <span className="font-black text-primary">¥{(() => {
                        const itemsTotal = selectedOrderPreview.items.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
                        const rateValue = (selectedOrderPreview.commissionRate || 0) / 100;
                        if (selectedOrderPreview.commissionBasis === 'total') {
                          return ((itemsTotal + (selectedOrderPreview.transportCost || 0)) * rateValue).toFixed(2);
                        }
                        return (itemsTotal * rateValue).toFixed(2);
                      })()}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-end pt-1">
                      <span className="font-black uppercase text-xs">Total TTC</span>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">¥{selectedOrderPreview.totalAmount?.toFixed(2)}</div>
                        <div className="text-xs font-bold text-zinc-400">€{(selectedOrderPreview.totalAmount * exchangeRate).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t mt-6">
            <Button variant="outline" className="w-full font-black h-12 rounded-xl" onClick={() => setIsOrderPreviewOpen(false)}>FERMER L'APERÇU</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Calculateur de Frais d'Envoi</DialogTitle>
            <DialogDescription>Calculez le coût basé sur le poids total.</DialogDescription>
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
