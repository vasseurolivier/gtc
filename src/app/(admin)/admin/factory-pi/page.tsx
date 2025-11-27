
'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Loader2, PlusCircle, Trash2, UploadCloud, Save, Eye, Pencil } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CompanyInfoContext } from '@/context/company-info-context';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addFactoryPi, getFactoryPis, FactoryPi, deleteFactoryPi, updateFactoryPi } from '@/actions/factory-pi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getProducts, Product } from '@/actions/products';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const factoryPiItemSchema = z.object({
  photo: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPriceCny: z.coerce.number().nonnegative('Price must be non-negative.'),
});

const factoryPiSchema = z.object({
  piNumber: z.string().min(1, 'PI Number is required.'),
  date: z.date(),
  items: z.array(factoryPiItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
});

type FactoryPiValues = z.infer<typeof factoryPiSchema>;

function FactoryPiGenerator({ editingPi, onFinishedEditing, products }: { editingPi: FactoryPi | null, onFinishedEditing: () => void, products: Product[] }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);

  const getInitialValues = () => {
    if (editingPi) {
        return {
            ...editingPi,
            date: new Date(editingPi.date),
            items: editingPi.items.map(item => ({
                ...item,
                photo: item.photo || '',
                sku: item.sku || '',
            })),
            notes: editingPi.notes || '',
        };
    }
    return {
      piNumber: `PIF-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      items: [{
        photo: '',
        sku: '',
        description: '',
        quantity: 1,
        unitPriceCny: 0,
      }],
      notes: 'Production Time: 30 days\nTransport: Included',
    };
  };

  const form = useForm<FactoryPiValues>({
    resolver: zodResolver(factoryPiSchema),
    defaultValues: getInitialValues(),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  if (!companyInfoContext) {
    return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
  }
  const { companyInfo } = companyInfoContext;
  
  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.sku`, product.sku);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitPriceCny`, product.purchasePrice || 0);
    }
  };


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
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
        form.setValue(`items.${index}.photo`, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totals = watchedItems.reduce((acc, item) => {
    const totalCny = item.quantity * item.unitPriceCny;
    acc.totalQuantity += item.quantity;
    acc.totalAmountCny += totalCny;
    return acc;
  }, { totalQuantity: 0, totalAmountCny: 0 });


  const onSubmit = async (values: FactoryPiValues) => {
    setIsSubmitting(true);
    const result = editingPi
        ? await updateFactoryPi(editingPi.id, values)
        : await addFactoryPi(values);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      onFinishedEditing();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 no-print">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">{editingPi ? 'Edit Factory PI' : 'Factory PI Details'}</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="piNumber" render={({ field }) => (
                  <FormItem><FormLabel>PI #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="e.g. Production Time, Transport info..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>
              )} />
              <Separator />
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                <h4 className="font-medium">Items</h4>
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-6 w-6"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    <div className="space-y-2">
                       <Select onValueChange={(value) => handleProductSelect(value, index)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a product (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                       <FormField control={form.control} name={`items.${index}.sku`} render={({ field }) => (
                        <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`items.${index}.photo`} render={({ field: photoField }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                              {photoField.value ? <Image src={photoField.value} alt="Product" width={64} height={64} className="object-contain" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                            </div>
                            <FormControl><Input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, index)} className="w-auto" /></FormControl>
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`items.${index}.unitPriceCny`} render={({ field }) => (
                          <FormItem><FormLabel>Unit Price (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ photo: '', sku: '', description: '', quantity: 1, unitPriceCny: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
              <div className="flex justify-end gap-2">
                 {editingPi && <Button type="button" variant="ghost" onClick={onFinishedEditing}>Cancel</Button>}
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 print-content">
        <Card>
          <CardContent className="p-8">
            <header className="flex justify-between items-start mb-8 border-b pb-8">
              <div>
                {companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={120} height={120} className="object-contain" />}
                <h2 className="text-xl font-bold mt-4">{companyInfo.name}</h2>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-primary">PROFORMA INVOICE</h1>
                <p className="text-muted-foreground mt-2"># {form.getValues('piNumber')}</p>
                <p className="text-muted-foreground mt-1">Date: {format(form.getValues('date'), 'dd MMM yyyy')}</p>
              </div>
            </header>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-16">Photo</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price (CNY)</TableHead>
                  <TableHead className="text-right">Total (CNY)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchedItems.map((item, index) => {
                  const quantity = Number(item.quantity) || 0;
                  const unitPriceCny = Number(item.unitPriceCny) || 0;
                  const totalCny = quantity * unitPriceCny;
                  return (
                    <TableRow key={index}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        {item.photo && <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          <Image src={item.photo} alt={item.description} width={64} height={64} className="object-contain" />
                        </div>}
                      </TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">¥{(Number(item.unitPriceCny) || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">¥{totalCny.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="w-full md:w-1/2">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold">TOTAL QUANTITY</TableCell>
                      <TableCell className="text-right font-bold">{totals.totalQuantity}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">TOTAL AMOUNT (CNY)</TableCell>
                      <TableCell className="text-right font-bold">¥{totals.totalAmountCny.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
             <div className="mt-8 border-t pt-4">
                <h4 className="font-semibold mb-2">Notes:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.watch('notes')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FactoryPiHistory({ onEdit, onForceRefresh }: { onEdit: (pi: FactoryPi) => void, onForceRefresh: () => void }) {
  const [factoryPis, setFactoryPis] = useState<FactoryPi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPis() {
      setIsLoading(true);
      try {
        const pis = await getFactoryPis();
        setFactoryPis(pis);
      } catch (error) {
        console.error("Failed to fetch factory PIs", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPis();
  }, [onForceRefresh]);
  
  const handleDelete = async (id: string) => {
    const result = await deleteFactoryPi(id);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setFactoryPis(prev => prev.filter(pi => pi.id !== id));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {factoryPis.length === 0 ? (
          <div className="text-center p-16 text-muted-foreground">
            <p>No saved factory PIs found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PI #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factoryPis.map((pi) => (
                <TableRow key={pi.id}>
                  <TableCell className="font-medium">{pi.piNumber}</TableCell>
                  <TableCell>{format(new Date(pi.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{pi.items.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/factory-pi/${pi.id}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(pi)}>
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
                                This action cannot be undone. This will permanently delete this PI.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(pi.id)}>
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
  );
}

function FactoryPiPageContent() {
  const [activeTab, setActiveTab] = useState("generator");
  const [editingPi, setEditingPi] = useState<FactoryPi | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [generatorKey, setGeneratorKey] = useState('new-0');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
        try {
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setIsLoadingProducts(false);
        }
    }
    fetchProducts();
  }, []);
  
  const handleEdit = (pi: FactoryPi) => {
    setEditingPi(pi);
    setGeneratorKey(`edit-${pi.id}-${Date.now()}`); // Use a unique key to force re-mount
    setActiveTab("generator");
  };

  const handleFinishEditing = () => {
    setEditingPi(null);
    setGeneratorKey(`new-${Date.now()}`); // Force re-mount for a new form
    setHistoryRefreshKey(prev => prev + 1); // Force re-render of history component
    setActiveTab("history");
  };
  
  const handleNew = () => {
    setEditingPi(null);
    setGeneratorKey(`new-${Date.now()}`);
    setActiveTab("generator");
  }

  const handleTabChange = (value: string) => {
      if (value === 'generator' && activeTab === 'generator') {
         handleNew();
      } else {
        setActiveTab(value);
      }
  }

  return (
    <div className="container py-8 printable-area">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-3xl font-bold">Proformas Usine</h1>
        <div className="flex gap-2">
            <Button onClick={() => window.print()} disabled={activeTab !== 'generator'}>
              <Printer className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
            {activeTab === 'generator' && editingPi && (
                <Button variant="outline" onClick={handleNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New PI
                </Button>
            )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="no-print">
        <TabsList className="mb-4">
          <TabsTrigger value="generator">{editingPi ? 'Edit PI' : 'Generator'}</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="generator">
          {isLoadingProducts ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
          ) : (
            <FactoryPiGenerator 
                key={generatorKey}
                editingPi={editingPi} 
                onFinishedEditing={handleFinishEditing} 
                products={products}
            />
          )}
        </TabsContent>
        <TabsContent value="history">
          <FactoryPiHistory onEdit={handleEdit} onForceRefresh={() => setHistoryRefreshKey(k => k + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function FactoryPiPage() {
  const router = useRouter();
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);
  
  return (
      <FactoryPiPageContent />
  )
}
