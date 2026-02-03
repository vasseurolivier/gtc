'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Package, 
  Save, 
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ListDetailsPage() {
  const params = useParams();
  const listId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  // Fetch list info
  const listRef = useMemoFirebase(() => {
    if (!db || !user || !listId) return null;
    return doc(db, 'clients', user.uid, 'productLists', listId);
  }, [db, user, listId]);
  
  const { data: list, isLoading: isListLoading } = useDoc(listRef);

  // Fetch products in this list
  const productsQuery = useMemoFirebase(() => {
    if (!db || !user || !listId) return null;
    return collection(db, 'clients', user.uid, 'productLists', listId, 'products');
  }, [db, user, listId]);

  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    setIsAdding(true);
    try {
      const colRef = collection(db, 'clients', user!.uid, 'productLists', listId, 'products');
      const prodId = `PROD-${Date.now()}`;
      await addDoc(colRef, {
        id: prodId,
        productListId: listId,
        name: newProduct.name,
        description: newProduct.description,
        quantity: Number(newProduct.quantity),
        unitPrice: Number(newProduct.unitPrice),
        createdAt: new Date().toISOString(),
      });
      
      setNewProduct({ name: '', description: '', quantity: 1, unitPrice: 0 });
      toast({ title: "Produit ajouté", description: "L'article a été ajouté à votre liste." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const docRef = doc(db, 'clients', user!.uid, 'productLists', listId, 'products', productId);
      await deleteDoc(docRef);
      toast({ title: "Produit supprimé" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  if (isListLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Liste introuvable</h2>
        <Button className="mt-4" asChild><Link href="/client/product-lists">Retour à mes projets</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/client/product-lists">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux projets
          </Link>
        </Button>
        <Badge variant="outline" className="bg-white border-zinc-200">ID: {listId}</Badge>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-md border-none flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">{list.name}</h1>
          <p className="text-zinc-500 mt-2 max-w-2xl">{list.description || "Aucune description"}</p>
        </div>
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div className="text-xs text-zinc-400 uppercase font-bold">Total Articles</div>
            <div className="text-2xl font-black text-primary">{products?.length || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle>Articles de la liste</CardTitle>
            <CardDescription>Liste des produits que vous souhaitez sourcer.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isProductsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50">
                    <TableHead className="pl-6">Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix Cible (CNY)</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-zinc-50/50">
                      <TableCell className="pl-6 font-medium py-4">
                        <div>{product.name}</div>
                        <div className="text-xs text-zinc-400 font-normal mt-1">{product.description || "-"}</div>
                      </TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>¥{Number(product.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-zinc-300 hover:text-red-500"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-20 text-center text-zinc-400">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p>Aucun produit dans cette liste.</p>
                <p className="text-sm mt-1">Utilisez le formulaire à droite pour ajouter votre premier article.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Ajouter un produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Désignation</label>
                  <Input 
                    placeholder="ex: Coque iPhone 15 Silicone" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Description / Matériaux</label>
                  <Textarea 
                    placeholder="ex: Couleur noir, finition mate, logo personnalisé..." 
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-400">Quantité</label>
                    <Input 
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-400">Prix Cible (¥)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newProduct.unitPrice}
                      onChange={(e) => setNewProduct({...newProduct, unitPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 font-bold" disabled={isAdding}>
                  {isAdding ? <Loader2 className="animate-spin h-4 w-4" /> : "Ajouter à la liste"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none bg-zinc-900 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" /> Aide Sourcing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Une fois votre liste complétée, nos agents en Chine recevront une notification. Nous reviendrons vers vous avec une étude de faisabilité et les premières offres fournisseurs.
              </p>
              <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-white text-xs h-9" asChild>
                <Link href="/contact"><ExternalLink className="h-3 w-3 mr-2" /> Contacter un agent</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
