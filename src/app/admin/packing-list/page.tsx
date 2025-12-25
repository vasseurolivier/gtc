

'use client';

import { useState, useContext, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Save, Eye, FileUp, Pencil, Printer } from 'lucide-react';
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
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { PrintFooter } from '@/components/layout/print-footer';

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

function LivePreview({ watchedValues }: { watchedValues: PackingListValues }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!currencyContext || !companyInfoContext?.isCompanyInfoLoaded) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const { currency, exchangeRate } = currencyContext;
    const { companyInfo } = companyInfoContext;

    const totals = watchedValues.items.reduce((acc, item) => {
        const totalCny = (item.quantity || 0) * (item.unitPriceCny || 0);
        acc.totalQuantity += (item.quantity || 0);
        acc.totalAmountCny += totalCny;
        return acc;
    }, { totalQuantity: 0, totalAmountCny: 0 });

    const itemChunks = [];
    for (let i = 0; i < watchedValues.items.length; i += 10) {
      itemChunks.push(watchedValues.items.slice(i, i + 10));
    }

    return (
        <div id="pdf-content" className="relative p-8 bg-white shadow-lg ring-1 ring-black ring-opacity-5 min-h-[297mm] pb-24">
            <div className="flex-grow">
                <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                    <div>
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" crossOrigin="anonymous" className="h-12 w-auto object-contain"/>}
                    </div>
                    <div className="text-right w-1/3">
                        <h1 className="text-base font-bold text-black leading-tight">PACKING LIST</h1>
                        <p className="mt-1 text-xs text-muted-foreground leading-tight">N° {watchedValues.listId}</p>
                    </div>
                </header>
                <section>
                    <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">ÉMIS PAR</h3>
                            <p className="font-bold leading-tight">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap leading-tight">{companyInfo?.address}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">DATE</h3>
                            <p className="leading-tight">{format(watchedValues.date, 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">NUMÉRO DE RÉFÉRENCE</h3>
                            <p className="leading-tight">{watchedValues.listId}</p>
                        </div>
                    </div>
                </section>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-left bg-blue-100 text-blue-800">
                            <th className="p-2 font-bold w-[8%] border">Photo</th>
                            <th className="w-2/5 p-2 font-bold border">Description</th>
                            <th className="p-2 text-right font-bold w-[12%] border">SKU</th>
                            <th className="p-2 text-right font-bold border">Quantity</th>
                            <th className="p-2 text-right font-bold border">Unit Price (CNY)</th>
                            <th className="p-2 text-right font-bold border">Dimensions & Weight</th>
                            <th className="p-2 text-right font-bold border">Total (CNY)</th>
                            <th className="p-2 font-bold border">Remarks</th>
                        </tr>
                    </thead>
                    {itemChunks.map((chunk, chunkIndex) => (
                        <tbody key={chunkIndex} className={chunkIndex > 0 ? 'pdf-page' : ''}>
                            {chunk.map((item, index) => {
                                const totalCny = (item.quantity || 0) * (item.unitPriceCny || 0);
                                return (
                                    <tr key={index} className="border-b">
                                        <td className="p-1 align-top border">
                                            {item.photo && <div className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0"><img src={item.photo} alt={item.description} crossOrigin="anonymous" width={48} height={48} className="object-contain" /></div>}
                                        </td>
                                        <td className="p-1 align-top font-medium leading-tight border">{item.description}</td>
                                        <td className="p-1 align-top text-right leading-tight border">{item.sku}</td>
                                        <td className="p-1 align-top text-right leading-tight border">{item.quantity}</td>
                                        <td className="p-1 align-top text-right leading-tight border"><span className="font-bold">¥{(item.unitPriceCny || 0).toFixed(2)}</span></td>
                                        <td className="p-1 align-top text-right leading-tight border">
                                            {(item.weight || item.length || item.width || item.height) ? (<> {item.weight && <div>{item.weight} kg</div>} {(item.length || item.width || item.height) && <div>{item.length || 0}x{item.width || 0}x{item.height || 0} cm</div>} </>) : 'N/A'}
                                        </td>
                                        <td className="p-1 align-top text-right font-semibold leading-tight border"><span className="font-bold">¥{totalCny.toFixed(2)}</span></td>
                                        <td className="p-1 align-top leading-tight border">{item.remarks}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    ))}
                </table>
                <div className="flex justify-end pt-4">
                    <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 text-xs">
                        <div className="flex justify-between leading-tight">
                            <span className="text-muted-foreground">Total Quantity :</span>
                            <span className="text-right"><span className="font-bold">{totals.totalQuantity}</span></span>
                        </div>
                        <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t-2 border-black">
                            <span>TOTAL (CNY) :</span>
                            <span className="text-right">
                                <span className="font-bold">¥{totals.totalAmountCny.toFixed(2)}</span>
                                <span className="text-muted-foreground"> ({currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <PrintFooter />
        </div>
    );
}


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
  
  const watchedValues = form.watch();

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
  
    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const data = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save(`packing-list-${watchedValues.listId}.pdf`);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{editingList ? 'Edit Packing List' : 'Create New Packing List'}</h3>
                 <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleDownloadPdf}><Printer className="mr-2 h-4 w-4" /> Export</Button>
                    <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}><Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save'}</Button>
                    {editingList && <Button type="button" variant="ghost" onClick={onFinishedEditing}>Cancel</Button>}
                </div>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[calc(100vh-18rem)] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="listId" render={({ field }) => (<FormItem><FormLabel>Packing List #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <Separator />
                <div className="space-y-4">
                    <h4 className="font-medium">Items</h4>
                    {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-6 w-6"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        <div className="space-y-2">
                        <Select onValueChange={(value) => handleProductSelect(value, index)}>
                                <SelectTrigger><SelectValue placeholder="Select a product (optional)" /></SelectTrigger>
                                <SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>))}</SelectContent>
                            </Select>
                        <FormField control={form.control} name={`items.${index}.sku`} render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="flex items-end gap-4">
                            <div className="w-20 h-20 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                                {watchedValues.items?.[index]?.photo ? <Image src={watchedValues.items[index].photo!} alt="Product" width={80} height={80} className="object-contain" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                            </div>
                            <FormField control={form.control} name={`items.${index}.photo`} render={({ field }) => (
                                <FormItem className="w-full"><FormLabel>Photo URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-2">
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`items.${index}.unitPriceCny`} render={({ field }) => (<FormItem><FormLabel>Unit Price (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <FormField control={form.control} name={`items.${index}.weight`} render={({ field }) => ( <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                            <FormField control={form.control} name={`items.${index}.length`} render={({ field }) => ( <FormItem><FormLabel>L (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                            <FormField control={form.control} name={`items.${index}.width`} render={({ field }) => ( <FormItem><FormLabel>W (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                            <FormField control={form.control} name={`items.${index}.height`} render={({ field }) => ( <FormItem><FormLabel>H (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem> )} />
                        </div>
                        <FormField control={form.control} name={`items.${index}.remarks`} render={({ field }) => (<FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </Card>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ photo: '', sku: '', description: '', quantity: 1, unitPriceCny: 0, remarks: '', weight: 0, width: 0, height: 0, length: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>
        <div className="hidden lg:block">
            <LivePreview watchedValues={watchedValues} />
        </div>
    </div>
  );
}

function ContractHistory({ onEdit, refreshKey }: { onEdit: (contract: PackingList) => void, refreshKey: number }) {
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
      if (value === 'generator' && activeTab === 'generator' && !editingList) {
         handleNewList();
      } else {
        setActiveTab(value);
      }
      if (value === 'generator' && editingList) {
          // If we are editing, and click the generator tab, it should not reset.
          // If we want to create a new one, we use the button.
      } else if (value === 'generator') {
          handleNewList();
      }
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Packing List</h1>
        {activeTab === 'history' && (
            <Button variant="outline" onClick={handleNewList}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New List
            </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          <ContractHistory onEdit={handleEdit} refreshKey={historyRefreshKey} />
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
