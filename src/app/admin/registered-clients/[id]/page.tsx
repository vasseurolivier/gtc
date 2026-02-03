
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRegisteredClientById, 
  updateRegisteredClientStatus, 
  updateRegisteredClientNumber,
  RegisteredClient 
} from '@/actions/registered-clients';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getProducts, Product } from '@/actions/products';
import { getInvoices, Invoice } from '@/actions/invoices';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clientNumber, setClientNumber] = useState('');
  
  // Catalog logic
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [isCatalogDialogOpen, setIsCatalogDialogOpen] = useState(false);
  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);
  const [isPublishedLoading, setIsPublishedLoading] = useState(false);
  
  // Invoice linking logic
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [isInvoiceLinkDialogOpen, setIsInvoiceLinkDialogOpen] = useState(false);

  // Sourcing logic
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

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

  // Aggregation of all published products for the "Catalogue" tab
  useEffect(() => {
    if (!db || !clientId || !productLists) return;
    async function fetchPublished() {
      setIsPublishedLoading(true);
      try {
        const allPublished: any[] = [];
        for (const list of productLists!) {
          const prodCol = collection(db!, 'clients', clientId, 'productLists', list.id, 'products');
          const q = query(prodCol, where('status', '==', 'published'));
          const snap = await getDocs(q);
          snap.forEach(doc => allPublished.push({ ...doc.data(), id: doc.id, listName: list.name, listId: list.id }));
        }
        setPublishedProducts(allPublished);
      } catch (e) {
        console.error("Aggregation error:", e);
      } finally {
        setIsPublishedLoading(false);
      }
    }
    fetchPublished();
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

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      ...product,
      sku: product.sku || '',
      price: product.price || product.unitPrice || 0,
      description: product.description || '',
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !db) return;
    // We need to know which list the product belongs to
    const listId = editingProduct.productListId || (selectedList?.id);
    if (!listId) return;

    setIsSaving(true);
    try {
      const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', editingProduct.id);
      await updateDoc(productRef, {
        sku: editingProduct.sku,
        price: Number(editingProduct.price),
        unitPrice: Number(editingProduct.price),
        description: editingProduct.description,
        status: 'published',
        validatedAt: new Date().toISOString(),
      });
      toast({ title: "Produit validé", description: "Le produit est maintenant dans le catalogue du client." });
      setIsProductDialogOpen(false);
      
      // Refresh published products list
      router.refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFromGlobalCatalog = async (prod: Product) => {
    if (!db || !client) return;
    setIsSaving(true);
    try {
      // 1. Find or create "Catalogue Officiel" list
      let officialListId = '';
      const existingList = productLists?.find(l => l.name === "Catalogue Officiel");
      
      if (existingList) {
        officialListId = existingList.id;
      } else {
        officialListId = `LST-CAT-${Date.now()}`;
        await setDoc(doc(db, 'clients', clientId, 'productLists', officialListId), {
          id: officialListId,
          clientId: clientId,
          name: "Catalogue Officiel",
          description: "Produits ajoutés directement par l'administration.",
          createdAt: new Date().toISOString(),
        });
      }

      // 2. Add product to it
      const prodId = `PROD-CAT-${Date.now()}`;
      const productRef = doc(db, 'clients', clientId, 'productLists', officialListId, 'products', prodId);
      
      await setDoc(productRef, {
        id: prodId,
        productListId: officialListId,
        clientId: clientId,
        name: prod.name,
        sku: prod.sku,
        description: prod.description || '',
        quantity: 1,
        unitPrice: prod.price,
        price: prod.price,
        images: prod.imageUrl ? [prod.imageUrl] : [],
        status: 'published',
        createdAt: new Date().toISOString(),
        validatedAt: new Date().toISOString(),
      });
      
      toast({ title: "Produit ajouté", description: `${prod.name} a été ajouté au catalogue privé du client.` });
      setIsCatalogDialogOpen(false);
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
      // Refresh local list
      const updatedInvs = await getInvoices();
      setAllInvoices(updatedInvs);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

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
              <TabsTrigger value="lists" className="rounded-lg h-full"><ClipboardList className="h-4 w-4 mr-2" /> Sourcing</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg h-full"><ShoppingCart className="h-4 w-4 mr-2" /> Commandes</TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg h-full"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
            </TabsList>

            <TabsContent value="catalogue">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Produits visibles par le client</h3>
                <Button size="sm" onClick={() => setIsCatalogDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un produit au catalogue
                </Button>
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
                    {isPublishedLoading ? (
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

            <TabsContent value="lists">
              {!selectedList ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productLists && productLists.length > 0 ? productLists.map((list) => (
                    <Card key={list.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedList(list)}>
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
                  )) : (
                    <div className="col-span-full p-12 text-center bg-white rounded-2xl border-2 border-dashed text-muted-foreground">
                      Aucune liste de produits pour ce client.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="link" onClick={() => setSelectedList(null)} className="p-0 text-zinc-500">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux listes
                    </Button>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{selectedList.name}</h3>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setIsCatalogDialogOpen(true)}>
                        <Plus className="h-3 w-3 mr-1" /> Ajouter du catalogue global
                      </Button>
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
                                  <div className="relative w-10 h-10 rounded border bg-zinc-50 overflow-hidden shrink-0">
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
                                <Badge variant="outline" className="text-zinc-400 border-zinc-200 text-[10px] px-2 py-0">En attente</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                                {product.status === 'published' ? 'Modifier' : 'Enrichir & Valider'}
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
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">N° Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders && orders.length > 0 ? orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-bold">{order.orderNumber}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold">¥{order.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Aucune commande.</TableCell>
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

      {/* Catalog Dialog */}
      <Dialog open={isCatalogDialogOpen} onOpenChange={setIsCatalogDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter au catalogue privé</DialogTitle>
            <DialogDescription>Sélectionnez un produit de votre inventaire global pour le rendre disponible à l'achat pour ce client.</DialogDescription>
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
                      <Button size="sm" variant="secondary" onClick={() => handleAddFromGlobalCatalog(p)}>
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sélectionner"}
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
            <DialogDescription>Sélectionnez une facture non attribuée ou d'un autre dossier pour la rendre visible à ce client.</DialogDescription>
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
                      <Button size="sm" onClick={() => handleLinkInvoice(inv)}>Attribuer à {client.firstName}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Validation Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Validation du Produit</DialogTitle>
            <DialogDescription>
              Entrez les informations finales pour publier cet article dans le catalogue client.
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg border bg-zinc-100 overflow-hidden">
                    {editingProduct.images?.[0] ? (
                      <Image src={editingProduct.images[0]} alt="Product" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300"><Package className="h-8 w-8" /></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold">{editingProduct.name}</h4>
                    <p className="text-xs text-zinc-500">Origine: {editingProduct.listName || 'Sourcing'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Référence SKU</label>
                  <Input 
                    value={editingProduct.sku} 
                    onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                    placeholder="ex: YW-MUG-001"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Prix Unitaire Final (CNY)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">¥</span>
                    <Input 
                      type="number"
                      className="pl-8"
                      value={editingProduct.price} 
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Spécifications Validées</label>
                  <Textarea 
                    rows={8}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    placeholder="Détaillez les caractéristiques techniques..."
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsProductDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveProduct} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Enregistrer et Publier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
