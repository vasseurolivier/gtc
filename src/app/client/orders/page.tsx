
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Package, 
  Receipt, 
  ShoppingCart, 
  Eye, 
  Star, 
  MapPin, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  CreditCard,
  AlertCircle,
  Euro,
  Download,
  Hash,
  Ruler,
  Coins,
  ShieldCheck,
  Building2 
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState, useMemo, useEffect, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CurrencyContext } from '@/context/currency-context';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const WAREHOUSE_3PL_ADDRESS = "Entrepôt Central GTC - Service Logistique 3PL\n浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501\nYiwu, Zhejiang, China";

export default function ClientOrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const currencyContext = useContext(CurrencyContext);
  const rate = currencyContext?.exchangeRate || 0.13;
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [is3PLSelected, setIs3PLSelected] = useState(false);
  const [orderSuffix, setOrderSuffix] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const [cart, setCart] = useState<any[]>([]);
  const [sourcedProducts, setSourcedProducts] = useState<any[]>([]);
  const [isSourcedLoading, setIsSourcedLoading] = useState(false);
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<any | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'clients', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  // Preference Euro/CNY
  const currencyPreference = profile?.currencyPreference || 'EUR';

  useEffect(() => {
    if (profile?.address && !shippingAddress && !is3PLSelected) {
      setShippingAddress(profile.address);
    }
  }, [profile, shippingAddress, is3PLSelected]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('customerId', '==', user.uid));
  }, [db, user]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'clients', user.uid, 'invoices');
  }, [db, user]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const quotesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'clients', user.uid, 'quotes');
  }, [db, user]);
  const { data: quotes, isLoading: isQuotesLoading } = useCollection(quotesQuery);

  const listsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'clients', user.uid, 'productLists');
  }, [db, user]);
  const { data: clientLists } = useCollection(listsQuery);

  useEffect(() => {
    if (!db || !user || !clientLists || clientLists.length === 0) {
      setSourcedProducts([]);
      return;
    }
    async function fetchAllSourced() {
      setIsSourcedLoading(true);
      try {
        const allProducts: any[] = [];
        for (const list of clientLists!) {
          const prodCol = collection(db!, 'clients', user!.uid, 'productLists', list.id, 'products');
          const q = query(prodCol, where('status', '==', 'published'));
          const snap = await getDocs(q);
          snap.forEach(doc => allProducts.push({ ...doc.data(), id: doc.id }));
        }
        setSourcedProducts(allProducts);
      } catch (e) {
        console.error("Aggregation error:", e);
      } finally {
        setIsSourcedLoading(false);
      }
    }
    fetchAllSourced();
  }, [db, user, clientLists]);

  // SMART SORTING LOGIC (Pending on top, then Creation Date Desc)
  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const isPendingA = a.paymentStatus !== 'paid' ? 1 : 0;
      const isPendingB = b.paymentStatus !== 'paid' ? 1 : 0;
      if (isPendingA !== isPendingB) return isPendingB - isPendingA;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [orders]);

  const sortedQuotes = useMemo(() => {
    if (!quotes) return [];
    return [...quotes].sort((a, b) => {
      const isPendingA = (a.status !== 'accepted' && a.status !== 'paid') ? 1 : 0;
      const isPendingB = (b.status !== 'accepted' && b.status !== 'paid') ? 1 : 0;
      if (isPendingA !== isPendingB) return isPendingB - isPendingA;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [quotes]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      const isPendingA = a.status !== 'paid' ? 1 : 0;
      const isPendingB = b.status !== 'paid' ? 1 : 0;
      if (isPendingA !== isPendingB) return isPendingB - isPendingA;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [invoices]);

  const cartTotalCny = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-500">Livré</Badge>;
      case 'shipped': return <Badge className="bg-blue-500">Expédié</Badge>;
      case 'validated': return <Badge className="bg-green-600 font-black">VALIDÉ !</Badge>;
      case 'processing': return <Badge variant="outline">En cours</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-700">PAYÉ</Badge>;
      case 'deposit_paid': return <Badge variant="outline" className="text-blue-600 border-blue-200">ACOMPTE RÉGLÉ</Badge>;
      case 'unpaid': return <Badge variant="outline" className="text-red-500">EN ATTENTE</Badge>;
      default: return <Badge variant="outline">EN ATTENTE</Badge>;
    }
  };

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setProductQuantity(1);
    setSelectedSize(null);
    setCurrentImageIdx(0);
    setIsProductDialogOpen(true);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrderPreview(order);
    setIsOrderPreviewOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    if (selectedProduct.hasSizeSelection && !selectedSize) {
      toast({ variant: "destructive", title: "Taille requise", description: "Veuillez sélectionner une taille pour cet article." });
      return;
    }

    const finalQuantity = Math.max(1, productQuantity);
    const itemKey = `${selectedProduct.id}-${selectedSize || 'no-size'}`;
    const existingIdx = cart.findIndex(item => item.key === itemKey);
    
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].quantity += finalQuantity;
      newCart[existingIdx].total = newCart[existingIdx].quantity * newCart[existingIdx].unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        key: itemKey,
        id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku || '',
        quantity: finalQuantity,
        unitPrice: Number(selectedProduct.price || 0),
        total: finalQuantity * Number(selectedProduct.price || 0),
        photo: selectedProduct.images?.[0] || '',
        size: selectedSize
      }]);
    }
    toast({ title: "Produit ajouté", description: `${selectedProduct.name} ${selectedSize ? `(Taille ${selectedSize})` : ''} est dans votre panier.` });
    setIsProductDialogOpen(false);
  };

  const updateCartItemQuantity = (key: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.key === key) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (key: string) => {
    setCart(cart.filter(item => item.key !== key));
  };

  const toggle3PLService = (checked: boolean) => {
    setIs3PLSelected(checked);
    if (checked) {
      setShippingAddress(WAREHOUSE_3PL_ADDRESS);
    } else {
      setShippingAddress(profile?.address || '');
    }
  };

  const handleConfirmOrder = async () => {
    if (!user || cart.length === 0 || !db) return;
    if (!orderSuffix) {
      toast({ variant: "destructive", title: "Champ requis", description: "Veuillez choisir un numéro de commande." });
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const prefix = profile?.orderPrefix || 'ORD';
      const orderNumber = `${prefix}${orderSuffix.toUpperCase()}`;
      
      const orderData = {
        orderNumber,
        customerId: user.uid,
        customerName: `${profile?.firstName} ${profile?.lastName}`,
        items: cart.map(item => ({
          description: item.name + (item.size ? ` (Taille: ${item.size})` : ''),
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          photo: item.photo,
          size: item.size || null
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.total, 0),
        status: 'processing',
        shippingAddress,
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        paymentStatus: 'unpaid',
      };
      await addDoc(collection(db, 'orders'), orderData);
      toast({ title: "Commande transmise !", description: `Votre commande ${orderNumber} a été envoyée.` });
      setCart([]);
      setOrderSuffix('');
      setIsCartDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de valider la commande." });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const renderPrice = (priceCny: number, mainClass = "text-primary font-black") => {
    const priceEur = priceCny * rate;
    if (currencyPreference === 'EUR') {
      return <div className={mainClass}>€{priceEur.toFixed(2)}</div>;
    }
    if (currencyPreference === 'CNY') {
      return <div className={mainClass}>¥{priceCny.toFixed(2)}</div>;
    }
    return (
      <div className="flex flex-col">
        <div className={mainClass}>€{priceEur.toFixed(2)}</div>
        <div className="text-[10px] text-zinc-400 font-bold">¥{priceCny.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Commandes & Documents</h1>
          <p className="text-zinc-500 mt-2">Suivez vos importations et gérez vos documents officiels.</p>
        </div>
        {cart.length > 0 && (
          <Button className="h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-lg" onClick={() => setIsCartDialogOpen(true)}>
            <ShoppingCart className="mr-2 h-5 w-5" /> Panier ({currencyPreference === 'CNY' ? `¥${cartTotalCny.toFixed(2)}` : `€${(cartTotalCny * rate).toFixed(2)}`})
          </Button>
        )}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border p-1 rounded-xl h-auto">
          <TabsTrigger value="orders" className="py-2"><Package className="h-4 w-4 mr-2" /> Commandes</TabsTrigger>
          <TabsTrigger value="quotes" className="py-2"><FileText className="h-4 w-4 mr-2" /> Proformas</TabsTrigger>
          <TabsTrigger value="invoices" className="py-2"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
          <TabsTrigger value="catalog" className="py-2"><Star className="h-4 w-4 mr-2" /> Catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isOrdersLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : sortedOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-center">Paiement</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order.id} className={cn(order.paymentStatus !== 'paid' && "bg-primary/5")}>
                        <TableCell className="pl-6 py-4 font-bold">
                          <div className="flex items-center gap-2">
                            {order.orderNumber}
                            {order.paymentStatus !== 'paid' && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {order.orderDate ? format(parseSafeDate(order.orderDate), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-center">
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderPrice(order.totalAmount, "font-black text-zinc-900")}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune commande.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isQuotesLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : sortedQuotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Proforma</TableHead>
                      <TableHead>Date d'émission</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Documents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedQuotes.map((q) => {
                      const isPending = q.status !== 'accepted' && q.status !== 'paid';
                      return (
                        <TableRow key={q.id} className={cn(isPending && "bg-primary/5")}>
                          <TableCell className="pl-6 font-bold">
                            <div className="flex items-center gap-2">
                              {q.quoteNumber}
                              {isPending && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {q.issueDate ? format(parseSafeDate(q.issueDate), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell><Badge variant={q.status === 'accepted' || q.status === 'paid' ? 'default' : 'outline'}>{q.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            {renderPrice(q.totalAmount, "font-black text-primary")}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/client/quotes/${q.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune proforma.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isInvoicesLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : sortedInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Facture</TableHead>
                      <TableHead>Émise le</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Documents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInvoices.map((inv) => {
                      const isPending = inv.status !== 'paid';
                      return (
                        <TableRow key={inv.id} className={cn(isPending && "bg-red-50/30")}>
                          <TableCell className="pl-6 font-bold">
                            <div className="flex items-center gap-2">
                              {inv.invoiceNumber}
                              {isPending && <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {inv.issueDate ? format(parseSafeDate(inv.issueDate), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-xs">{inv.dueDate ? format(parseSafeDate(inv.dueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={inv.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                              {inv.status === 'paid' ? 'Acquittée' : 'À régler'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {renderPrice(inv.totalAmount, "font-black text-primary")}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="icon" asChild disabled={inv.status !== 'paid'}>
                              <Link href={`/client/invoices/${inv.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune facture enregistrée.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isSourcedLoading ? [1,2,3,4].map(i => <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />) : sourcedProducts.length > 0 ? (
              sourcedProducts.map((p) => (
                <Card key={p.id} className="border-none shadow-md overflow-hidden bg-white hover:ring-2 hover:ring-primary/50 cursor-pointer" onClick={() => handleOpenProduct(p)}>
                  <div className="relative aspect-square bg-zinc-50">
                    {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-contain p-4" /> : <Package className="h-12 w-12 mx-auto mt-20 text-zinc-200" />}
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">{p.sku}</div>
                    <CardTitle className="text-base mt-1">{p.name}</CardTitle>
                    <div className="mt-2">{renderPrice(p.price, "text-xl font-black text-primary")}</div>
                  </div>
                </Card>
              ))
            ) : <div className="col-span-full p-20 text-center text-zinc-400">Catalogue vide.</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="text-primary" /> Mon Panier</DialogTitle></DialogHeader>
          <div className="py-4 space-y-6">
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50"><TableRow><TableHead>Produit</TableHead><TableHead className="text-center">Qté</TableHead><TableHead className="text-right">Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{item.name}</span>
                          {item.size && <Badge variant="secondary" className="w-fit text-[10px] h-4 mt-1">Taille: {item.size}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.key, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="font-bold">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.key, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderPrice(item.total, "font-black text-zinc-900")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.key)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2 text-zinc-700">
                    <Hash className="h-4 w-4 text-primary" /> Référence de commande
                  </Label>
                  <div className="flex items-center">
                    <div className="h-10 px-3 bg-zinc-100 border border-r-0 rounded-l-md flex items-center justify-center font-black text-zinc-500">
                      {profile?.orderPrefix || 'ORD'}
                    </div>
                    <Input 
                      className="rounded-l-none font-bold uppercase focus-visible:ring-primary" 
                      placeholder="ex: 2024-001" 
                      value={orderSuffix}
                      onChange={(e) => setOrderSuffix(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Le numéro final sera : {(profile?.orderPrefix || 'ORD') + (orderSuffix || '...')}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold flex items-center gap-2 text-zinc-700">
                      <MapPin className="h-4 w-4 text-primary" /> Destination de livraison
                    </Label>
                    
                    {/* Option 3PL Warehouse */}
                    <div 
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer flex items-start gap-3",
                        is3PLSelected ? "border-primary bg-primary/5 shadow-inner" : "border-zinc-100 bg-zinc-50 hover:border-zinc-200"
                      )}
                      onClick={() => toggle3PLService(!is3PLSelected)}
                    >
                      <Checkbox 
                        id="3pl-option" 
                        checked={is3PLSelected} 
                        onCheckedChange={(checked) => toggle3PLService(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="3pl-option" className="font-black text-sm cursor-pointer flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> 
                          Service 3PL (Entrepôt GTC)
                        </Label>
                        <p className="text-[10px] text-zinc-500 leading-tight">
                          Livrez vos marchandises directement dans notre centre de logistique à Yiwu pour consolidation ou expédition ultérieure.
                        </p>
                      </div>
                    </div>

                    <Textarea 
                      value={shippingAddress} 
                      onChange={(e) => {
                        setShippingAddress(e.target.value);
                        if (is3PLSelected && e.target.value !== WAREHOUSE_3PL_ADDRESS) {
                          setIs3PLSelected(false);
                        }
                      }} 
                      className="h-24 focus-visible:ring-primary text-sm leading-relaxed" 
                      placeholder="Port, entrepôt ou adresse finale..." 
                    />
                  </div>
                </div>
              </div>

              <Card className="bg-zinc-950 text-white p-6 h-fit rounded-2xl border-none shadow-2xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total Estimé</span>
                <div className="mt-1">
                  {currencyPreference === 'CNY' ? (
                    <div className="text-3xl font-black text-primary">¥{cartTotalCny.toFixed(2)}</div>
                  ) : currencyPreference === 'EUR' ? (
                    <div className="text-3xl font-black text-primary">€{(cartTotalCny * rate).toFixed(2)}</div>
                  ) : (
                    <>
                      <div className="text-3xl font-black text-primary">€{(cartTotalCny * rate).toFixed(2)}</div>
                      <div className="text-sm text-zinc-400 font-bold">¥{cartTotalCny.toFixed(2)}</div>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
                  Note : Les frais de transport seront ajustés par votre agent après réception de la commande.
                </div>
                <Button className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl" onClick={handleConfirmOrder} disabled={isSubmittingOrder || !shippingAddress || cart.length === 0 || !orderSuffix}>
                  {isSubmittingOrder ? <Loader2 className="animate-spin" /> : "TRANSMETTRE LA COMMANDE"}
                </Button>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              <div className="space-y-4">
                <div className="relative aspect-square rounded-2xl border bg-zinc-50 overflow-hidden shadow-inner">
                  {selectedProduct.images?.[currentImageIdx] && <Image src={selectedProduct.images[currentImageIdx]} alt="Product" fill className="object-contain p-4" />}
                </div>
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProduct.images.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setCurrentImageIdx(idx)} className={cn("relative w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition-all", currentImageIdx === idx ? "border-primary" : "border-transparent opacity-60")}>
                        <Image src={img} alt="thumb" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-primary border-primary/30">REF: {selectedProduct.sku}</Badge>
                  <h3 className="text-3xl font-black text-zinc-900">{selectedProduct.name}</h3>
                  <div>
                    {renderPrice(selectedProduct.price, "text-3xl font-black text-primary")}
                    <span className="text-xs text-zinc-400 font-normal">/ Unité</span>
                  </div>
                </div>

                <div className="prose prose-sm text-zinc-600 max-h-40 overflow-y-auto border-y py-4 leading-relaxed">
                  {selectedProduct.description || "Aucune description technique."}
                </div>

                {selectedProduct.hasSizeSelection && (
                  <div className="space-y-3">
                    <Label className="font-black text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Ruler className="h-3 w-3" /> Sélectionner une taille
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {SIZES.map((size) => (
                        <Button 
                          key={size} 
                          variant={selectedSize === size ? "default" : "outline"}
                          className={cn("h-10 font-bold transition-all", selectedSize === size ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-105" : "hover:border-primary/50")}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <Label className="font-black text-xs uppercase tracking-widest text-zinc-400">Quantité souhaitée</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-12 w-12 rounded-xl bg-white" onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}><Minus className="h-4 w-4" /></Button>
                    <Input 
                      type="number"
                      min="1"
                      className="h-12 text-center font-black text-xl bg-white border-zinc-200 rounded-xl" 
                      value={productQuantity} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setProductQuantity(isNaN(val) ? 0 : val);
                      }}
                      onBlur={() => {
                        if (productQuantity < 1) setProductQuantity(1);
                      }}
                    />
                    <Button variant="outline" className="h-12 w-12 rounded-xl bg-white" onClick={() => setProductQuantity(productQuantity + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
                    <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider">Sous-total :</span>
                    <span className="text-right">
                      {renderPrice(selectedProduct.price * Math.max(1, productQuantity), "text-2xl font-black text-zinc-900")}
                    </span>
                  </div>
                  <Button className="w-full h-14 bg-zinc-950 text-white font-black hover:bg-primary transition-all rounded-xl shadow-xl shadow-zinc-900/10" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> AJOUTER AU PANIER
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> 
              Détails Commande {selectedOrderPreview?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Historique et récapitulatif de votre demande.
            </DialogDescription>
          </DialogHeader>

          {selectedOrderPreview && (
            <div className="space-y-8 py-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Statut Actuel</span>
                  <div>{getOrderStatusBadge(selectedOrderPreview.status)}</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Montant Total</span>
                  <div>{renderPrice(selectedOrderPreview.totalAmount, "text-2xl font-black text-primary")}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-zinc-400" /> Articles commandés
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
                            <div className="font-medium text-sm">
                              {item.description}
                              {item.size && <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1">{item.size}</Badge>}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">{item.sku}</div>
                          </TableCell>
                          <TableCell className="py-2 text-center font-bold">{item.quantity}</TableCell>
                          <TableCell className="py-2 text-right">
                            {renderPrice(item.total, "font-bold text-zinc-900")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" /> Adresse de livraison
                  </h4>
                  <div className="p-4 bg-white border rounded-xl text-sm text-zinc-600 architectural leading-relaxed whitespace-pre-wrap min-h-[80px]">
                    {selectedOrderPreview.shippingAddress || "Aucune adresse renseignée."}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" /> Statut du Paiement
                  </h4>
                  <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3",
                    selectedOrderPreview.paymentStatus === 'paid' ? "bg-green-50 text-green-700 border border-green-100" : 
                    selectedOrderPreview.paymentStatus === 'deposit_paid' ? "bg-blue-50 text-blue-700 border border-blue-100" :
                    "bg-red-50 text-red-700 border border-red-100"
                  )}>
                    {selectedOrderPreview.paymentStatus === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-bold">
                      {selectedOrderPreview.paymentStatus === 'paid' ? "Paiement total confirmé" : 
                       selectedOrderPreview.paymentStatus === 'deposit_paid' ? "Acompte réglé (En attente du solde)" :
                       "En attente de règlement"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground italic px-4 border-t pt-4">
                Date de commande : {selectedOrderPreview.orderDate ? format(parseSafeDate(selectedOrderPreview.orderDate), 'dd/MM/yyyy HH:mm') : '-'}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" className="w-full font-bold h-12 rounded-xl" onClick={() => setIsOrderPreviewOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
