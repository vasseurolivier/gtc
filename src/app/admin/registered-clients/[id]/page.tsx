
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRegisteredClientById, 
  updateRegisteredClientStatus, 
  updateRegisteredClientNumber,
  RegisteredClient 
} from '@/actions/registered-clients';
import { updateOrderStatus } from '@/actions/orders';
import { createQuoteFromOrder } from '@/actions/quotes';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Image as ImageIcon,
  Sparkles,
  MapPin,
  FileText,
  History,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getProducts, Product } from '@/actions/products';
import { getInvoices, Invoice } from '@/actions/invoices';
import { uploadFile } from '@/actions/upload';
import { cn } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState<string | null>(null);
  const [clientNumber, setClientNumber] = useState('');
  
  // Catalog & Sourcing logic
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);
  const [pendingSourcingProducts, setPendingSourcingProducts] = useState<any[]>([]);
  const [isAggregationLoading, setIsAggregationLoading] = useState(false);
  
  // Invoice linking logic
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [isInvoiceLinkDialogOpen, setIsInvoiceLinkDialogOpen] = useState(false);

  // Edit logic
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);

  // Order Preview logic
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<any | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  // Fetch client and auxiliary data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [clientData, prods, invs] = await Promise.all([
        getRegisteredClientById(clientId),
        getProducts(),
        getInvoices()
      ]);
      
      if (clientData) {
        setClient(clientData);
        setClientNumber(clientData.clientNumber || '');
      }
      setGlobalProducts(prods);
      setAllInvoices(invs);
      setIsLoading(false);
    }
    fetchData();
  }, [clientId]);

  // Sourcing Lists Query
  const listsQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return collection(db, 'clients', clientId, 'productLists');
  }, [db, clientId]);
  const { data: productLists } = useCollection(listsQuery);

  // Orders Query
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'orders'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: orders } = useCollection(ordersQuery);

  // Split orders into active and archived
  const { activeOrders, archivedOrders } = useMemo(() => {
    if (!orders) return { activeOrders: [], archivedOrders: [] };
    const active = orders.filter(o => o.status === 'processing' || o.status === 'validated' || o.status === 'shipped');
    const archived = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    
    const sortByDate = (a: any, b: any) => {
      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return dateB - dateA;
    };

    return { 
      activeOrders: [...active].sort(sortByDate), 
      archivedOrders: [...archived].sort(sortByDate) 
    };
  }, [orders]);

  // Invoices Query (Linked to this client)
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'invoices'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: invoices } = useCollection(invoicesQuery);

  // Products of selected list Query
  const listProductsQuery = useMemoFirebase(() => {
    if (!db || !clientId || !selectedList) return null;
    return collection(db, 'clients', clientId, 'productLists', selectedList.id, 'products');
  }, [db, clientId, selectedList]);
  const { data: listProducts } = useCollection(listProductsQuery);

  // Aggregation of all products for the "Catalogue" and "Sourcing" badges
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

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientNumber(clientId, clientNumber);
    if (result.success) {
      toast({ title: "Succès", description: "Numéro client mis à jour." });
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

  const handleGenerateQuote = async (orderId: string) => {
    setIsGeneratingQuote(orderId);
    try {
      const result = await createQuoteFromOrder(orderId);
      if (result.success) {
        toast({ title: "Succès", description: result.message });
        router.push('/admin/quotes');
      } else {
        toast({ variant: "destructive", title: "Erreur", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue." });
    } finally {
      setIsGeneratingQuote(null);
    }
  };

  // Media Management
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
    });
    setIsProductDialogOpen(true);
  };

  const handleSelectFromGlobalCatalog = (prod: Product) => {
    setEditingProduct({
      id: `PROD-CAT-${Date.now()}`,
      name: prod.name,
      sku: prod.sku,
      description: prod.description || '',
      price: prod.price,
      unitPrice: prod.price,
      images: prod.imageUrl ? [prod.imageUrl] : [],
      weight: prod.weight || 0,
      width: prod.width || 0,
      height: prod.height || 0,
      length: prod.length || 0,
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
        price: Number(editingProduct.price),
        unitPrice: Number(editingProduct.price),
        weight: Number(editingProduct.weight),
        width: Number(editingProduct.width),
        height: Number(editingProduct.height),
        length: Number(editingProduct.length),
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
      // Trigger re-aggregation
      router.refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublishProduct = async (product: any) => {
    if (!db || !clientId) return;
    try {
      const productRef = doc(db, 'clients', clientId, 'productLists', product.productListId, 'products', product.id);
      await updateDoc(productRef, { status: 'pending' });
      toast({ title: "Produit retiré", description: "L'article n'est plus visible dans le catalogue client." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleLinkInvoice = async (inv: Invoice) => {
    if (!db || !client) return;
    setIsSaving(true);
    try {
      const invoiceRef = doc(db, 'invoices', inv.id);
      await updateDoc(invoiceRef, {
        customerId: clientId,
        customerName: `${client.firstName} ${client.lastName}`
      });
      
      toast({ title: "Facture liée", description: `La facture ${inv.invoiceNumber} est maintenant visible par le client.` });
      setIsInvoiceLinkDialogOpen(false);
      const updatedInvs = await getInvoices();
      setAllInvoices(updatedInvs);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenOrderPreview = (order: any) => {
    setSelectedOrderPreview(order);
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

  const renderOrdersTable = (orderList: any[]) => (
    <Table>
      <TableHeader className="bg-zinc-50">
        <TableRow>
          <TableHead className="pl-6">N° Commande</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right pr-6">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderList.length > 0 ? orderList.map((order) => {
          const isVeryRecent = (Date.now() - new Date(order.createdAt).getTime()) < 3600000;
          const isClientInitiated = !order.quoteId;

          return (
            <TableRow key={order.id} className={cn(isVeryRecent && "bg-primary/5")}>
              <TableCell className="pl-6 font-bold">
                <div className="flex items-center gap-2">
                  {order.orderNumber}
                  {isVeryRecent && <Badge className="bg-red-500 text-[8px] h-4 px-1">NEW</Badge>}
                </div>
              </TableCell>
              <TableCell>{order.orderDate ? format(new Date(order.orderDate), 'dd/MM/yyyy') : '-'}</TableCell>
              <TableCell>
                <Select 
                  defaultValue={order.status} 
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-36 h-9">
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
              <TableCell className="text-right font-semibold">¥{order.totalAmount.toFixed(2)}</TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-2">
                  {isClientInitiated && order.status === 'processing' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-white font-bold h-8"
                      disabled={isGeneratingQuote === order.id}
                      onClick={() => handleGenerateQuote(order.id)}
                    >
                      {isGeneratingQuote === order.id ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-3 w-3" />
                      )}
                      Générer Proforma
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => handleOpenOrderPreview(order)}>
                    <Eye className="h-4 w-4 mr-2" /> Voir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        }) : (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucune commande dans cette section.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

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
                <div className="font-semibold text-lg">{client.firstName} {client.lastName}</div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
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
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="catalogue" className="w-full">
            <TabsList className="bg-white border shadow-sm p-1 h-12 rounded-xl mb-6">
              <TabsTrigger value="catalogue" className="rounded-lg h-full"><Star className="h-4 w-4 mr-2" /> Catalogue Privé</TabsTrigger>
              <TabsTrigger value="lists" className="rounded-lg h-full relative">
                <ClipboardList className="h-4 w-4 mr-2" /> Sourcing
                {pendingSourcingProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] text-white animate-pulse">
                    {pendingSourcingProducts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg h-full relative">
                <ShoppingCart className="h-4 w-4 mr-2" /> Commandes
                {activeOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] text-white animate-pulse">
                    {activeOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg h-full"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
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
                      <TableHead>Source</TableHead>
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
                                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                              </div>
                            )}
                            <div className="font-medium text-sm">{product.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{product.sku}</TableCell>
                        <TableCell className="font-bold">¥{Number(product.price || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{product.listName}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditProduct(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleUnpublishProduct(product)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
              {/* Urgent Pending Sourcing Section */}
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
                                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <div className="font-black text-sm">{product.name}</div>
                                  <div className="text-xs text-zinc-500 line-clamp-1">{product.description}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">{product.quantity}</TableCell>
                            <TableCell className="text-xs italic text-zinc-400">{product.listName}</TableCell>
                            <TableCell className="text-right pr-6">
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => handleEditProduct(product)}>
                                <Sparkles className="h-3 w-3 mr-2" /> Compléter & Valider
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* Lists Browser */}
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
                              <CardTitle className="text-base">{list.name}</CardTitle>
                              <ChevronRight className="h-4 w-4 text-zinc-300" />
                            </div>
                            <CardDescription className="text-xs line-clamp-1">{list.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <span className="text-[10px] text-muted-foreground italic">Créé le {format(new Date(list.createdAt), 'dd/MM/yyyy')}</span>
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
                      <h3 className="font-bold text-lg">{selectedList.name}</h3>
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
                                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                    </div>
                                  )}
                                  <div className="font-medium text-sm">{product.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>¥{Number(product.price || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                {product.status === 'published' ? (
                                  <Badge className="bg-green-500 text-[10px] px-2 py-0">Publié</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 text-[10px] px-2 py-0 animate-pulse">À TRAITER</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Button size="sm" variant={product.status === 'published' ? "outline" : "default"} onClick={() => handleEditProduct(product)}>
                                  {product.status === 'published' ? 'Modifier' : 'Compléter & Publier'}
                                </Button>
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
                    <Clock className="h-3 w-3" /> En cours ({activeOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="gap-2">
                    <History className="h-3 w-3" /> Archives ({archivedOrders.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active">
                  <Card className="border-none shadow-md overflow-hidden bg-white">
                    {renderOrdersTable(activeOrders)}
                  </Card>
                </TabsContent>
                
                <TabsContent value="archived">
                  <Card className="border-none shadow-md overflow-hidden bg-white">
                    {renderOrdersTable(archivedOrders)}
                  </Card>
                </TabsContent>
              </Tabs>
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
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices && invoices.length > 0 ? invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 font-bold">{inv.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(inv.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={inv.status === 'paid' ? 'bg-green-500' : ''}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold">¥{inv.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Aucune facture.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Global Catalog Selection Dialog */}
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
                {globalProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.imageUrl && <div className="relative w-8 h-8 rounded bg-zinc-100 overflow-hidden"><Image src={p.imageUrl} alt={p.name} fill className="object-cover" /></div>}
                        <span className="text-xs font-bold">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{p.sku}</TableCell>
                    <TableCell className="text-xs">¥{p.price.toFixed(2)}</TableCell>
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

      {/* Invoice Link Dialog */}
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
                    <TableCell className="text-xs font-bold">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{inv.customerName}</TableCell>
                    <TableCell className="text-xs font-bold">¥{inv.totalAmount.toFixed(2)}</TableCell>
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

      {/* Order Preview Dialog */}
      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> 
              Commande {selectedOrderPreview?.orderNumber}
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
                  <div>{getOrderStatusBadge(selectedOrderPreview.status)}</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total</span>
                  <div className="text-2xl font-black text-primary">¥{selectedOrderPreview.totalAmount.toFixed(2)}</div>
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
                      {selectedOrderPreview.items?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2">
                            {item.photo && (
                              <div className="relative w-10 h-10 rounded border bg-white overflow-hidden">
                                <Image src={item.photo} alt={item.description} fill className="object-cover" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="font-medium text-sm">{item.description}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{item.sku}</div>
                          </TableCell>
                          <TableCell className="py-2 text-center font-bold">{item.quantity}</TableCell>
                          <TableCell className="py-2 text-right font-bold">¥{Number(item.total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" /> Adresse de livraison
                </h4>
                <div className="p-4 bg-white border rounded-xl text-sm text-zinc-600 architectural leading-relaxed whitespace-pre-wrap">
                  {selectedOrderPreview.shippingAddress || "Aucune adresse renseignée."}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsOrderPreviewOpen(false)}>Fermer</Button>
            {selectedOrderPreview?.status === 'processing' && (
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
                disabled={isGeneratingQuote === selectedOrderPreview.id}
                onClick={() => handleGenerateQuote(selectedOrderPreview.id)}
              >
                {isGeneratingQuote === selectedOrderPreview.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Générer Proforma
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Edit / Validation Dialog */}
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
                    {editingProduct.images?.map((url: string, idx: number) => {
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
                    <Input 
                      value={editingProduct.name} 
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="font-bold h-10 text-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400">SKU / Réf</Label>
                      <Input 
                        value={editingProduct.sku} 
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
                          value={editingProduct.price} 
                          onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2"><Maximize className="h-3 w-3" /> Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" className="h-9 px-2 text-xs" placeholder="L" value={editingProduct.length} onChange={(e) => setEditingProduct({...editingProduct, length: e.target.value})} />
                      <Input type="number" className="h-9 px-2 text-xs" placeholder="W" value={editingProduct.width} onChange={(e) => setEditingProduct({...editingProduct, width: e.target.value})} />
                      <Input type="number" className="h-9 px-2 text-xs" placeholder="H" value={editingProduct.height} onChange={(e) => setEditingProduct({...editingProduct, height: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2"><Scale className="h-3 w-3" /> Poids (kg)</Label>
                    <Input type="number" step="0.01" className="h-9" value={editingProduct.weight} onChange={(e) => setEditingProduct({...editingProduct, weight: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-zinc-400">Description Technique & Spécifications</Label>
                  <Textarea 
                    rows={15}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    placeholder="Détaillez ici les caractéristiques techniques qui seront visibles par le client (matériaux, certifications, emballage)..."
                    className="text-sm architectural leading-relaxed border-zinc-200 focus:ring-primary shadow-inner"
                  />
                </div>
                <div className="p-4 bg-primary/5 rounded-xl text-xs text-primary/80 border border-primary/10">
                  <p className="font-black mb-1 flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> NOTE DE PUBLICATION</p>
                  <p>Une fois publié, ce produit apparaîtra instantanément dans l'onglet <strong>"Mon Catalogue"</strong> du client avec les prix et médias configurés ci-contre.</p>
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
