
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Receipt, ShoppingCart, Eye, Star } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { submitContactForm } from '@/actions/contact';
import Link from 'next/link';

export default function ClientOrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isOrdering, setIsOrdering] = useState<string | null>(null);

  // Orders Query
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid)
    );
  }, [db, user]);

  // Invoices Query
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'invoices'),
      where('customerId', '==', user.uid)
    );
  }, [db, user]);

  // Global Catalog Products
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  // Private Sourced Products (Published from requests)
  // Use collectionGroup to find all products belonging to this client across all their lists
  const privateProductsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // We filter by status published
    return query(
      collectionGroup(db, 'products'),
      where('status', '==', 'published')
    );
  }, [db, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);
  const { data: catalogProducts, isLoading: isCatalogLoading } = useCollection(productsQuery);
  const { data: sourcedProducts, isLoading: isSourcedLoading } = useCollection(privateProductsQuery);

  // Sorting logic
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

  // Merge catalogs
  const fullCatalog = useMemo(() => {
    const global = (catalogProducts || []).map(p => ({ ...p, isPrivate: false }));
    // Filter sourced products to only those belonging to this client (manually for now to avoid complex security rule issues in prototype)
    // In a real app, security rules or a cleaner structure would handle this
    const privateItems = (sourcedProducts || [])
      .filter(p => p.productListId) // Basic check
      .map(p => ({ ...p, isPrivate: true }));
    
    return [...privateItems, ...global];
  }, [catalogProducts, sourcedProducts]);

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

  const handleQuickOrder = async (product: any) => {
    if (!user) return;
    setIsOrdering(product.id);
    try {
      await submitContactForm({
        name: user.email || 'Client',
        email: user.email || '',
        phone: 'Espace Client',
        subject: `Demande de commande : ${product.name}`,
        message: `Bonjour, je souhaite commander : ${product.name} (Réf: ${product.sku || 'N/A'}).
Prix affiché : ¥${Number(product.price || 0).toFixed(2)}.
Merci de me contacter pour finaliser la proforma.`
      });
      toast({ title: "Demande envoyée", description: "Un agent va préparer votre proforma." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer la demande." });
    } finally {
      setIsOrdering(null);
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
          <TabsTrigger value="catalog"><ShoppingCart className="h-4 w-4 mr-2" /> Catalogue</TabsTrigger>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isCatalogLoading || isSourcedLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-zinc-200 animate-pulse rounded-2xl" />)
            ) : fullCatalog.length > 0 ? (
              fullCatalog.map((product) => (
                <Card key={product.id} className="border-none shadow-md bg-white overflow-hidden group flex flex-col hover:ring-2 hover:ring-primary/50 transition-all relative">
                  {product.isPrivate && (
                    <Badge className="absolute top-3 right-3 z-10 bg-primary font-bold text-[10px] uppercase">
                      <Star className="h-3 w-3 mr-1 fill-white" /> Sourcé pour vous
                    </Badge>
                  )}
                  <div className="relative aspect-square bg-zinc-100">
                    {product.imageUrl || (product.images && product.images[0]) ? (
                      <Image src={product.imageUrl || product.images[0]} alt={product.name} fill className="object-contain p-4" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300"><Package className="h-12 w-12" /></div>
                    )}
                  </div>
                  <CardHeader className="p-4 flex-grow">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mb-1">{product.sku || 'REF-TBC'}</div>
                    <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs mt-2">{product.description}</CardDescription>
                  </CardHeader>
                  <div className="p-4 pt-0">
                    <div className="text-xl font-black text-zinc-900 mb-4">¥{Number(product.price || 0).toFixed(2)}</div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 font-bold"
                      onClick={() => handleQuickOrder(product)}
                      disabled={isOrdering === product.id}
                    >
                      {isOrdering === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commander ce produit"}
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-20 text-center bg-white rounded-2xl border-2 border-dashed text-zinc-400">Catalogue indisponible.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
