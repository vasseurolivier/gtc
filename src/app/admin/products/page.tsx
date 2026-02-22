'use client';

import { useEffect, useState, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addProduct, getProducts, deleteProduct, updateProduct, Product } from '@/actions/products';
import { uploadImage } from '@/actions/upload';
import { Loader2, PlusCircle, Trash2, Pencil, UploadCloud, Eye, Search, Package } from 'lucide-react';
import { CurrencyContext } from '@/context/currency-context';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sku: z.string().min(1, { message: "SKU is required." }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price cannot be negative.").default(0),
  purchasePrice: z.coerce.number().nonnegative("Cost price cannot be negative.").optional().default(0),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative.").default(0),
  category: z.string().optional(),
  weight: z.coerce.number().nonnegative("Weight cannot be negative.").optional().default(0),
  width: z.coerce.number().nonnegative("Width cannot be negative.").optional().default(0),
  height: z.coerce.number().nonnegative("Height cannot be negative.").optional().default(0),
  length: z.coerce.number().nonnegative("Length cannot be negative.").optional().default(0),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  imageUrl: z.string().optional(),
});


export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const currencyContext = useContext(CurrencyContext);

  if (!currencyContext) {
    throw new Error('CurrencyContext must be used within a CurrencyProvider');
  }

  const { currency, exchangeRate } = currencyContext;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: 0,
      purchasePrice: 0,
      stock: 0,
      category: "",
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      hsCode: "",
      countryOfOrigin: "China",
      imageUrl: "",
    },
  });

  const watchImageUrl = form.watch("imageUrl");

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchProducts() {
      setIsLoading(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch products.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [router, toast]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const s = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.sku.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s)
    );
  }, [products, searchTerm]);

  const handleOpenDialog = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      form.reset({
        ...product,
        price: product.price || 0,
        purchasePrice: product.purchasePrice || 0,
        stock: product.stock || 0,
        weight: product.weight || 0,
        width: product.width || 0,
        height: product.height || 0,
        length: product.length || 0,
        imageUrl: product.imageUrl || "",
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        description: "",
        price: 0,
        purchasePrice: 0,
        stock: 0,
        category: "",
        weight: 0,
        width: 0,
        height: 0,
        length: 0,
        hsCode: "",
        countryOfOrigin: "China",
        imageUrl: "",
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    
    const result = await uploadImage(formData);

    if (result.success && result.url) {
        form.setValue("imageUrl", result.url, { shouldValidate: true });
        toast({
            title: 'Image uploaded',
            description: 'Your image has been successfully uploaded.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: result.message,
        });
    }

    setIsUploading(false);
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = editingProduct
      ? await updateProduct(editingProduct.id, values)
      : await addProduct(values);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newProducts = await getProducts();
      setProducts(newProducts);
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteProduct = async (id: string) => {
    const result = await deleteProduct(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        setProducts(products.filter(p => p.id !== id));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catalogue Global</h1>
          <p className="text-muted-foreground">Inventaire principal utilisé pour le sourcing et les PI.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 font-bold">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau Produit
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input 
          placeholder="Rechercher par nom, SKU ou catégorie..." 
          className="pl-10 h-11 shadow-sm bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}</DialogTitle>
              <DialogDescription>
                Remplissez les détails techniques pour le catalogue principal.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
                <div>
                    <h3 className="text-lg font-medium mb-2">Informations de base</h3>
                    <div className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom du produit</FormLabel>
                                <FormControl><Input placeholder="ex: Mug Céramique" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="sku" render={({ field }) => (
                                <FormItem>
                                <FormLabel>SKU</FormLabel>
                                <FormControl><Input placeholder="MUG-CER-001" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Catégorie</FormLabel>
                                <FormControl><Input placeholder="ex: Cuisine" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Détails techniques..." {...field} rows={3} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-2">Image du produit</h3>
                     <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : watchImageUrl ? (
                                <Image src={watchImageUrl} alt="Product image" width={96} height={96} className="object-contain" unoptimized />
                            ) : (
                                <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <div className="space-y-2 w-full">
                           <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>URL Image</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com/image.png" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="text-sm text-muted-foreground text-center">OU</div>
                             <FormItem>
                                <FormLabel>Télécharger un fichier</FormLabel>
                                 <FormControl>
                                    <Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} className="w-full" disabled={isUploading} />
                                </FormControl>
                            </FormItem>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-2">Prix & Stock</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prix de vente (CNY)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prix d'achat (CNY)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="stock" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantité en stock</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h3 className="text-lg font-medium mb-2">Logistique & Douane</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="weight" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Poids (kg)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pays d'origine</FormLabel>
                                <FormControl><Input placeholder="ex: China" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <FormField control={form.control} name="length" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Longueur (cm)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="width" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Largeur (cm)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="height" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hauteur (cm)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="mt-4">
                         <FormField control={form.control} name="hsCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Code Douanier (HS Code)</FormLabel>
                                <FormControl><Input placeholder="ex: 6911.10" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>


                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting || isUploading}>
                        {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading ? 'Chargement...' : isSubmitting ? 'Sauvegarde...' : editingProduct ? 'Modifier' : 'Ajouter'}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucun produit trouvé.</p>
              {searchTerm && <Button variant="link" onClick={() => setSearchTerm('')}>Effacer la recherche</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="w-20 pl-6">Image</TableHead>
                  <TableHead>Nom du produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Prix Vente</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-6">
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="object-contain w-full h-full" unoptimized />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/admin/products/${product.id}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>
                        <div className="font-bold">¥{(product.price).toFixed(2)}</div>
                        <div className="text-[10px] text-zinc-400">{currency.symbol}{(product.price * exchangeRate).toFixed(2)}</div>
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="text-right pr-6">
                       <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Le produit sera supprimé de l'inventaire global.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive text-destructive-foreground">
                                    Supprimer
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
