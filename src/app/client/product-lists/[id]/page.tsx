'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  HelpCircle,
  ExternalLink,
  X,
  UploadCloud
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ListDetailsPage() {
  const params = useParams();
  const listId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const app = useFirebaseApp();
  const storage = getStorage(app);
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    images: [] as string[],
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    toast({ title: "Upload en cours", description: "Veuillez patienter..." });

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: 'destructive', title: "Fichier trop volumineux", description: `${file.name} dépasse 5Mo.` });
          continue;
        }

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `clients/${user.uid}/lists/${listId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        uploadedUrls.push(url);
        // Mise à jour progressive
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, url]
        }));
      }
      
      toast({ title: "Images ajoutées" });
    } catch (err: any) {
      console.error("Storage Error:", err);
      toast({ variant: 'destructive', title: "Échec de l'upload", description: "Vérifiez vos permissions Storage dans la console Firebase." });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !user) return;
    setIsAdding(true);
    try {
      const colRef = collection(db, 'clients', user.uid, 'productLists', listId, 'products');
      const prodId = `PROD-${Date.now()}`;
      
      addDocumentNonBlocking(colRef, {
        id: prodId,
        productListId: listId,
        name: newProduct.name,
        description: newProduct.description,
        quantity: Number(newProduct.quantity),
        unitPrice: Number(newProduct.unitPrice),
        images: newProduct.images,
        createdAt: new Date().toISOString(),
      });
      
      setNewProduct({ name: '', description: '', quantity: 1, unitPrice: 0, images: [] });
      toast({ title: "Produit ajouté à la liste" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (!user) return;
    const docRef = doc(db, 'clients', user.uid, 'productLists', listId, 'products', productId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Produit supprimé" });
  };

  if (isListLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Link>
        </Button>
        <Badge variant="outline" className="bg-white">LISTE: {list.name}</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle>Articles demandés</CardTitle>
            <CardDescription>Visualisez les spécifications de vos articles.</CardDescription>
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
                    <TableHead>Prix Cible</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 border bg-zinc-50">
                              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold">{product.name}</div>
                            <div className="text-xs text-zinc-400 line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>¥{Number(product.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="text-red-500">
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
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Nouveau produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <Input 
                  placeholder="Désignation" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
                <Textarea 
                  placeholder="Spécifications (couleurs, matériaux...)" 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={3}
                />
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newProduct.images.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border group">
                        <Image src={url} alt="Preview" fill className="object-cover" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    {isUploading && <div className="w-16 h-16 rounded-md flex items-center justify-center bg-zinc-100 border border-dashed border-zinc-300"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
                  </div>
                  <div className="relative">
                    <Input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" id="file-upload" disabled={isUploading} />
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-zinc-50 border-zinc-200">
                      <UploadCloud className="h-8 w-8 text-zinc-400" />
                      <span className="text-xs text-zinc-500 mt-2">Cliquez pour ajouter des photos</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Quantité" value={newProduct.quantity} onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})} />
                  <Input type="number" step="0.01" placeholder="Prix cible (¥)" value={newProduct.unitPrice} onChange={(e) => setNewProduct({...newProduct, unitPrice: Number(e.target.value)})} />
                </div>
                <Button type="submit" className="w-full h-12 font-bold" disabled={isAdding || isUploading}>
                  {isAdding ? <Loader2 className="animate-spin h-4 w-4" /> : "Ajouter à la liste"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}