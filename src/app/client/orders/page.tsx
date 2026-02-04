
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
  Euro
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState, useMemo, useEffect, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CurrencyContext } from '@/context/currency-context';

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
  const [shippingAddress, setShippingAddress] = useState('');
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

  useEffect(() => {
    if (profile?.address && !shippingAddress) {
      setShippingAddress(profile.address);
    }
  }, [profile, shippingAddress]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('customerId', '==', user.uid));
  }, [db, user]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'invoices'), where('customerId', '==', user.uid));
  }, [db, user]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const quotesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', user.uid));
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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.total * rate), 0);
  }, [cart, rate]);

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

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setProductQuantity(1);
    setCurrentImageIdx(0);
    setIsProductDialogOpen(true);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrderPreview(order);
    setIsOrderPreviewOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const existingIdx = cart.findIndex(item => item.id === selectedProduct.id);
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].quantity += productQuantity;
      newCart[existingIdx].total = newCart[existingIdx].quantity * newCart[existingIdx].unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku || '',
        quantity: productQuantity,
        unitPrice: Number(selectedProduct.price || 0),
        total: productQuantity * Number(selectedProduct.price || 0),
        photo: selectedProduct.images?.[0] || ''
      }]);
    }
    toast({ title: "Produit ajouté", description: `${selectedProduct.name} est dans votre panier.` });
    setIsProductDialogOpen(false);
  };

  const updateCartItemQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const handleConfirmOrder = async () => {
    if (!user || cart.length === 0 || !db) return;
    setIsSubmittingOrder(true);
    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const orderData = {
        orderNumber,
        customerId: user.uid,
        customerName: `${profile?.firstName} ${profile?.lastName}`,
        items: cart.map(item => ({
          description: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          photo: item.photo
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.total, 0),
        status: 'processing',
        shippingAddress,
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        isPaid: false,
      };
      await addDoc(collection(db, 'orders'), orderData);
      toast({ title: "Commande transmise !", description: `Votre commande ${orderNumber} a été envoyée.` });
      setCart([]);
      setIsCartDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de valider la commande." });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Commandes & Documents</h1>
          <p className="text-zinc-500 mt-2">Suivez vos importations et gérez vos documents en Euro (€).</p>
        </div>
        {cart.length > 0 && (
          <Button className="h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-lg" onClick={() => setIsCartDialogOpen(true)}>
            <ShoppingCart className="mr-2 h-5 w-5" /> Panier (€{cartTotal.toFixed(2)})
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
              {isOrdersLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Commande</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-center">Paiement</TableHead>
                      <TableHead className="text-right">Total (€)</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-bold">{order.orderNumber}</TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-center">
                          {order.isPaid ? (
                            <Badge className="bg-green-100 text-green-700">PAYÉ</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-500">ATTENTE</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-black">€{(order.totalAmount * rate).toFixed(2)}</TableCell>
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
              {isQuotesLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div> : quotes && quotes.length > 0 ? (
                <Table>
                  <TableHeader><TableRow className="bg-zinc-50/50"><TableHead className="pl-6">N° Proforma</TableHead><TableHead>Statut</TableHead><TableHead className="text-right pr-6">Total (€)</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {quotes.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="pl-6 font-bold">{q.quoteNumber}</TableCell>
                        <TableCell><Badge variant={q.status === 'accepted' ? 'default' : 'outline'}>{q.status}</Badge></TableCell>
                        <TableCell className="text-right pr-6 font-black text-primary">€{(q.totalAmount * (q.exchangeRate || rate)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune proforma.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isInvoicesLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div> : invoices && invoices.length > 0 ? (
                <Table>
                  <TableHeader><TableRow className="bg-zinc-50/50"><TableHead className="pl-6">N° Facture</TableHead><TableHead>Statut</TableHead><TableHead className="text-right pr-6">Total (€)</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 font-bold">{inv.invoiceNumber}</TableCell>
                        <TableCell><Badge className={inv.status === 'paid' ? 'bg-green-500' : ''}>{inv.status}</Badge></TableCell>
                        <TableCell className="text-right pr-6 font-black text-primary">€{(inv.totalAmount * (inv.exchangeRate || rate)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune facture.</div>}
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
                    <div className="text-xl font-black text-primary mt-2">€{(p.price * rate).toFixed(2)}</div>
                  </div>
                </Card>
              ))
            ) : <div className="col-span-full p-20 text-center text-zinc-400">Catalogue vide.</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="text-primary" /> Mon Panier (€)</DialogTitle></DialogHeader>
          <div className="py-4 space-y-6">
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50"><TableRow><TableHead>Produit</TableHead><TableHead className="text-center">Qté</TableHead><TableHead className="text-right">Total (€)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-sm">{item.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span>{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-black">€{(item.total * rate).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-grow space-y-2">
                <Label className="font-bold">Destination de livraison</Label>
                <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="h-24" placeholder="Port, entrepôt..." />
              </div>
              <Card className="w-full md:w-72 bg-zinc-950 text-white p-6">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total Commande</span>
                <div className="text-3xl font-black text-primary">€{cartTotal.toFixed(2)}</div>
                <Button className="w-full mt-6 h-12 bg-primary font-bold" onClick={handleConfirmOrder} disabled={isSubmittingOrder || !shippingAddress || cart.length === 0}>
                  {isSubmittingOrder ? <Loader2 className="animate-spin" /> : "VALIDER LA COMMANDE"}
                </Button>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              <div className="relative aspect-square rounded-2xl border bg-zinc-50 overflow-hidden">
                {selectedProduct.images?.[currentImageIdx] && <Image src={selectedProduct.images[currentImageIdx]} alt="Product" fill className="object-contain p-4" />}
              </div>
              <div className="space-y-6">
                <Badge variant="outline" className="text-primary">REF: {selectedProduct.sku}</Badge>
                <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                <div className="text-3xl font-black text-primary">€{(selectedProduct.price * rate).toFixed(2)} <span className="text-xs text-zinc-400 font-normal">/ Unité</span></div>
                <div className="prose prose-sm text-zinc-600 max-h-40 overflow-y-auto border-y py-4">{selectedProduct.description}</div>
                <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl">
                  <Label className="font-bold">Quantité</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-12 w-12" onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}><Minus /></Button>
                    <Input className="h-12 text-center font-black text-lg" value={productQuantity} readOnly />
                    <Button variant="outline" className="h-12 w-12" onClick={() => setProductQuantity(productQuantity + 1)}><Plus /></Button>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="font-medium text-zinc-500">Sous-total :</span>
                    <span className="text-2xl font-black">€{(selectedProduct.price * productQuantity * rate).toFixed(2)}</span>
                  </div>
                  <Button className="w-full h-14 bg-zinc-950 text-white font-black hover:bg-primary" onClick={handleAddToCart}>
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
                  <div className="text-2xl font-black text-primary">€{(selectedOrderPreview.totalAmount * rate).toFixed(2)}</div>
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
                        <TableHead className="text-right">Total (€)</TableHead>
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
                          <TableCell className="py-2 text-right font-bold">€{(item.total * rate).toFixed(2)}</TableCell>
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
                  <div className="p-4 bg-white border rounded-xl text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                    {selectedOrderPreview.shippingAddress || "Aucune adresse renseignée."}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" /> Statut du Paiement
                  </h4>
                  <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3",
                    selectedOrderPreview.isPaid ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                  )}>
                    {selectedOrderPreview.isPaid ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-bold">{selectedOrderPreview.isPaid ? "Paiement confirmé" : "Paiement en attente"}</span>
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
