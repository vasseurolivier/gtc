

'use client';

import { useState, useContext, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Save, Eye, FileUp, Pencil } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addPackingList, getPackingLists, PackingList, deletePackingList, updatePackingList } from '@/actions/packing-lists';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getProducts, Product } from '@/actions/products';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud } from 'lucide-react';
import Image from 'next/image';

const packingListItemSchema = z.object({
  photo: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPriceCny: z.coerce.number().nonnegative('Price must be non-negative.'),
  remarks: z.string().optional(),
  weight: z.coerce.number().nonnegative("Weight cannot be negative.").optional().default(0),
  width: z.coerce.number().nonnegative("Width cannot be negative.").optional().default(0),
  height: z.coerce.number().nonnegative("Height cannot be negative.").optional().default(0),
  length: z.coerce.number().nonnegative("Length cannot be negative.").optional().default(0),
});

const packingListSchema = z.object({
  listId: z.string().min(1, 'Packing List ID is required.'),
  date: z.date(),
  items: z.array(packingListItemSchema).min(1, 'At least one item is required.'),
});

type PackingListValues = z.infer<typeof packingListSchema>;

function PackingListForm({ editingList, onFinishedEditing, products }: { editingList: PackingList | null, onFinishedEditing: () => void, products: Product[] }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitialValues = () => {
    if (editingList) {
        return {
            ...editingList,
            date: new Date(editingList.date),
            items: editingList.items.map(item => ({
                ...item,
                photo: item.photo || '',
                sku: item.sku || '',
                remarks: item.remarks || '',
                weight: item.weight || 0,
                width: item.width || 0,
                height: item.height || 0,
                length: item.length || 0,
            }))
        };
    }
    return {
      listId: `PL-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      items: [{
        photo: '',
        sku: '',
        description: '',
        quantity: 1,
        unitPriceCny: 0,
        remarks: '',
        weight: 0,
        width: 0,
        height: 0,
        length: 0,
      }],
    };
  };

  const form = useForm<PackingListValues>({
    resolver: zodResolver(packingListSchema),
    defaultValues: getInitialValues(),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedItems = form.watch('items');

  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.sku`, product.sku);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.photo`, product.imageUrl || "");
      form.setValue(`items.${index}.weight`, product.weight || 0);
      form.setValue(`items.${index}.width`, product.width || 0);
      form.setValue(`items.${index}.height`, product.height || 0);
      form.setValue(`items.${index}.length`, product.length || 0);
    }
  };

  const onSubmit = async (values: PackingListValues) => {
    setIsSubmitting(true);
    const result = editingList 
        ? await updatePackingList(editingList.id, values)
        : await addPackingList(values);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      onFinishedEditing();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  return (
    <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">{editingList ? 'Edit Packing List' : 'Create New Packing List'}</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="listId" render={({ field }) => (
                  <FormItem><FormLabel>Packing List #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Separator />
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                       <div className="flex items-end gap-4">
                          <div className="w-20 h-20 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                            {watchedItems[index]?.photo ? <Image src={watchedItems[index].photo!} alt="Product" width={80} height={80} className="object-contain" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                          </div>
                          <FormField control={form.control} name={`items.${index}.photo`} render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Photo URL</FormLabel>
                              <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                            </FormItem>
                          )} />
                       </div>
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
                      <div className="grid grid-cols-4 gap-2">
                        <FormField control={form.control} name={`items.${index}.weight`} render={({ field }) => ( <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name={`items.${index}.length`} render={({ field }) => ( <FormItem><FormLabel>L (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name={`items.${index}.width`} render={({ field }) => ( <FormItem><FormLabel>W (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name={`items.${index}.height`} render={({ field }) => ( <FormItem><FormLabel>H (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                      </div>
                      <FormField control={form.control} name={`items.${index}.remarks`} render={({ field }) => (
                        <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </Card>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ photo: '', sku: '', description: '', quantity: 1, unitPriceCny: 0, remarks: '', weight: 0, width: 0, height: 0, length: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
              <div className="flex justify-end gap-2">
                 {editingList && <Button type="button" variant="ghost" onClick={onFinishedEditing}>Cancel</Button>}
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}

function PackingListHistory({ onEdit, onForceRefresh, refreshKey }: { onEdit: (list: PackingList) => void, onForceRefresh: () => void, refreshKey: number }) {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLists() {
      setIsLoading(true);
      try {
        const lists = await getPackingLists();
        setPackingLists(lists);
      } catch (error) {
        console.error("Failed to fetch packing lists", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLists();
  }, [refreshKey]);
  
  const handleDelete = async (id: string) => {
    const result = await deletePackingList(id);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setPackingLists(prev => prev.filter(list => list.id !== id));
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
        {packingLists.length === 0 ? (
          <div className="text-center p-16 text-muted-foreground">
            <p>No saved packing lists found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Packing List #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packingLists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">{list.listId}</TableCell>
                  <TableCell>{format(new Date(list.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{list.items.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/packing-list/${list.id}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(list)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/quotes?fromPackingList=${list.id}`}>
                        <FileUp className="h-4 w-4" />
                      </Link>
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
                                This action cannot be undone. This will permanently delete this packing list.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(list.id)}>
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

function PackingListPageContent() {
  const [activeTab, setActiveTab] = useState("generator");
  const [editingList, setEditingList] = useState<PackingList | null>(null);
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
  
  const handleEdit = (list: PackingList) => {
    setEditingList(list);
    setGeneratorKey(`edit-${list.id}-${Date.now()}`); // Use a unique key to force re-mount
    setActiveTab("generator");
  };

  const handleFinishEditing = () => {
    setEditingList(null);
    setGeneratorKey(`new-${Date.now()}`); // Force re-mount for a new form
    setHistoryRefreshKey(prev => prev + 1); // Force re-render of history component
    setActiveTab("history");
  };
  
  const handleNewList = () => {
    setEditingList(null);
    setGeneratorKey(`new-${Date.now()}`);
    setActiveTab("generator");
  }

  const handleTabChange = (value: string) => {
      if (value === 'generator' && activeTab === 'generator') {
         handleNewList();
      } else {
        setActiveTab(value);
      }
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Packing List</h1>
        {activeTab === 'generator' && editingList && (
            <Button variant="outline" onClick={handleNewList}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New List
            </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="generator">{editingList ? 'Edit List' : 'Generator'}</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="generator">
          {isLoadingProducts ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
          ) : (
            <PackingListForm 
                key={generatorKey}
                editingList={editingList} 
                onFinishedEditing={handleFinishEditing} 
                products={products}
            />
          )}
        </TabsContent>
        <TabsContent value="history">
          <PackingListHistory onEdit={handleEdit} onForceRefresh={() => setHistoryRefreshKey(k => k + 1)} refreshKey={historyRefreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function PackingListPage() {
  const router = useRouter();
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);
  
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <PackingListPageContent />
    </Suspense>
  )
}
