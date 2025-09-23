
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addProduct, getProducts, deleteProduct, updateProduct, Product } from '@/actions/products';
import { Loader2, PlusCircle, Trash2, Pencil, UploadCloud } from 'lucide-react';
import { CurrencyContext } from '@/context/currency-context';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sku: z.string().min(1, { message: "SKU is required." }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price cannot be negative.").default(0),
  purchasePrice: z.coerce.number().nonnegative("Purchase price cannot be negative.").optional().default(0),
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
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
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({
              variant: 'destructive',
              title: 'File too large',
              description: 'Please upload an image smaller than 2MB.',
          });
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
          form.setValue("imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add a New Product'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
                <div>
                    <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                    <div className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Ceramic Mug" {...field} /></FormControl>
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
                                <FormLabel>Category</FormLabel>
                                <FormControl><Input placeholder="e.g., Kitchenware" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Product details..." {...field} rows={3} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-2">Product Image</h3>
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                {watchImageUrl ? (
                                    <Image src={watchImageUrl} alt="Product image" width={96} height={96} className="object-contain" />
                                ) : (
                                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <FormControl>
                                <Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} className="w-auto" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-2">Pricing & Stock</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Selling Price (CNY)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purchase Price (CNY)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="stock" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stock Quantity</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h3 className="text-lg font-medium mb-2">Logistics & Customs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="weight" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Weight (kg)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country of Origin</FormLabel>
                                <FormControl><Input placeholder="e.g., China" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <FormField control={form.control} name="length" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Length (cm)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="width" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Width (cm)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="height" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Height (cm)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="mt-4">
                         <FormField control={form.control} name="hsCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>HS Code (Customs)</FormLabel>
                                <FormControl><Input placeholder="e.g., 6911.10" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>


                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingProduct ? 'Save Changes' : 'Add Product'}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
          ) : products.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <p>No products yet.</p>
              <p className="text-sm mt-2">Click "Add Product" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="object-contain"/>
                        ) : (
                          <div className="text-xs text-muted-foreground">No Img</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{currency.symbol}{(product.price * exchangeRate).toFixed(2)}</TableCell>
                    <TableCell>{product.purchasePrice ? `${currency.symbol}${(product.purchasePrice * exchangeRate).toFixed(2)}` : 'N/A'}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="text-right">
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
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the product.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                    Delete
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
