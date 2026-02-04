
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
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
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { deleteOrder } from '@/actions/orders';

export default function ClientOrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [productQuantity, setProductQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);

  const [sourcedProducts, setSourcedProducts] = useState<any[]>([]);
  const [isSourcedLoading, setIsSourcedLoading] = useState(false);

  // Order Preview State
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<any | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  // Fetch client profile for pre-filling address
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

  // 1. Fetch Orders
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid)
    );
  }, [db, user]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  // 2. Fetch Invoices
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'invoices'),
      where('customerId', '==', user.uid)
    );
  }, [db, user]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // 3. Fetch Proformas (Quotes)
  const quotesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'quotes'),
      where('customerId', '==', user.uid)
    );
  }, [db, user]);
  const { data: quotes, isLoading: isQuotesLoading } = useCollection(quotesQuery);

  // 4. Sourced Products Aggregation
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

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0;
      const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [invoices]);

  const sortedQuotes = useMemo(() => {
    if (!quotes) return [];
    return [...quotes].sort((a, b) => {
      const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0;
      const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [quotes]);

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

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500">Payée</Badge>;
      case 'unpaid': return <Badge variant="destructive">À payer</Badge>;
      case 'overdue': return <Badge className="bg-red-700">Retard</Badge>;
      case 'partially_paid': return <Badge className="bg-orange-500">Partiel</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setProductQuantity(1);
    setCurrentImageIdx(0);
    setIsProductDialogOpen(true);
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

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const handleViewOrder = (order: any) => {
    setSelectedOrderPreview(order);
    setIsOrderPreviewOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    const result = await deleteOrder(orderId);
    if (result.success) {
      toast({ title: "Commande annulée", description: "Votre commande a été supprimée avec succès." });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la commande." });
    }
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
        totalAmount: cartTotal,
        status: 'processing',
        shippingAddress,
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        quoteId: '', 
      };

      await addDoc(collection(db, 'orders'), orderData);

      toast({ 
        title: "Commande transmise !", 
        description: `Votre commande ${orderNumber} a été envoyée avec succès.` 
      });
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
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Commandes & Factures</h1>
          <p className="text-zinc-500 mt-2">Suivez vos importations et gérez vos documents financiers.</p>
        </div>
        {cart.length > 0 && (
          <Button 
            className="h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 animate-in fade-in zoom-in"
            onClick={() => setIsCartDialogOpen(true)}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Voir mon panier ({cart.length})
          </Button>
        )}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white shadow-sm border p-1 rounded-xl h-auto">
          <TabsTrigger value="orders" className="py-2"><Package className="h-4 w-4 mr-2" /> Commandes</TabsTrigger>
          <TabsTrigger value="quotes" className="py-2"><FileText className="h-4 w-4 mr-2" /> Proformas</TabsTrigger>
          <TabsTrigger value="invoices" className="py-2"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
          <TabsTrigger value="catalog" className="py-2"><Star className="h-4 w-4 mr-2" /> Catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="border-b border-zinc-50">
              <CardTitle>Historique des commandes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isOrdersLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : sortedOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Total (CNY)</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-bold">{order.orderNumber}</TableCell>
                        <TableCell>{order.orderDate ? format(new Date(order.orderDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right font-semibold">¥{order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" /> Voir
                            </Button>
                            {order.status === 'processing' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler cette commande ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible. Votre demande de commande sera définitivement supprimée de notre système.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                      Supprimer la commande
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-20 text-center text-zinc-400">Aucune commande pour le moment.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="border-b border-zinc-50">
              <CardTitle>Mes Factures Proforma</CardTitle>
              <CardDescription>Consultez vos devis et factures proforma validées par votre agent.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isQuotesLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : sortedQuotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Proforma</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedQuotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="pl-6 font-bold">{quote.quoteNumber}</TableCell>
                        <TableCell>{quote.issueDate ? format(new Date(quote.issueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={quote.status === 'accepted' ? 'default' : 'outline'}>{quote.status === 'accepted' ? 'Accepté' : quote.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">¥{quote.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/quotes/${quote.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> Voir PDF
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-20 text-center text-zinc-400">Aucune proforma disponible.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="border-b border-zinc-50">
              <CardTitle>Facturation Finale</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isInvoicesLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : sortedInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Facture</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 font-bold">{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.dueDate ? format(new Date(inv.dueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                        <TableCell className="text-right font-bold">¥{inv.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/invoices/${inv.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> Voir PDF
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-20 text-center text-zinc-400">Aucune facture disponible.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-zinc-800">Votre catalogue personnalisé</h3>
            <p className="text-sm text-zinc-500">Ajoutez les produits validés à votre panier pour commander.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isSourcedLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-zinc-200 animate-pulse rounded-2xl" />)
            ) : sourcedProducts.length > 0 ? (
              sourcedProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="border-none shadow-md bg-white overflow-hidden group flex flex-col hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                  onClick={() => handleOpenProduct(product)}
                >
                  <div className="relative aspect-square bg-zinc-100">
                    <Badge className="absolute top-3 right-3 z-10 bg-primary font-bold text-[10px] uppercase">
                      <Star className="h-3 w-3 mr-1 fill-white" /> Validé
                    </Badge>
                    {product.images && product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-contain p-4" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300"><Package className="h-12 w-12" /></div>
                    )}
                  </div>
                  <CardHeader className="p-4 flex-grow">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mb-1">{product.sku || 'REF-TBC'}</div>
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</CardTitle>
                    <div className="text-xl font-black text-zinc-900 mt-2">¥{Number(product.price || 0).toFixed(2)}</div>
                  </CardHeader>
                  <div className="p-4 pt-0">
                    <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-primary hover:text-white font-bold transition-all border-none">
                      Voir & Ajouter
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-20 text-center bg-white rounded-2xl border-2 border-dashed text-zinc-400">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p>Votre catalogue personnalisé est vide.</p>
                <p className="text-sm mt-2">Dès que nous validerons vos demandes de sourcing, les produits apparaîtront ici.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Cart Mobile Indicator */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          <Button 
            className="h-16 w-16 rounded-full bg-primary text-white shadow-2xl animate-bounce"
            onClick={() => setIsCartDialogOpen(true)}
          >
            <ShoppingBag className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 bg-zinc-900 h-6 w-6 flex items-center justify-center p-0 rounded-full border-2 border-white">{cart.length}</Badge>
          </Button>
        </div>
      )}

      {/* Cart Review Dialog */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" /> Mon Panier
            </DialogTitle>
            <DialogDescription>
              Vérifiez vos articles avant de valider votre demande de commande.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="border rounded-xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right pr-4">Sous-total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-3">
                        {item.photo && (
                          <div className="relative w-12 h-12 rounded border bg-zinc-50 overflow-hidden">
                            <Image src={item.photo} alt={item.name} fill className="object-cover" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-[10px] text-zinc-400">¥{item.unitPrice.toFixed(2)} / unité</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateCartItemQuantity(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-black">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateCartItemQuantity(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right pr-4 font-black">
                        ¥{item.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-300 hover:text-red-500" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-grow space-y-2">
                <Label htmlFor="checkout-address" className="font-bold text-zinc-700">Adresse de livraison</Label>
                <Textarea 
                  id="checkout-address" 
                  placeholder="Précisez le port ou l'entrepôt de destination..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="h-24 bg-zinc-50 border-zinc-200"
                />
              </div>
              <Card className="w-full md:w-72 bg-zinc-950 text-white border-none shadow-xl">
                <CardHeader className="pb-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Total de la commande</span>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-primary">¥{cartTotal.toFixed(2)}</div>
                  <p className="text-[10px] text-zinc-500 mt-4 leading-tight italic">
                    Note : Les frais de transport et commissions seront détaillés dans la Proforma finale.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black"
                    onClick={handleConfirmOrder}
                    disabled={isSubmittingOrder || !shippingAddress || cart.length === 0}
                  >
                    {isSubmittingOrder ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                    COMMANDER
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Preview Dialog (History) */}
      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> 
              Détails de la commande {selectedOrderPreview?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Passée le {selectedOrderPreview?.orderDate && format(new Date(selectedOrderPreview.orderDate), 'dd MMMM yyyy à HH:mm')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderPreview && (
            <div className="space-y-8 py-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Statut Actuel</span>
                  <div className="flex items-center gap-2">
                    {getOrderStatusBadge(selectedOrderPreview.status)}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Montant Total</span>
                  <div className="text-2xl font-black text-primary">¥{selectedOrderPreview.totalAmount.toFixed(2)}</div>
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
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right pr-4">Total</TableHead>
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
                          <TableCell className="py-2 text-center text-sm font-bold">{item.quantity}</TableCell>
                          <TableCell className="py-2 text-right text-xs text-zinc-500">¥{Number(item.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-right pr-4 font-bold text-sm">¥{Number(item.total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" /> Destination de livraison
                </h4>
                <div className="p-4 bg-white border rounded-xl text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {selectedOrderPreview.shippingAddress || "Aucune adresse renseignée."}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" className="w-full h-12 font-bold" onClick={() => setIsOrderPreviewOpen(false)}>Fermer l'aperçu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog (Catalog) */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold text-primary">Détails de l'article</DialogTitle>
            <DialogDescription>Consultez les spécifications validées par votre agent.</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              {/* Left: Media Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-2xl border bg-zinc-50 overflow-hidden shadow-inner">
                  {selectedProduct.images?.[currentImageIdx] ? (
                    <Image 
                      src={selectedProduct.images[currentImageIdx]} 
                      alt={selectedProduct.name} 
                      fill 
                      className="object-contain p-4" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200"><Package className="h-20 w-20 text-zinc-200" /></div>
                  )}
                  
                  {selectedProduct.images?.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                      <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 opacity-70" onClick={() => setCurrentImageIdx(prev => (prev > 0 ? prev - 1 : selectedProduct.images.length - 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 opacity-70" onClick={() => setCurrentImageIdx(prev => (prev < selectedProduct.images.length - 1 ? prev + 1 : 0))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct.images?.map((url: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentImageIdx(idx)}
                      className={cn(
                        "relative w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition-all",
                        currentImageIdx === idx ? "border-primary" : "border-transparent opacity-60"
                      )}
                    >
                      <Image src={url} alt="thumbnail" fill className="object-cover" />
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Spécifications Techniques</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Poids</span>
                      <span className="font-bold">{selectedProduct.weight || '-'} kg</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Dimensions (L*W*H)</span>
                      <span className="font-bold">{selectedProduct.length || '0'}x{selectedProduct.width || '0'}x{selectedProduct.height || '0'} cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Info & Add to Cart */}
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">Réf: {selectedProduct.sku || 'TBC'}</Badge>
                  <h3 className="text-2xl font-bold text-zinc-900 leading-tight">{selectedProduct.name}</h3>
                  <div className="text-3xl font-black text-primary mt-2">¥{Number(selectedProduct.price || 0).toFixed(2)} <span className="text-xs font-normal text-zinc-400 uppercase">/ Unité</span></div>
                </div>

                <div className="prose prose-sm text-zinc-600 max-h-40 overflow-y-auto border-y py-4">
                  <p className="whitespace-pre-wrap">{selectedProduct.description || "Aucune description technique fournie."}</p>
                </div>

                <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <div className="space-y-2">
                    <Label htmlFor="qty" className="font-bold text-zinc-700">Quantité à ajouter</Label>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        id="qty" 
                        type="number" 
                        min="1" 
                        value={productQuantity} 
                        onChange={(e) => setProductQuantity(Number(e.target.value))}
                        className="bg-white border-zinc-200 h-12 text-center font-black text-lg"
                      />
                      <Button variant="outline" className="h-12 w-12 rounded-xl" onClick={() => setProductQuantity(productQuantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-500">Sous-total :</div>
                    <div className="text-2xl font-black text-zinc-900">¥{(Number(selectedProduct.price || 0) * productQuantity).toFixed(2)}</div>
                  </div>

                  <Button 
                    className="w-full h-14 bg-zinc-950 text-white hover:bg-primary text-lg font-black transition-all"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    AJOUTER AU PANIER
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
