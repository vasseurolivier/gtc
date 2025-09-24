
'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Printer, Loader2, PlusCircle, Trash2, UploadCloud } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CurrencyContext } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';
import { CompanyInfoContext } from '@/context/company-info-context';
import { format } from 'date-fns';

const packingListItemSchema = z.object({
  photo: z.string().optional(),
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

export default function PackingListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const currencyContext = useContext(CurrencyContext);
  const companyInfoContext = useContext(CompanyInfoContext);
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  const form = useForm<PackingListValues>({
    resolver: zodResolver(packingListSchema),
    defaultValues: {
      listId: `PL-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      items: [{
        photo: '',
        description: '',
        quantity: 1,
        unitPriceCny: 0,
        remarks: '',
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  if (!currencyContext || !companyInfoContext) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
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
    const totalCny = item.quantity * item.unitPriceCny;
    acc.totalQuantity += item.quantity;
    acc.totalAmountCny += totalCny;
    return acc;
  }, { totalQuantity: 0, totalAmountCny: 0 });

  const handlePrint = () => {
    window.print();
  };

  if (!isClient) {
    return (
         <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container py-8 printable-area">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-3xl font-bold">Packing List Generator</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Packing List Details</h3>
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="listId" render={({ field }) => (
                    <FormItem><FormLabel>Packing List #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Separator />
                <div className="space-y-4">
                    <h4 className="font-medium">Items</h4>
                    {fields.map((field, index) => (
                         <Card key={field.id} className="p-4 relative">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-6 w-6"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            <div className="space-y-2">
                                <FormField control={form.control} name={`items.${index}.photo`} render={({ field: photoField }) => (
                                    <FormItem>
                                        <FormLabel>Photo</FormLabel>
                                         <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                                {photoField.value ? <Image src={photoField.value} alt="Product" width={64} height={64} className="object-contain" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                                            </div>
                                            <FormControl><Input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, index)} className="w-auto"/></FormControl>
                                        </div>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                        <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`items.${index}.unitPriceCny`} render={({ field }) => (
                                        <FormItem><FormLabel>Unit Price (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name={`items.${index}.remarks`} render={({ field }) => (
                                    <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                         </Card>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ photo: '', description: '', quantity: 1, unitPriceCny: 0, remarks: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Item
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 print-content">
          <Card>
            <CardContent className="p-8">
                <header className="flex justify-between items-start mb-8 border-b pb-8">
                    <div>
                        {companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={120} height={120} className="object-contain"/>}
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
                    const totalCny = item.quantity * item.unitPriceCny;
                    const unitPriceEur = item.unitPriceCny * exchangeRate;
                    const totalEur = totalCny * exchangeRate;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                           {item.photo && <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                <Image src={item.photo} alt={item.description} width={64} height={64} className="object-contain"/>
                           </div>}
                        </TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">¥{item.unitPriceCny.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">¥{totalCny.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{currency.symbol}{unitPriceEur.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">{currency.symbol}{totalEur.toFixed(2)}</TableCell>
                        <TableCell>{item.remarks}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Separator className="my-4"/>
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
    </div>
  );
}
