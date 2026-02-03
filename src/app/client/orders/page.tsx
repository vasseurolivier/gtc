
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Package, Receipt, ShoppingCart, Eye, Star, MapPin, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ClientOrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const [sourcedProducts, setSourcedProducts] = useState<any[]>([]);
  const [isSourcedLoading, setIsSourcedLoading] = useState(false);

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

  // 3. Sourced Products Aggregation
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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-500">Livré</Badge>;
      case 'shipped': return <Badge className="bg-blue-500">Expédié</Badge>;
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
    setOrderQuantity(product.quantity || 1);
    setCurrentImageIdx(0);
    setIsOrderDialogOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!user || !selectedProduct || !db) return;
    setIsSubmittingOrder(true);

    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const totalAmount = Number(selectedProduct.price || 0) * orderQuantity;

      const orderData = {
        orderNumber,
        customerId: user.uid,
        customerName: `${profile?.firstName} ${profile?.lastName}`,
        items: [{
          description: selectedProduct.name,
          sku: selectedProduct.sku || '',
          quantity: orderQuantity,
          unitPrice: Number(selectedProduct.price || 0),
          total: totalAmount,
          photo: selectedProduct.images?.[0] || ''
        }],
        totalAmount,
        status: 'processing',
        shippingAddress,
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        quoteId: '', // Direct order from catalog
      };

      await addDoc(collection(db, 'orders'), orderData);

      toast({ 
        title: "Commande enregistrée !", 
        description: `Votre commande ${orderNumber} a été transmise à notre équipe en Chine.` 
      });
      setIsOrderDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de finaliser la commande." });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-zinc-900">Commandes & Factures</h1>
        <p className="text-zinc-500 mt-2">Suivez vos importations et gérez vos documents financiers.</p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-white shadow-sm border p-1 rounded-xl">
          <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2" /> Commandes</TabsTrigger>
          <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
          <TabsTrigger value="catalog"><Star className="h-4 w-4 mr-2" /> Mon Catalogue</TabsTrigger>
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
                      <TableHead className="text-right pr-6">Total (CNY)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-bold">{order.orderNumber}</TableCell>
                        <TableCell>{order.orderDate ? format(new Date(order.orderDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right pr-6 font-semibold">¥{order.totalAmount.toFixed(2)}</TableCell>
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

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="border-b border-zinc-50">
              <CardTitle>Facturation</CardTitle>
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
                              <Eye className="h-4 w-4 mr-2" /> Voir
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
            <h3 className="text-lg font-bold text-zinc-800">Vos produits sourcés</h3>
            <p className="text-sm text-zinc-500">Cliquez sur un article pour voir les détails techniques et commander.</p>
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
                      Voir & Commander
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

      {/* Product Detail & Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold text-primary">Détails de l'article</DialogTitle>
            <DialogDescription>Consultez les spécifications validées par votre agent et passez commande.</DialogDescription>
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
                    <div className="w-full h-full flex items-center justify-center"><Package className="h-20 w-20 text-zinc-200" /></div>
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

              {/* Right: Info & Order Form */}
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
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qty" className="font-bold text-zinc-700">Quantité souhaitée</Label>
                      <Input 
                        id="qty" 
                        type="number" 
                        min="1" 
                        value={orderQuantity} 
                        onChange={(e) => setOrderQuantity(Number(e.target.value))}
                        className="bg-white border-zinc-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-bold text-zinc-700">Adresse de livraison</Label>
                      <Textarea 
                        id="address" 
                        placeholder="Précisez l'entrepôt ou le port de destination..."
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="bg-white border-zinc-200 h-24"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-500">Estimation du total :</div>
                    <div className="text-2xl font-black text-zinc-900">¥{(Number(selectedProduct.price || 0) * orderQuantity).toFixed(2)}</div>
                  </div>

                  <Button 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black shadow-lg shadow-primary/20"
                    onClick={handleConfirmOrder}
                    disabled={isSubmittingOrder || !shippingAddress || orderQuantity < 1}
                  >
                    {isSubmittingOrder ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                    )}
                    PASSER LA COMMANDE
                  </Button>
                  <p className="text-[10px] text-center text-zinc-400 italic">Une proforma officielle sera générée par votre agent après vérification.</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
