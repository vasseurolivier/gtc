
'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRegisteredClientById, 
  updateRegisteredClientStatus, 
  updateRegisteredClientNumber,
  updateClientCredentials,
  deleteRegisteredClient,
  deleteClientProduct,
  RegisteredClient 
} from '@/actions/registered-clients';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  Pencil, 
  Package, 
  Save, 
  ShieldCheck,
  FileText,
  Receipt,
  Eye,
  Plus,
  UploadCloud,
  X,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CurrencyContext } from '@/context/currency-context';
import { uploadImage } from '@/actions/upload';
import { getProducts, Product } from '@/actions/products';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const currencyContext = useContext(CurrencyContext);

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [clientNumber, setClientNumber] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const [publishedProducts, setPublishedProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  useEffect(() => {
    if (!clientId) return;
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientData, productsData] = await Promise.all([
          getRegisteredClientById(clientId),
          getProducts()
        ]);
        
        if (clientData) {
          setClient(clientData);
          setClientNumber(clientData.clientNumber || '');
          setLoginEmail(clientData.email || '');
          setLoginPassword(clientData.password || '');
        }
        setGlobalProducts(productsData || []);
      } catch (error) {
        console.error("Fetch client error:", error);
      } finally {
        setIsLoading(false);
      }
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
    return query(collection(db, 'invoices'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: invoices } = useCollection(invoicesQuery);

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

  const aggregateProducts = async () => {
    if (!db || !clientId || !productLists) return;
    try {
      const published: any[] = [];
      for (const list of productLists!) {
        const prodCol = collection(db!, 'clients', clientId, 'productLists', list.id, 'products');
        const q = query(prodCol, where('status', '==', 'published'));
        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          published.push({ ...data, id: doc.id, listName: list.name, listId: list.id });
        });
      }
      setPublishedProducts(published);
    } catch (e) {
      console.error("Aggregation error:", e);
    }
  };

  useEffect(() => {
    aggregateProducts();
  }, [db, clientId, productLists]);

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
    const result = await deleteRegisteredClient(clientId);
    if (result.success) {
      toast({ title: "Supprimé" });
      router.push('/admin/registered-clients');
    }
  };

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientNumber(clientId, clientNumber);
    if (result.success) toast({ title: "Mis à jour" });
    setIsSaving(false);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({ 
      ...product, 
      hasSizeSelection: product.hasSizeSelection ?? false,
      availableSizes: product.availableSizes ?? [],
      availability: product.availability ?? 'both',
      moq: product.moq ?? 1,
      images: product.images ?? []
    });
    setIsProductDialogOpen(true);
  };

  const handleAddNewProduct = () => {
    if (!productLists || productLists.length === 0) {
      toast({ variant: "destructive", title: "Liste requise", description: "Le client doit avoir au moins une liste de produits pour ajouter un catalogue." });
      return;
    }
    setEditingProduct({
      id: `PROD-MANUAL-${Date.now()}`,
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      price: 0,
      description: '',
      images: [],
      availableSizes: [],
      hasSizeSelection: false,
      availability: 'both',
      moq: 1,
      listId: productLists[0].id,
      status: 'published',
      clientId: clientId
    });
    setIsProductDialogOpen(true);
  };

  const handleImportFromGlobal = (productId: string) => {
    const p = globalProducts.find(gp => gp.id === productId);
    if (p && editingProduct) {
      setEditingProduct({
        ...editingProduct,
        name: p.name,
        sku: p.sku,
        price: p.price,
        description: p.description || '',
        images: p.imageUrl ? [p.imageUrl] : [],
        weight: p.weight || 0,
      });
      toast({ title: "Produit importé", description: "Les données du catalogue global ont été chargées." });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newUrls = [...(editingProduct.images || [])];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('folder', `clients/${clientId}/catalogue`);
        const result = await uploadImage(formData);
        if (result.success && result.url) {
          newUrls.push(result.url);
        }
      }
      setEditingProduct({ ...editingProduct, images: newUrls });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !db) return;
    setIsSaving(true);
    try {
      const listId = editingProduct.listId || editingProduct.productListId;
      const productRef = doc(db, 'clients', clientId, 'productLists', listId, 'products', editingProduct.id);
      await setDoc(productRef, { 
        ...editingProduct, 
        status: 'published', 
        validatedAt: new Date().toISOString() 
      }, { merge: true });
      
      toast({ title: "Catalogue mis à jour" });
      setIsProductDialogOpen(false);
      aggregateProducts();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProductActual = async (product: any) => {
    const listId = product.listId || product.productListId;
    const result = await deleteClientProduct(clientId, listId, product.id);
    if (result.success) {
      toast({ title: "Supprimé" });
      aggregateProducts();
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
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClientActual}>Confirmer</AlertDialogAction>
              </AlertDialogFooter>
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
            <TabsList className="bg-white border p-1 h-12 rounded-xl mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="quotes">Proformas</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>

            <TabsContent value="catalogue">
              <div className="flex justify-end mb-4">
                <Button onClick={handleAddNewProduct} className="bg-primary hover:bg-primary/90 font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter au catalogue
                </Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Photo</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="w-12 h-12 rounded border bg-zinc-50 flex items-center justify-center overflow-hidden">
                            {p.images?.[0] ? <img src={p.images[0]} alt="p" className="object-contain w-full h-full" /> : <Package className="h-4 w-4 text-zinc-300" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{p.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>¥{Number(p.price || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {p.hasSizeSelection && <Badge variant="secondary" className="text-[8px] h-4">TAILLES: {p.availableSizes?.join(', ')}</Badge>}
                            <Badge variant="outline" className="text-[8px] h-4 uppercase">{p.availability || 'BOTH'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteProductActual(p)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders?.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-bold">{o.orderNumber}</TableCell>
                        <TableCell>{o.orderDate ? format(parseSafeDate(o.orderDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                        <TableCell className="text-right font-bold">¥{o.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="quotes">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>N° Proforma</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {quotes?.map(q => (
                      <TableRow key={q.id}>
                        <TableCell className="font-bold">{q.quoteNumber}</TableCell>
                        <TableCell>{format(parseSafeDate(q.issueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><Badge>{q.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild><Link href={`/admin/quotes/${q.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>N° Facture</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices?.map(i => (
                      <TableRow key={i.id}>
                        <TableCell className="font-bold">{i.invoiceNumber}</TableCell>
                        <TableCell>{format(parseSafeDate(i.issueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell><Badge variant={i.status === 'paid' ? 'default' : 'destructive'}>{i.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild><Link href={`/admin/invoices/${i.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        </TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Configuration Produit Catalogue</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="space-y-8">
              <div className="p-4 bg-primary/5 border rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 font-bold text-primary"><Search className="h-5 w-5" /> Importer depuis ma liste :</div>
                <Select onValueChange={handleImportFromGlobal}>
                  <SelectTrigger className="flex-grow bg-white"><SelectValue placeholder="Choisir un produit global..." /></SelectTrigger>
                  <SelectContent>
                    {globalProducts.map(gp => <SelectItem key={gp.id} value={gp.id}>{gp.name} ({gp.sku})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Nom commercial</Label>
                    <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Référence SKU</Label>
                      <Input value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Liste de destination</Label>
                      <Select value={editingProduct.listId || editingProduct.productListId} onValueChange={val => setEditingProduct({...editingProduct, listId: val, productListId: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {productLists?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prix unitaire (CNY)</Label>
                      <Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>MOQ Personnalisation</Label>
                      <Input type="number" value={editingProduct.moq} onChange={e => setEditingProduct({...editingProduct, moq: Number(e.target.value)})} />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Activer choix des tailles ?</Label>
                      <Switch checked={editingProduct.hasSizeSelection} onCheckedChange={checked => setEditingProduct({...editingProduct, hasSizeSelection: checked})} />
                    </div>
                    {editingProduct.hasSizeSelection && (
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase text-zinc-400">Tailles disponibles</Label>
                        <div className="flex flex-wrap gap-4">
                          {SIZES.map(size => (
                            <div key={size} className="flex items-center gap-2">
                              <Checkbox 
                                id={`size-${size}`} 
                                checked={editingProduct.availableSizes?.includes(size)}
                                onCheckedChange={(checked) => {
                                  const sizes = [...(editingProduct.availableSizes || [])];
                                  if (checked) {
                                    if (!sizes.includes(size)) sizes.push(size);
                                  } else {
                                    const idx = sizes.indexOf(size);
                                    if (idx > -1) sizes.splice(idx, 1);
                                  }
                                  setEditingProduct({ ...editingProduct, availableSizes: sizes });
                                }}
                              />
                              <Label htmlFor={`size-${size}`} className="font-bold">{size}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Type de vente autorisée</Label>
                      <Select value={editingProduct.availability || 'both'} onValueChange={val => setEditingProduct({...editingProduct, availability: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard_only">Standard uniquement</SelectItem>
                          <SelectItem value="personalized_only">Personnalisé uniquement</SelectItem>
                          <SelectItem value="both">Les deux (Standard & Perso)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Photos du produit</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {editingProduct.images?.map((url: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded border bg-zinc-50 overflow-hidden group">
                          <img src={url} alt="p" className="object-contain w-full h-full" />
                          <button 
                            onClick={() => {
                              const newImgs = [...editingProduct.images];
                              newImgs.splice(idx, 1);
                              setEditingProduct({ ...editingProduct, images: newImgs });
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors">
                        <UploadCloud className="h-6 w-6 text-zinc-400" />
                        <span className="text-[8px] font-bold text-zinc-400 mt-1 uppercase">Ajouter</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description Technique</Label>
                    <Textarea rows={8} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} placeholder="Spécifications, matériaux, couleurs..." />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="ghost" onClick={() => setIsProductDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveProduct} disabled={isSaving || isUploading} className="bg-primary hover:bg-primary/90 font-bold">
              {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Publier au catalogue client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
