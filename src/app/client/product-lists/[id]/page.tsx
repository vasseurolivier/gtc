
'use client';

import { useState, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
  AlertCircle,
  X,
  UploadCloud,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { uploadImage } from '@/actions/upload';
import { CurrencyContext } from '@/context/currency-context';

export default function ListDetailsPage() {
  const params = useParams();
  const listId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const currencyContext = useContext(CurrencyContext);
  const rate = currencyContext?.exchangeRate || 0.13;

  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    images: [] as string[],
  });

  const listRef = useMemoFirebase(() => {
    if (!db || !user || !listId) return null;
    return doc(db, 'clients', user.uid, 'productLists', listId);
  }, [db, user, listId]);
  
  const { data: list, isLoading: isListLoading } = useDoc(listRef);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user || !listId) return null;
    return collection(db, 'clients', user.uid, 'productLists', listId, 'products');
  }, [db, user, listId]);

  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('folder', `clients/${user.uid}/lists/${listId}`);
        const result = await uploadImage(formData);
        if (result.success && result.url) {
          setNewProduct(prev => ({ ...prev, images: [...prev.images, result.url!] }));
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !user) return;
    setIsAdding(true);
    try {
      const colRef = collection(db!, 'clients', user.uid, 'productLists', listId, 'products');
      const prodId = `PROD-${Date.now()}`;
      addDocumentNonBlocking(colRef, {
        id: prodId,
        productListId: listId,
        clientId: user.uid,
        name: newProduct.name,
        description: newProduct.description,
        quantity: Number(newProduct.quantity),
        unitPrice: Number(newProduct.unitPrice),
        images: newProduct.images,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setNewProduct({ name: '', description: '', quantity: 1, unitPrice: 0, images: [] });
      toast({ title: "Demande de sourcing ajoutée" });
    } finally {
      setIsAdding(false);
    }
  };

  if (isListLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild><Link href="/client/product-lists"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></Button>
        <Badge variant="outline" className="bg-white">PROJET: {list?.name}</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-md bg-white">
          <CardHeader><CardTitle>Produits demandés (€)</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isProductsLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div> : products && products.length > 0 ? (
              <Table>
                <TableHeader><TableRow className="bg-zinc-50/50"><TableHead className="pl-6">Produit</TableHead><TableHead>Qté</TableHead><TableHead>Prix Unit. (€)</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && <div className="relative w-10 h-10 rounded overflow-hidden border"><Image src={p.images[0]} alt="p" fill className="object-cover" /></div>}
                          <div className="font-bold">{p.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell className="font-black text-primary">€{(Number(p.unitPrice || 0) * rate).toFixed(2)}</TableCell>
                      <TableCell>{p.status === 'published' ? <Badge className="bg-green-500">Validé</Badge> : <Badge variant="outline">Analyse en cours</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <div className="p-20 text-center text-zinc-400">Aucun article.</div>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white h-fit">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Ajouter un produit</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <Input placeholder="Nom de l'article" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
              <Textarea placeholder="Détails techniques..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Qté" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})} />
                <Input type="number" step="0.01" placeholder="Prix cible (¥)" value={newProduct.unitPrice} onChange={e => setNewProduct({...newProduct, unitPrice: Number(e.target.value)})} />
              </div>
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-zinc-50 transition-colors relative">
                <Input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                <span className="text-xs font-bold text-zinc-500">{isUploading ? "Envoi..." : "Ajouter des photos"}</span>
              </div>
              <Button type="submit" className="w-full font-bold h-12" disabled={isAdding || isUploading}>
                {isAdding ? <Loader2 className="animate-spin" /> : "Envoyer ma demande"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
