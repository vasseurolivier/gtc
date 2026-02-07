
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
import { createQuoteFromOrder, getQuotes, deleteQuote, Quote } from '@/actions/quotes';
import { deleteInvoice, getInvoices, Invoice } from '@/actions/invoices';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getProducts, Product } from '@/actions/products';
import { uploadFile } from '@/actions/upload';
import { cn } from '@/lib/utils';
import { CurrencyContext } from '@/context/currency-context';

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
  
  // Security states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  // Calculator states
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

  // MOQ inline editing states
  const [editingMoqId, setEditingMoqId] = useState<string | null>(null);
  const [tempMoq, setTempMoq] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientData, prods, invs, qts] = await Promise.all([
          getRegisteredClientById(clientId),
          getProducts(),
          getInvoices(),
          getQuotes()
        ]);
        
        if (clientData) {
          setClient(clientData);
          setClientNumber(clientData.clientNumber || '');
          setOrderPrefix(clientData.orderPrefix || '');
          setCurrencyPreference(clientData.currencyPreference || 'EUR');
          setLoginEmail(clientData.email || '');
          setLoginPassword(clientData.password || '');
        }
        setGlobalProducts(prods || []);
        setAllInvoices(invs || []);
        setAllQuotes(qts || []);
      } catch (error) {
        console.error("Fetch detailed client error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [clientId]);

  const handleUpdateCredentials = async () => {
    if (!loginEmail) {
      toast({ variant: "destructive", title: "Erreur", description: "L'email est requis." });
      return;
    }
    setIsUpdatingCredentials(true);
    try {
      const result = await updateClientCredentials(clientId, loginEmail, loginPassword);
      if (result.success) {
        toast({ title: "Succès", description: "Identifiants de connexion mis à jour." });
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

  const quotesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: linkedQuotes } = useCollection(quotesQuery);

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
    
    const sortByDate = (a: any, b: any) => {
      const dateA = a.orderDate ? parseSafeDate(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? parseSafeDate(b.orderDate).getTime() : 0;
      return dateB - dateA;
    };

    return { 
      activeOrders: [...active].sort(sortByDate), 
      archivedOrders: [...archived].sort(sortByDate),
      pendingOrdersCount: pending
    };
  }, [orders]);

  const sortedLinkedInvoices = useMemo(() => {
    if (!linkedInvoices) return [];
    return [...linkedInvoices].sort((a, b) => {
      const isPendingA = a.status !== 'paid' ? 1 : 0;
      const isPendingB = b.status !== 'paid' ? 1 : 0;
      if (isPendingA !== isPendingB) return isPendingB - isPendingA;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [linkedInvoices]);

  const sortedLinkedQuotes = useMemo(() => {
    if (!linkedQuotes) return [];
    return [...linkedQuotes].sort((a, b) => {
      const isPendingA = (a.status !== 'accepted' && a.status !== 'paid') ? 1 : 0;
      const isPendingB = (b.status !== 'accepted' && b.status !== 'paid') ? 1 : 0;
      if (isPendingA !== isPendingB) return isPendingB - isPendingA;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
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
            if (data.status === 'published') {
              published.push(item);
            } else {
              pending.push(item);
            }
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
      toast({ title: "Succès", description: "Compte supprimé définitivement." });
      router.push('/admin/registered-clients');
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
      setIsDeletingClient(false);
    }
  };

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientNumber(clientId, clientNumber);
    if (result.success) {
      toast({ title: "Succès", description: "Numéro client mis à jour." });
    }
    setIsSaving(false);
  };

  const handleUpdatePrefix = async () => {
    if ((orderPrefix || '').length !== 2) {
      toast({ variant: "destructive", title: "Erreur", description: "Le préfixe doit faire exactement 2 lettres." });
      return;
    }
    setIsSaving(true);
    const result = await updateRegisteredClientPrefix(clientId, orderPrefix);
    if (result.success) {
      toast({ title: "Succès", description: "Préfixe de commande mis à jour." });
    }
    setIsSaving(false);
  };

  const handleUpdateCurrencyPreference = async (pref: 'EUR' | 'CNY' | 'BOTH') => {
    setIsSaving(true);
    const result = await updateRegisteredClientCurrencyPreference(clientId, pref);
    if (result.success) {
      setCurrencyPreference(pref);
      toast({ title: "Succès", description: "Préférence de devise enregistrée." });
    }
    setIsSaving(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      toast({ title: "Statut mis à jour", description: "La commande a été actualisée." });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    const result = await updateOrderPaymentStatus(orderId, newStatus);
    if (result.success) {
      toast({ title: "Paiement mis à jour", description: "Le statut a été enregistré." });
      if (newStatus === 'paid') {
        toast({ title: "Facture générée", description: "La facture finale a été créée car le solde est payé." });
      }
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleUpdateTransport = async () => {
    if (!selectedOrderPreview) return;
    const cost = parseFloat(orderTransportInput);
    if (isNaN(cost)) return;

    setIsUpdatingOrderTransport(true);
    const result = await updateOrderTransportCost(selectedOrderPreview.id, cost);
    setIsUpdatingOrderTransport(false);

    if (result.success) {
      toast({ title: "Succès", description: "Frais de transport mis à jour." });
      setSelectedOrderPreview({ 
        ...selectedOrderPreview, 
        transportCost: cost, 
        totalAmount: result.newTotal 
      });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const openCalculator = (order: any) => {
    const totalWeight = (order.items || []).reduce((sum: number, item: any) => sum + ((Number(item.weight) || 0) * (Number(item.quantity) || 0)), 0);
    setCalcWeight(totalWeight);
    setIsCalcOpen(true);
  };

  const applyCalculatedCost = () => {
    const total = (calcWeight * calcRate) + calcFixed;
    setOrderTransportInput(total.toFixed(2));
    setIsCalcOpen(false);
    toast({ title: "Calcul appliqué", description: "Cliquez sur l'icône de validation (V) pour enregistrer les nouveaux frais." });
  };

  const handleGenerateQuote = (orderId: string) => {
    router.push(`/admin/quotes?fromOrder=${orderId}`);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsMediaUploading(true);
    const newImages = [...(editingProduct?.images || [])];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('folder', `clients/${clientId}/catalog`);
      
      try {
        const result = await uploadFile(formData);
        if (result.success && result.url) {
          newImages.push(result.url);
        } else {
          toast({ variant: 'destructive', title: 'Erreur upload', description: result.message });
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'uploader le fichier." });
      }
    }

    setEditingProduct({ ...editingProduct, images: newImages });
    setIsMediaUploading(false);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    const newImages = [...(editingProduct?.images || [])];
    newImages.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      ...product,
      sku: product.sku || '',
      price: product.price || product.unitPrice || 0,
      description: product.description || '',
      images: product.images || [],
      weight: product.weight || 0,
      width: product.width || 0,
      height: product.height || 0,
      length: product.length || 0,
      moq: product.moq || 1,
      hasSizeSelection: product.hasSizeSelection || false,
      availability: product.availability || 'both',
    });
    setIsProductDialogOpen(true);
  };

  const handleSelectFromGlobalCatalog = (prod: Product) => {
    setEditingProduct({
      id: `PROD-CAT-${Date.now()}`,
      name: prod.name || '',
      sku: prod.sku || '',
      description: prod.description || '',
      price: prod.price || 0,
      unitPrice: prod.price || 0,
      images: prod.imageUrl ? [prod.imageUrl] : [],
      weight: prod.weight || 0,
      width: prod.width || 0,
      height: prod.height || 0,
      length: prod.length || 0,
      moq: 1,
      hasSizeSelection: false,
      availability: 'both',
      isNew: true 
    });
    setIsCatalogDialogOpen(false);
    setIsProductDialogOpen(true);
  };

  const handleManualAdd = () => {
    setEditingProduct({
      id: `PROD-MAN-${Date.now()}`,
      name: '',
      sku: '',
      description: '',
      price: 0,
      unitPrice: 0,
      images: [],
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      moq: 1,
      hasSizeSelection: false,
      availability: 'both',
      isNew: true
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !db || !client) return;
    
    setIsSaving(true);
    try {
      let listId = editingProduct.listId || editingProduct.productListId || (selectedList?.id);
      
      if (editingProduct.isNew && !listId) {
        const existingList = productLists?.find(l => l.name === "Catalogue Officiel");
        if (existingList) {
          listId = existingList.id;
        } else {
          listId = `LST-CAT-${Date.now()}`;
          await setDoc(doc(db, 'clients', clientId, 'productLists', listId), {
            id: listId,
            clientId: clientId,
            name: "Catalogue Officiel",
            description: "Produits ajoutés directement par l'administration.",
            createdAt: new Date().toISOString(),
          });
        }
      }

      const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', editingProduct.id);
      
      const payload = {
        ...editingProduct,
        price: Number(editingProduct.price || 0),
        unitPrice: Number(editingProduct.price || 0),
        weight: Number(editingProduct.weight || 0),
        width: Number(editingProduct.width || 0),
        height: Number(editingProduct.height || 0),
        length: Number(editingProduct.length || 0),
        moq: Number(editingProduct.moq || 1),
        status: 'published',
        validatedAt: new Date().toISOString(),
        clientId: clientId,
        productListId: listId,
      };
      
      delete payload.isNew;
      delete payload.listId;
      delete payload.listName;

      await setDoc(productRef, payload, { merge: true });
      
      toast({ title: "Produit validé", description: "L'article est maintenant disponible dans le catalogue du client." });
      setIsProductDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineMoqSave = async (product: any) => {
    if (!db || !clientId) return;
    const moqVal = parseInt(tempMoq);
    if (isNaN(moqVal) || moqVal < 1) {
      toast({ variant: "destructive", title: "Erreur", description: "MOQ invalide." });
      return;
    }

    setSavingId(product.id);
    try {
      const productRef = doc(db, 'clients', clientId, 'productLists', product.listId, 'products', product.id);
      await updateDoc(productRef, { moq: moqVal });
      toast({ title: "MOQ mis à jour" });
      setEditingMoqId(null);
      router.refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteProductActual = async (product: any) => {
    if (!product.productListId || !product.id) return;
    const result = await deleteClientProduct(clientId, product.productListId, product.id);
    if (result.success) {
      toast({ title: "Supprimé", description: result.message });
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleDeleteListActual = async (list: any) => {
    if (!list.id) return;
    const result = await deleteProductList(clientId, list.id);
    if (result.success) {
      toast({ title: "Supprimé", description: result.message });
      setSelectedList(null);
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleDeleteOrderActual = async (id: string) => {
    const result = await deleteOrder(id);
    if (result.success) {
      toast({ title: "Supprimé", description: "La commande a été supprimée." });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleDeleteQuoteActual = async (id: string) => {
    const result = await deleteQuote(id);
    if (result.success) {
      toast({ title: "Supprimé", description: "La proforma a été supprimée." });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleDeleteInvoiceActual = async (id: string) => {
    const result = await deleteInvoice(id);
    if (result.success) {
      toast({ title: "Supprimé", description: "La facture a été supprimée." });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleLinkInvoice = async (inv: Invoice) => {
    if (!db || !client) return;
    setIsSaving(true);
    try {
      const customerFullName = `${client.firstName || ''} ${client.lastName || ''}`;
      const invoiceRef = doc(db, 'invoices', inv.id);
      await updateDoc(invoiceRef, {
        customerId: clientId,
        customerName: customerFullName
      });
      
      const clientInvoiceRef = doc(db, 'clients', clientId, 'invoices', inv.id);
      await setDoc(clientInvoiceRef, {
        ...inv,
        customerId: clientId,
        customerName: customerFullName
      }, { merge: true });
      
      toast({ title: "Facture liée", description: `La facture ${inv.invoiceNumber} est maintenant visible par le client.` });
      setIsInvoiceLinkDialogOpen(false);
      const updatedInvs = await getInvoices();
      setAllInvoices(updatedInvs || []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkQuote = async (quote: Quote) => {
    if (!db || !client) return;
    setIsSaving(true);
    try {
      const customerFullName = `${client.firstName || ''} ${client.lastName || ''}`;
      const quoteRef = doc(db, 'quotes', quote.id);
      await updateDoc(quoteRef, {
        customerId: clientId,
        customerName: customerFullName
      });
      
      const clientQuoteRef = doc(db, 'clients', clientId, 'quotes', quote.id);
      await setDoc(clientQuoteRef, {
        ...quote,
        customerId: clientId,
        customerName: customerFullName
      }, { merge: true });
      
      toast({ title: "Proforma liée", description: `La proforma ${quote.quoteNumber} est maintenant visible par le client.` });
      setIsQuoteLinkDialogOpen(false);
      const updatedQuotes = await getQuotes();
      setAllQuotes(updatedQuotes || []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenOrderPreview = (order: any) => {
    setSelectedOrderPreview(order);
    setOrderTransportInput((order.transportCost || 0).toString());
    setIsOrderPreviewOpen(true);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-500">Livré</Badge>;
      case 'shipped': return <Badge className="bg-blue-500">Expédié</Badge>;
      case 'validated': return <Badge className="bg-green-600">Validé</Badge>;
      case 'processing': return <Badge variant="outline">En cours</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
        case 'paid': return <Badge className="bg-green-500 text-[10px] h-5">SOLDE PAYÉ</Badge>;
        case 'deposit_paid': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] h-5">ACOMPTE OK</Badge>;
        case 'unpaid': return <Badge variant="outline" className="text-zinc-400 text-[10px] h-5">NON PAYÉ</Badge>;
        default: return <Badge variant="outline" className="text-zinc-400 text-[10px] h-5">NON PAYÉ</Badge>;
    }
  };

  const renderOrdersTable = (orderList: any[]) => (
    <Table>
      <TableHeader className="bg-zinc-50">
        <TableRow>
          <TableHead className="pl-6">N° Commande</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-center">Frais Port (CNY)</TableHead>
          <TableHead className="text-center">Paiement</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right pr-6">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderList.length > 0 ? orderList.map((order) => {
          const orderCreatedDate = parseSafeDate(order.createdAt);
          const isVeryRecent = (Date.now() - orderCreatedDate.getTime()) < 3600000;
          const isNewNotification = isVeryRecent && order.status === 'processing';
          const hasQuote = linkedQuotes?.some(q => q.orderId === order.id);

          return (
            <TableRow key={order.id} className={cn(isNewNotification && "bg-primary/5")}>
              <TableCell className="pl-6 py-4 font-bold">
                <div className="flex items-center gap-2">
                  {order.orderNumber}
                  {isNewNotification && <Badge className="bg-red-500 text-[8px] h-4 px-1">NEW</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {order.orderDate ? format(parseSafeDate(order.orderDate), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell>
                <Select 
                  defaultValue={order.status} 
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    {getOrderStatusBadge(order.status)}
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
              <TableCell className="text-center font-medium">
                ¥{(order.transportCost || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <Select 
                  defaultValue={order.paymentStatus} 
                  onValueChange={(value: PaymentStatus) => handlePaymentStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-36 h-8 text-[10px] font-bold">
                    {getPaymentBadge(order.paymentStatus)}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Non payé</SelectItem>
                    <SelectItem value="deposit_paid">Acompte payé</SelectItem>
                    <SelectItem value="paid">Total payé</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right font-semibold">¥{order.totalAmount.toFixed(2)}</TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-2">
                  {order.status !== 'cancelled' && (
                    <div className="flex items-center gap-1">
                      {hasQuote ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] font-bold border-zinc-200 text-zinc-400 cursor-default hover:bg-transparent"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" /> PI GÉNÉRÉE
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold h-8 text-[10px]"
                            onClick={() => handleGenerateQuote(order.id)}
                          >
                            <Sparkles className="mr-1 h-3 w-3" /> RE-GÉNÉRER
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-bold h-8"
                          onClick={() => handleGenerateQuote(order.id)}
                        >
                          <Sparkles className="mr-2 h-3 w-3" />
                          Générer PI
                        </Button>
                      )}
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenOrderPreview(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible et supprimera la commande de votre espace et de celui du client.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteOrderActual(order.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          )
        }) : (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Aucune commande.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const listProducts = useMemo(() => {
    if (!selectedList || !db || !clientId) return [];
    return (publishedProducts || []).filter(p => p.listId === selectedList.id).concat((pendingSourcingProducts || []).filter(p => p.listId === selectedList.id));
  }, [selectedList, publishedProducts, pendingSourcingProducts, db, clientId]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!client) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">Client introuvable</h2>
        <Button variant="link" asChild><Link href="/admin/registered-clients">Retour à la liste</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/registered-clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux comptes
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {client.status === 'validated' ? (
            <Badge className="bg-green-500">Compte Validé</Badge>
          ) : (
            <Badge variant="outline" className="text-orange-500 border-orange-200">En attente de validation</Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleToggleStatus}>
            {client.status === 'validated' ? 'Suspendre' : 'Valider maintenant'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={isDeletingClient}>
                {isDeletingClient ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Supprimer le compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement ce compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera l'accès du client à son espace. Toutes ses données de profil seront effacées de la liste des comptes. Les documents globaux (factures, proformas) resteront dans votre base mais ne seront plus liés à ce client.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClientActual} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                  Confirmer la suppression
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Profil Client
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Nom Complet</div>
                <div className="font-semibold text-lg">{client.firstName || ''} {client.lastName || ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email || 'N/A'}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.companyName && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.companyName}</span>
                </div>
              )}
              <div className="pt-4 border-t space-y-3">
                <div className="text-xs text-muted-foreground uppercase font-bold">Numéro Client Officiel</div>
                <div className="flex gap-2">
                  <Input 
                    value={clientNumber} 
                    onChange={(e) => setClientNumber(e.target.value)}
                    placeholder="ex: CL-2024-001"
                    className="h-9"
                  />
                  <Button size="sm" onClick={handleUpdateNumber} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Préfixe Commande (2 lettres)
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={orderPrefix} 
                    onChange={(e) => setOrderPrefix(e.target.value.toUpperCase().substring(0, 2))}
                    placeholder="ex: OL"
                    className="h-9 font-bold"
                    maxLength={2}
                  />
                  <Button size="sm" variant="secondary" onClick={handleUpdatePrefix} disabled={isSaving || (orderPrefix || '').length !== 2}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-2">
                  <Coins className="h-3 w-3" /> Préférence Devise (Affichage)
                </div>
                <Select value={currencyPreference} onValueChange={(v: any) => handleUpdateCurrencyPreference(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€) uniquement</SelectItem>
                    <SelectItem value="CNY">Yuan (¥) uniquement</SelectItem>
                    <SelectItem value="BOTH">Double affichage (€ + ¥)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-500 italic">Définit comment les prix apparaissent dans l'espace client.</p>
              </div>
              <div className="text-xs text-muted-foreground pt-2 italic">
                Client depuis {client.createdAt ? parseSafeDate(client.createdAt).getFullYear() : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="catalogue" className="w-full">
            <TabsList className="bg-white border shadow-sm p-1 h-12 rounded-xl mb-6 overflow-x-auto flex-nowrap w-full justify-start">
              <TabsTrigger value="catalogue" className="rounded-lg h-full px-4"><Star className="h-4 w-4 mr-2" /> Catalogue</TabsTrigger>
              <TabsTrigger value="lists" className="rounded-lg h-full px-4 relative">
                <ClipboardList className="h-4 w-4 mr-2" /> Sourcing
                {pendingSourcingProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] text-white animate-pulse">
                    {pendingSourcingProducts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg h-full px-4 relative">
                <ShoppingCart className="h-4 w-4 mr-2" /> Commandes
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] text-white animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="quotes" className="rounded-lg h-full px-4"><FileText className="h-4 w-4 mr-2" /> Proformas</TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg h-full px-4"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg h-full px-4"><Lock className="h-4 w-4 mr-2" /> Accès & Sécurité</TabsTrigger>
            </TabsList>

            <TabsContent value="catalogue">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Produits visibles par le client</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleManualAdd}>
                    <Plus className="h-4 w-4 mr-2" /> Ajout Manuel
                  </Button>
                  <Button size="sm" onClick={() => setIsCatalogDialogOpen(true)}>
                    <Package className="h-4 w-4 mr-2" /> Depuis Catalogue Global
                  </Button>
                </div>
              </div>
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">Produit</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Prix Final</TableHead>
                      <TableHead className="w-24 text-center">MOQ</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAggregationLoading ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : publishedProducts.length > 0 ? publishedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <div className="relative w-10 h-10 rounded border bg-zinc-50 overflow-hidden shrink-0">
                                <Image src={product.images[0]} alt={product.name || 'Produit'} fill className="object-cover" />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <div className="font-medium text-sm">{product.name || 'N/A'}</div>
                              <div className="text-[9px] text-zinc-400 font-bold uppercase">
                                {product.availability === 'personalized_only' ? 'Perso. uniquement' : 
                                 product.availability === 'standard_only' ? 'Standard uniquement' : 
                                 'Standard & Perso.'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{product.sku || 'N/A'}</TableCell>
                        <TableCell className="font-bold">¥{Number(product.price || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          {editingMoqId === product.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input 
                                type="number" 
                                min="1" 
                                className="w-16 h-8 text-center text-xs font-black" 
                                value={tempMoq} 
                                onChange={(e) => setTempMoq(e.target.value)} 
                                autoFocus
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-600"
                                onClick={() => handleInlineMoqSave(product)}
                                disabled={savingId === product.id}
                              >
                                {savingId === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="text-xs font-black text-primary cursor-pointer hover:bg-zinc-100 rounded px-2 py-1 inline-block transition-colors"
                              onClick={() => {
                                setEditingMoqId(product.id);
                                setTempMoq((product.moq || 1).toString());
                              }}
                            >
                              {product.moq || 1}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditProduct(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                                  <AlertDialogDescription>L'article sera retiré du catalogue client et supprimé de sa liste de sourcing.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProductActual(product)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucun produit publié pour ce client.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="lists" className="space-y-8">
              {pendingSourcingProducts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-black text-lg uppercase tracking-tight">Demandes de Sourcing en attente</h3>
                  </div>
                  <Card className="border-2 border-red-100 shadow-xl overflow-hidden bg-white">
                    <Table>
                      <TableHeader className="bg-red-50">
                        <TableRow>
                          <TableHead className="pl-6 text-red-900 font-bold">Produit demandé</TableHead>
                          <TableHead className="text-red-900 font-bold">Quantité</TableHead>
                          <TableHead className="text-red-900 font-bold">Liste Source</TableHead>
                          <TableHead className="text-right pr-6 text-red-900 font-bold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingSourcingProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-red-50/30">
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                {product.images?.[0] && (
                                  <div className="relative w-14 h-14 rounded-lg border bg-zinc-50 overflow-hidden shrink-0 shadow-sm">
                                    <Image src={product.images[0]} alt={product.name || 'Produit'} fill className="object-cover" />
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <div className="font-black text-sm">{product.name || 'N/A'}</div>
                                  <div className="text-xs text-zinc-500 line-clamp-1">{product.description || ''}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">{product.quantity || 0}</TableCell>
                            <TableCell className="text-xs italic text-zinc-400">{product.listName || 'N/A'}</TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => handleEditProduct(product)}>
                                  <Sparkles className="h-3 w-3 mr-2" /> Compléter & Valider
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
                                      <AlertDialogDescription>Cette action retirera l'article de la liste du client.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteProductActual(product)}>Supprimer</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-bold text-lg text-zinc-800">Parcourir les listes de projets</h3>
                {!selectedList ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productLists && productLists.length > 0 ? productLists.map((list) => {
                      const listPendingCount = pendingSourcingProducts.filter(p => p.listId === list.id).length;
                      return (
                        <Card key={list.id} className={cn("border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer relative", listPendingCount > 0 && "ring-1 ring-red-200")} onClick={() => setSelectedList(list)}>
                          {listPendingCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-600 text-[10px]">{listPendingCount} ATTENTE</Badge>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{list.name || 'Sans nom'}</CardTitle>
                              <ChevronRight className="h-4 w-4 text-zinc-300" />
                            </div>
                            <CardDescription className="text-xs line-clamp-1">{list.description || ""}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <span className="text-[10px] text-muted-foreground italic">Créé le {list.createdAt ? format(parseSafeDate(list.createdAt), 'dd/MM/yyyy') : '-'}</span>
                          </CardContent>
                        </Card>
                      )
                    }) : (
                      <div className="col-span-full p-12 text-center bg-white rounded-2xl border-2 border-dashed text-muted-foreground">
                        Aucune liste de produits pour ce client.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                      <Button variant="link" onClick={() => setSelectedList(null)} className="p-0 text-zinc-500 hover:no-underline">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux listes
                      </Button>
                      <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg">{selectedList.name || 'Liste'}</h3>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="h-8 font-bold"><Trash2 className="h-3 w-3 mr-2"/> Supprimer la liste</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la liste complète ?</AlertDialogTitle>
                              <AlertDialogDescription>Cela supprimera la liste et tous les produits associés pour ce client.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteListActual(selectedList)}>Confirmer la suppression</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                      <Table>
                        <TableHeader className="bg-zinc-50">
                          <TableRow>
                            <TableHead className="pl-6">Produit</TableHead>
                            <TableHead>Qté</TableHead>
                            <TableHead>Prix Final</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listProducts && listProducts.length > 0 ? listProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="pl-6 py-4">
                                <div className="flex items-center gap-3">
                                  {product.images?.[0] && (
                                    <div className="relative w-12 h-12 rounded border bg-zinc-50 overflow-hidden shrink-0">
                                      <Image src={product.images[0]} alt={product.name || 'Produit'} fill className="object-cover" />
                                    </div>
                                  )}
                                  <div className="font-medium text-sm">{product.name || 'N/A'}</div>
                                </div>
                              </TableCell>
                              <TableCell>{product.quantity || 0}</TableCell>
                              <TableCell>¥{Number(product.price || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                {product.status === 'published' ? (
                                  <Badge className="bg-green-500 text-[10px] px-2 py-0">Publié</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 text-[10px] px-2 py-0 animate-pulse">À TRAITER</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant={product.status === 'published' ? "outline" : "default"} onClick={() => handleEditProduct(product)}>
                                    {product.status === 'published' ? 'Modifier' : 'Compléter & Publier'}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                                        <AlertDialogDescription>L'article sera définitivement retiré de cette liste.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProductActual(product)}>Supprimer</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucun produit dans cette liste.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="active" className="gap-2">
                    <Clock className="h-3 w-3" /> En cours ({(activeOrders || []).length})
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="gap-2">
                    <History className="h-3 w-3" /> Archives ({(archivedOrders || []).length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active">
                  <Card className="border-none shadow-md overflow-hidden bg-white">
                    {renderOrdersTable(activeOrders || [])}
                  </Card>
                </TabsContent>
                
                <TabsContent value="archived">
                  <Card className="border-none shadow-md overflow-hidden bg-white">
                    {renderOrdersTable(archivedOrders || [])}
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="quotes">
              <div className="mb-4 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsQuoteLinkDialogOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Lier une proforma existante
                </Button>
              </div>
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">N° Proforma</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Montant</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLinkedQuotes && sortedLinkedQuotes.length > 0 ? sortedLinkedQuotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="pl-6 font-bold">{quote.quoteNumber || 'N/A'}</TableCell>
                        <TableCell>{quote.issueDate ? format(parseSafeDate(quote.issueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={quote.status === 'accepted' || quote.status === 'paid' ? 'default' : 'secondary'}>{quote.status || 'draft'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">¥{Number(quote.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/quotes/${quote.id}`}>
                                <Eye className="h-4 w-4 mr-2" /> Voir
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cette proforma ?</AlertDialogTitle>
                                  <AlertDialogDescription>Elle ne sera plus visible ni par vous ni par le client.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteQuoteActual(quote.id)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucune proforma liée.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <div className="mb-4 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsInvoiceLinkDialogOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Lier une facture existante
                </Button>
              </div>
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">N° Facture</TableHead>
                      <TableHead>Émission</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Montant</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLinkedInvoices && sortedLinkedInvoices.length > 0 ? sortedLinkedInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 font-bold">{inv.invoiceNumber || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{inv.issueDate ? format(parseSafeDate(inv.issueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell className="text-xs">{inv.dueDate ? format(parseSafeDate(inv.dueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          <Badge className={inv.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                            {inv.status === 'paid' ? 'Acquittée' : 'À régler'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold">¥{Number(inv.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/client/invoices/${inv.id}`}>
                                <Eye className="h-4 w-4 mr-2" /> Voir
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
                                  <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteInvoiceActual(inv.id)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Aucune facture liée.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Sécurité & Accès Client</h3>
                </div>
                
                <Card className="border-none shadow-md bg-white">
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2">
                          <Mail className="h-4 w-4 text-zinc-400" /> Email de connexion
                        </Label>
                        <Input 
                          value={loginEmail} 
                          onChange={(e) => setLoginEmail(e.target.value)} 
                          placeholder="client@email.com"
                        />
                        <p className="text-[10px] text-zinc-500 italic">L'identifiant utilisé pour se connecter à l'espace client.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-zinc-400" /> Mot de passe (Visible Admin)
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <input 
                            type="text"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={loginPassword} 
                            onChange={(e) => setLoginPassword(e.target.value)} 
                            placeholder="Min. 6 caractères"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 italic">Modifier ce champ mettra à jour l'accès du client.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-orange-800 leading-relaxed">
                        <p className="font-bold mb-1">Attention aux modifications</p>
                        <p>Changer ces informations modifiera instantanément les accès du client. Si vous changez l'email ou le mot de passe, vous devrez les lui communiquer manuellement (WhatsApp/Email) pour qu'il puisse à nouveau accéder à son espace.</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={handleUpdateCredentials} 
                        disabled={isUpdatingCredentials}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold"
                      >
                        {isUpdatingCredentials ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer les nouveaux accès
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isCatalogDialogOpen} onOpenChange={setIsCatalogDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sélectionner un produit global</DialogTitle>
            <DialogDescription>Choisissez un produit pour l'importer dans le catalogue privé du client.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Prix Standard</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(globalProducts || []).map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.imageUrl && <div className="relative w-8 h-8 rounded bg-zinc-100 overflow-hidden"><Image src={p.imageUrl} alt={p.name || 'Produit'} fill className="object-cover" /></div>}
                        <span className="text-xs font-bold">{p.name || 'Sans nom'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{p.sku || 'N/A'}</TableCell>
                    <TableCell className="text-xs">¥{Number(p.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleSelectFromGlobalCatalog(p)}>
                        Sélectionner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInvoiceLinkDialogOpen} onOpenChange={setIsInvoiceLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lier une facture existante</DialogTitle>
            <DialogDescription>Sélectionnez une facture pour l'attribuer à ce client.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client Actuel</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInvoices.filter(i => i.customerId !== clientId).map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-bold">{inv.invoiceNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{inv.customerName || 'N/A'}</TableCell>
                    <TableCell className="text-xs font-bold">¥{Number(inv.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleLinkInvoice(inv)}>Attribuer</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuoteLinkDialogOpen} onOpenChange={setIsQuoteLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lier une proforma existante</DialogTitle>
            <DialogDescription>Sélectionnez une proforma pour l'attribuer à ce client.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Proforma</TableHead>
                  <TableHead>Client Actuel</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allQuotes.filter(q => q.customerId !== clientId).map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className="text-xs font-bold">{quote.quoteNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{quote.customerName || 'N/A'}</TableCell>
                    <TableCell className="text-xs font-bold">¥{Number(quote.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleLinkQuote(quote)}>Attribuer</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> 
              Commande {selectedOrderPreview?.orderNumber || 'N/A'}
            </DialogTitle>
            <DialogDescription>
              Détails complets de la demande client.
            </DialogDescription>
          </DialogHeader>

          {selectedOrderPreview && (
            <div className="space-y-8 py-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Statut</span>
                  <div>{getOrderStatusBadge(selectedOrderPreview.status || 'processing')}</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total</span>
                  <div className="text-2xl font-black text-primary">¥{Number(selectedOrderPreview.totalAmount || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-zinc-400" /> Articles
                </h4>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="w-16"></TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qté</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedOrderPreview.items || []).map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2">
                            {item.photo && (
                              <div className="relative w-10 h-10 rounded border bg-white overflow-hidden">
                                <Image src={item.photo} alt={item.description || 'Produit'} fill className="object-cover" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="font-medium text-sm">
                              {item.description || 'N/A'}
                              {item.size && <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1">{item.size}</Badge>}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">{item.sku || ''}</div>
                          </TableCell>
                          <TableCell className="py-2 text-center font-bold">{item.quantity || 0}</TableCell>
                          <TableCell className="py-2 text-right font-bold">¥{Number(item.total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-zinc-400" /> Frais de Transport (CNY)
                  </h4>
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-10 w-10 text-zinc-400 hover:text-primary shrink-0"
                      onClick={() => openCalculator(selectedOrderPreview)}
                      title="Calculer les frais"
                    >
                      <Calculator className="h-5 w-5" />
                    </Button>
                    <Input 
                      type="number" 
                      value={orderTransportInput} 
                      onChange={(e) => setOrderTransportInput(e.target.value)}
                      className="h-10 font-bold"
                    />
                    <Button 
                      onClick={handleUpdateTransport} 
                      disabled={isUpdatingOrderTransport}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isUpdatingOrderTransport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Ces frais seront inclus dans le montant total facturé.</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" /> Adresse de livraison
                  </h4>
                  <div className="p-4 bg-white border rounded-xl text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                    {selectedOrderPreview.shippingAddress || "Aucune adresse renseignée."}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground italic px-4 border-t pt-4">
                Passée le {selectedOrderPreview.orderDate ? format(parseSafeDate(selectedOrderPreview.orderDate), 'dd MMMM yyyy à HH:mm') : '-'}
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsOrderPreviewOpen(false)}>Fermer</Button>
            {selectedOrderPreview?.status !== 'cancelled' && (
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
                onClick={() => handleGenerateQuote(selectedOrderPreview?.id)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Générer Proforma
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Calculateur de Frais d'Envoi</DialogTitle>
            <DialogDescription>
              Calculez le coût basé sur le poids total de la commande.
            </DialogDescription>
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
              <p className="text-[10px] text-muted-foreground italic">* Somme des poids unitaires × quantités</p>
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
              <Label>Frais fixes de dossier/palette (CNY)</Label>
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
            <Button variant="outline" onClick={() => setIsCalcOpen(false)}>Annuler</Button>
            <Button onClick={applyCalculatedCost}>Appliquer le montant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration et Validation du Produit</DialogTitle>
            <DialogDescription>
              Vérifiez les informations techniques et ajoutez des photos ou vidéos avant la publication.
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" /> Photos & Vidéos (Catalogue)
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(editingProduct.images || []).map((url: string, idx: number) => {
                      const isVideo = url.includes('.mp4') || url.includes('video');
                      return (
                        <div key={idx} className="relative aspect-square rounded-xl border bg-zinc-50 overflow-hidden group shadow-sm">
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                              <PlayCircle className="h-8 w-8 text-white opacity-50" />
                            </div>
                          ) : (
                            <Image src={url} alt="Media" fill className="object-cover" />
                          )}
                          <button 
                            onClick={() => removeMedia(idx)}
                            className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 hover:border-primary/50 transition-all bg-white">
                      {isMediaUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <UploadCloud className="h-6 w-6 text-zinc-400" />
                          <span className="text-[10px] font-bold text-zinc-500 mt-2">AJOUTER</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={handleMediaUpload}
                        disabled={isMediaUploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl border space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400">Nom Commercial</Label>
                    <input 
                      value={editingProduct.name || ''} 
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="font-bold h-10 text-lg w-full bg-transparent outline-none border-b focus:border-primary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400">SKU / Réf</Label>
                      <Input 
                        value={editingProduct.sku || ''} 
                        onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                        placeholder="YW-REF-001"
                        className="h-9 text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400">Prix Final (CNY)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-bold">¥</span>
                        <Input 
                          type="number"
                          className="pl-7 h-9 text-sm font-black text-primary"
                          value={editingProduct.price || 0} 
                          onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase text-primary flex items-center gap-2">
                      <ShieldAlert className="h-3 w-3" /> Conditions de vente
                    </Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Quantité Minimum (MOQ)</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={editingProduct.moq || 1} 
                          onChange={(e) => setEditingProduct({...editingProduct, moq: e.target.value})}
                          className="h-9 font-black"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-6">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-zinc-800">Grille tailles</div>
                        </div>
                        <Switch 
                          checked={editingProduct.hasSizeSelection || false} 
                          onCheckedChange={(checked) => setEditingProduct({...editingProduct, hasSizeSelection: checked})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                        <Settings2 className="h-3 w-3" /> Type de disponibilité
                      </Label>
                      <Select 
                        value={editingProduct.availability || 'both'} 
                        onValueChange={(val) => setEditingProduct({...editingProduct, availability: val})}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Standard et Personnalisable</SelectItem>
                          <SelectItem value="personalized_only">Uniquement Personnalisable</SelectItem>
                          <SelectItem value="standard_only">Uniquement Standard</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[9px] text-zinc-400 italic">Définit si le client peut cocher l'option de personnalisation et si le MOQ s'applique.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2"><Maximize className="h-3 w-3" /> Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" className="h-9 px-2 text-xs" placeholder="L" value={editingProduct.length || 0} onChange={(e) => setEditingProduct({...editingProduct, length: e.target.value})} />
                      <Input type="number" className="h-9 px-2 text-xs" placeholder="W" value={editingProduct.width || 0} onChange={(e) => setEditingProduct({...editingProduct, width: e.target.value})} />
                      <Input type="number" className="h-9 px-2 text-xs" placeholder="H" value={editingProduct.height || 0} onChange={(e) => setEditingProduct({...editingProduct, height: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2"><Scale className="h-3 w-3" /> Poids (kg)</Label>
                    <Input type="number" step="0.01" className="h-9" value={editingProduct.weight || 0} onChange={(e) => setEditingProduct({...editingProduct, weight: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-zinc-400">Description Technique & Spécifications</Label>
                  <Textarea 
                    rows={15}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    placeholder="Détaillez ici les caractéristiques techniques qui seront visibles par le client..."
                    className="text-sm architectural leading-relaxed border-zinc-200 focus:ring-primary shadow-inner"
                  />
                </div>
                <div className="p-4 bg-primary/5 rounded-xl text-xs text-primary/80 border border-primary/10">
                  <p className="font-black mb-1 flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> NOTE DE PUBLICATION</p>
                  <p>Une fois publié, ce produit apparaîtra instantanément dans l'onglet <strong>"Mon Catalogue"</strong> du client.</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t rounded-b-xl">
            <Button variant="ghost" onClick={() => setIsProductDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveProduct} disabled={isSaving || isMediaUploading} className="bg-primary hover:bg-primary/90 min-w-[220px] h-12 text-lg font-bold shadow-lg shadow-primary/20">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              PUBLIER AU CATALOGUE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
