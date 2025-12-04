'use client';

import { useEffect, useState, useContext, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PrintFooter } from '@/components/layout/print-footer';
import { Loader2, PlusCircle, Trash2, Printer } from 'lucide-react';

import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';

const contractItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPrice: z.coerce.number().nonnegative('Price cannot be negative.'),
  total: z.coerce.number().nonnegative(),
});

const formSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required.'),
  date: z.date(),
  supplierName: z.string().min(1, 'Supplier name is required.'),
  supplierAddress: z.string().min(1, 'Supplier address is required.'),
  supplierContact: z.string().optional(),
  buyerName: z.string(),
  buyerAddress: z.string(),
  items: z.array(contractItemSchema).min(1, 'At least one item is required.'),
  totalAmount: z.coerce.number(),
  depositPercentage: z.coerce.number().min(0).max(100).default(30),
  balanceTerms: z.string().default('Payable before shipping after quality control'),
  qualityControl: z.string().default('AQL 2.5/4.0'),
  shippingTerms: z.string().default('FOB Ningbo'),
  leadTime: z.string().default('30-35 days after deposit'),
  notes: z.string().optional(),
});

type ContractFormValues = z.infer<typeof formSchema>;

export default function SupplierContractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);
  const currencyContext = useContext(CurrencyContext);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractNumber: `SC-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      totalAmount: 0,
      depositPercentage: 30,
      balanceTerms: 'Payable before shipping after quality control',
      qualityControl: 'AQL 2.5/4.0',
      shippingTerms: 'FOB Ningbo',
      leadTime: '30-35 days after deposit',
      notes: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const { items } = watchedValues;
    if (items) {
      const newTotal = items.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unitPrice) || 0;
          const itemTotal = quantity * unitPrice;
          const currentItemIndex = items.indexOf(item);
          if (form.getValues(`items.${currentItemIndex}.total`) !== itemTotal) {
            form.setValue(`items.${currentItemIndex}.total`, itemTotal);
          }
          return sum + itemTotal;
      }, 0);
      
      if (form.getValues('totalAmount') !== newTotal) {
         form.setValue('totalAmount', newTotal, { shouldValidate: true });
      }
    }
  }, [watchedValues.items, form]);
  
  useEffect(() => {
    if (companyInfoContext?.companyInfo) {
      form.setValue('buyerName', companyInfoContext.companyInfo.name);
      form.setValue('buyerAddress', companyInfoContext.companyInfo.address);
    }
  }, [companyInfoContext?.companyInfo, form]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };
  
  const { totalAmount, depositPercentage } = watchedValues;
  const depositAmount = totalAmount * (depositPercentage / 100);
  const balanceAmount = totalAmount - depositAmount;

  if (!companyInfoContext || !currencyContext) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  const { companyInfo } = companyInfoContext;
  const { currency, exchangeRate } = currencyContext;
  
  const qualityControlChinese = 
    watchedValues.qualityControl?.toLowerCase().includes('aql') 
    ? 'AQL (可接受质量水平) 国际抽样标准' 
    : '';

  return (
    <div className="container py-8 printable-area">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-3xl font-bold">Supplier Contract Generator</h1>
        <Button onClick={handlePrint} disabled={isPrinting}>
          <Printer className="mr-2 h-4 w-4" />
          {isPrinting ? 'Printing...' : 'Print / Export to PDF'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contract Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contractNumber" render={({ field }) => ( <FormItem><FormLabel>Contract #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="date" render={({ field }) => ( <FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Supplier Information</h3>
                    <FormField control={form.control} name="supplierName" render={({ field }) => ( <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="supplierAddress" render={({ field }) => ( <FormItem><FormLabel>Supplier Address</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="supplierContact" render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Items</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                          <Card key={field.id} className="p-4 relative">
                            <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                            <div className="space-y-2">
                                <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...f} /></FormControl></FormItem> )} />
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => ( <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem> )} />
                                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => ( <FormItem><FormLabel>Unit Price (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl></FormItem> )} />
                                </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0 })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Item </Button>
                  </div>
                   <Separator />
                   <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                        <FormField control={form.control} name="depositPercentage" render={({ field }) => ( <FormItem><FormLabel>Deposit (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="balanceTerms" render={({ field }) => ( <FormItem><FormLabel>Balance Payment Terms</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="qualityControl" render={({ field }) => ( <FormItem><FormLabel>Quality Control</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="shippingTerms" render={({ field }) => ( <FormItem><FormLabel>Shipping Terms (Incoterms)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="leadTime" render={({ field }) => ( <FormItem><FormLabel>Lead Time</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Additional Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem> )} />
                   </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div id="pdf-content" className="lg:col-span-2 print-content min-h-[29.7cm] flex flex-col">
            <Card className="flex-grow">
              <CardContent className="p-8 text-sm">
                <header className="flex justify-between items-start mb-8">
                  <div>
                    {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" crossOrigin="anonymous" className="h-20 object-contain" />}
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-bold text-primary">PURCHASE CONTRACT</h1>
                    <p className="text-muted-foreground mt-1">合同编号 (Contract No.): {watchedValues.contractNumber}</p>
                    <p className="text-muted-foreground">签订日期 (Date): {format(watchedValues.date, 'yyyy-MM-dd')}</p>
                  </div>
                </header>
                
                <section className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="font-bold border-b mb-2 pb-1">买方 (The Buyer):</h2>
                    <p className="font-semibold">{watchedValues.buyerName}</p>
                    <p className="whitespace-pre-wrap">{watchedValues.buyerAddress}</p>
                  </div>
                  <div>
                    <h2 className="font-bold border-b mb-2 pb-1">卖方 (The Seller):</h2>
                    <p className="font-semibold">{watchedValues.supplierName}</p>
                    <p className="whitespace-pre-wrap">{watchedValues.supplierAddress}</p>
                    {watchedValues.supplierContact && <p>Attn: {watchedValues.supplierContact}</p>}
                  </div>
                </section>

                <section>
                    <h2 className="font-bold text-center mb-2">1. 商品 (COMMODITY)</h2>
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr className="border">
                                <th className="p-2 border text-left">货描 (Description)</th>
                                <th className="p-2 border text-right">数量 (Quantity)</th>
                                <th className="p-2 border text-right">单价 (Unit Price CNY)</th>
                                <th className="p-2 border text-right">总价 (Total Amount CNY)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchedValues.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-2 border">{item.description}</td>
                                    <td className="p-2 border text-right">{item.quantity}</td>
                                    <td className="p-2 border text-right">¥{item.unitPrice.toFixed(2)}</td>
                                    <td className="p-2 border text-right">¥{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={3} className="p-2 border text-right font-bold">合同总价 (Total Contract Value):</td>
                                <td className="p-2 border text-right font-bold">¥{totalAmount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                
                <section className="mt-6 space-y-2">
                    <h2 className="font-bold text-center mb-2">2. 合同条款 (TERMS)</h2>
                    <p><strong>- 质量要求 (Quality Control):</strong> {watchedValues.qualityControl}. {qualityControlChinese}</p>
                    <p><strong>- 付款条件 (Payment Terms):</strong> {depositPercentage}% TT deposit, balance {balanceAmount.toFixed(2)} CNY ({watchedValues.balanceTerms}).</p>
                    <p><strong>- 交货条件 (Shipping Terms):</strong> {watchedValues.shippingTerms}.</p>
                    <p><strong>- 交货时间 (Lead Time):</strong> {watchedValues.leadTime}.</p>
                    {watchedValues.notes && <p><strong>- 备注 (Notes):</strong> <span className="whitespace-pre-wrap">{watchedValues.notes}</span></p>}
                </section>
                
                 {/* This container will be pushed to the bottom */}
                <div className="flex-grow"></div>

                <section className="mt-24 pt-8">
                  <div className="grid grid-cols-2 gap-16">
                      <div>
                          <p className="font-bold">买方 (The Buyer):</p>
                          <p className="mt-2">{watchedValues.buyerName}</p>
                          <div className="mt-16 border-t pt-2">
                              <p>Authorized Signature & Stamp</p>
                          </div>
                      </div>
                      <div>
                          <p className="font-bold">卖方 (The Seller):</p>
                          <p className="mt-2">{watchedValues.supplierName}</p>
                           <div className="mt-16 border-t pt-2">
                              <p>Authorized Signature & Stamp</p>
                          </div>
                      </div>
                  </div>
                </section>

              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
