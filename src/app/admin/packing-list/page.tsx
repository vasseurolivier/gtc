
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
import { Printer, Loader2, PlusCircle, Trash2, UploadCloud, Save, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CurrencyContext } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';
import { CompanyInfoContext } from '@/context/company-info-context';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addPackingList, getPackingLists, PackingList } from '@/actions/packing-lists';

const packingListItemSchema = z.object({
  photo: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPriceCny: z.coerce.number().nonnegative('Price must be non-negative.'),
  remarks: z.string().optional(),
});

const packingListSchema = z.object({
  listId: z.string().min(1, 'Packing List ID is required.'),
  date: z.date(),
  items: z.array(packingListItemSchema).min(1, 'At least one item is required.'),
});

type PackingListValues = z.infer<typeof packingListSchema>;

function PackingListGenerator() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currencyContext = useContext(CurrencyContext);
  const companyInfoContext = useContext(CompanyInfoContext);

  const form = useForm<PackingListValues>({
    resolver: zodResolver(packingListSchema),
    defaultValues: {
      listId: '',
      date: new Date(),
      items: [{
        photo: '',
        sku: '',
        description: '',
        quantity: 1,
        unitPriceCny: 0,
        remarks: '',
      }],
    },
  });
  
  useEffect(() => {
    // Generate the listId on the client side to avoid hydration mismatch
    form.setValue('listId', `PL-${Date.now().toString().slice(-6)}`);
    // The dependency array is intentionally empty to run this only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  if (!currencyContext || !companyInfoContext) {
    return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
  }
  const { currency, exchangeRate } = currencyContext;
  const { companyInfo } = companyInfoContext;

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
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPriceCny) || 0;
    const totalCny = quantity * unitPrice;
    acc.totalQuantity += quantity;
    acc.totalAmountCny += totalCny;
    return acc;
  }, { totalQuantity: 0, totalAmountCny: 0 });

  const handlePrint = () => {
    window.print();
  };

  const onSubmit = async (values: PackingListValues) => {
    setIsSubmitting(true);
    const result = await addPackingList(values);
    if (result.success) {
      toast({ title: 'Success', description: 'Packing List saved successfully!' });
      form.reset({
        listId: `PL-${Date.now().toString().slice(-6)}`,
        date: new Date(),
        items: [{ photo: '', sku: '', description: '', quantity: 1, unitPriceCny: 0, remarks: '' }],
      });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 no-print">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Packing List Details</h3>
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
                      <FormField control={form.control} name={`items.${index}.remarks`} render={({ field }) => (
                        <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </Card>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ photo: '', sku: '', description: '', quantity: 1, unitPriceCny: 0, remarks: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
              <div className="flex justify-end gap-2">
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
                <h1 className="text-3xl font-bold text-primary">PACKING LIST</h1>
                <p className="text-muted-foreground mt-2"># {form.getValues('listId')}</p>
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
                  <TableHead className="text-right">Unit Price ({currency.code})</TableHead>
                  <TableHead className="text-right">Total ({currency.code})</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchedItems.map((item, index) => {
                  const quantity = Number(item.quantity) || 0;
                  const unitPriceCny = Number(item.unitPriceCny) || 0;
                  const totalCny = quantity * unitPriceCny;
                  const unitPriceConverted = unitPriceCny * exchangeRate;
                  const totalConverted = totalCny * exchangeRate;
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
                      <TableCell className="text-right">¥{unitPriceCny.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">¥{totalCny.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{currency.symbol}{unitPriceConverted.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{currency.symbol}{totalConverted.toFixed(2)}</TableCell>
                      <TableCell>{item.remarks}</TableCell>
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
                    <TableRow>
                      <TableCell className="font-bold">TOTAL AMOUNT ({currency.code})</TableCell>
                      <TableCell className="text-right font-bold">{currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PackingListHistory() {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLists() {
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
  }, []);

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
                      <Link href={`/admin/packing-list/${list.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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

export default function PackingListPage() {
  const router = useRouter();
  
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="container py-8 printable-area">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-3xl font-bold">Packing List</h1>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      <Tabs defaultValue="generator" className="no-print">
        <TabsList className="mb-4">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="generator">
          <PackingListGenerator />
        </TabsContent>
        <TabsContent value="history">
          <PackingListHistory />
        </TabsContent>
      </Tabs>
      
      <div className="hidden print-block">
        {/* We need to render the generator again for printing, but we can't have two forms with the same logic easily without major refactoring.
            A better approach would be a dedicated print preview page. For now, the user can print from the generator tab.
            The print CSS will hide the form and only show the preview. */}
        <PackingListGenerator />
      </div>
    </div>
  );
}
