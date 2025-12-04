

'use client';

import { useEffect, useState, useContext, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PrintFooter } from '@/components/layout/print-footer';
import { Loader2, PlusCircle, Trash2, Printer, UploadCloud, Save, Eye, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { getProducts, Product } from '@/actions/products';
import { addSupplierContract, getSupplierContracts, updateSupplierContract, deleteSupplierContract, SupplierContract } from '@/actions/supplier-contracts';

const contractItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPrice: z.coerce.number().nonnegative('Price cannot be negative.'),
  total: z.coerce.number().nonnegative(),
  photo: z.string().optional(),
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
  specificClauses: z.string().optional(),
});

type ContractFormValues = z.infer<typeof formSchema>;

function ContractGenerator({ editingContract, onFinished, products }: { editingContract: SupplierContract | null, onFinished: () => void, products: Product[] }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);
  const currencyContext = useContext(CurrencyContext);
  
  const getInitialValues = () => {
    if (editingContract) {
        return {
            ...editingContract,
            date: new Date(editingContract.date),
            items: editingContract.items.map(item => ({...item, photo: item.photo || ''})),
        };
    }
    return {
      contractNumber: `SC-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      supplierName: '',
      supplierAddress: '',
      supplierContact: '',
      buyerName: companyInfoContext?.companyInfo.name || '',
      buyerAddress: companyInfoContext?.companyInfo.address || '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0, photo: '' }],
      totalAmount: 0,
      depositPercentage: 30,
      balanceTerms: 'Payable before shipping after quality control',
      qualityControl: 'AQL 2.5/4.0',
      shippingTerms: 'FOB Ningbo',
      leadTime: '30-35 days after deposit',
      specificClauses: '',
    };
  }

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (companyInfoContext?.companyInfo && !editingContract) {
      form.setValue('buyerName', companyInfoContext.companyInfo.name);
      form.setValue('buyerAddress', companyInfoContext.companyInfo.address);
    }
  }, [companyInfoContext?.companyInfo, form, editingContract]);
  
  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitPrice`, product.purchasePrice || 0);
      form.setValue(`items.${index}.photo`, product.imageUrl || '');
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
  
      pdf.save(`contract-${watchedValues.contractNumber}.pdf`);
  };

  const onSubmit = async (values: ContractFormValues) => {
    const items = values.items || [];
    let totalAmount = 0;
    items.forEach((item, index) => {
        if (!item) return;
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const newTotal = quantity * unitPrice;
        form.setValue(`items.${index}.total`, newTotal, { shouldValidate: false });
        totalAmount += newTotal;
    });
    form.setValue("totalAmount", totalAmount, { shouldValidate: true });
    
    // We need to get the latest values after setting totals
    const finalValues = form.getValues();

    setIsSubmitting(true);
    const result = editingContract
        ? await updateSupplierContract(editingContract.id, finalValues)
        : await addSupplierContract(finalValues);
    
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      onFinished();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  if (!companyInfoContext || !currencyContext) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  const { companyInfo } = companyInfoContext;
  
  const totalAmount = watchedValues.items?.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0) || 0;
  const depositAmount = totalAmount * ((watchedValues.depositPercentage || 0) / 100);
  const balanceAmount = totalAmount - depositAmount;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">{editingContract ? 'Edit Contract' : 'Contract Details'}</h3>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                            <Printer className="mr-2 h-4 w-4" /> Export to PDF
                        </Button>
                        <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
                <div className="space-y-4">
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
                                <Select onValueChange={(value) => handleProductSelect(value, index)}>
                                    <SelectTrigger><SelectValue placeholder="Select a product or describe" /></SelectTrigger>
                                    <SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>))}</SelectContent>
                                </Select>
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                                      {watchedValues.items?.[index]?.photo ? (
                                          <Image src={watchedValues.items[index].photo!.trimEnd()} alt="Product" width={64} height={64} className="object-contain" />
                                      ) : (<UploadCloud className="h-6 w-6 text-muted-foreground" />)}
                                  </div>
                                  <FormField control={form.control} name={`items.${index}.photo`} render={({ field: photoField }) => (
                                      <FormItem className="w-full"><FormLabel>Photo URL</FormLabel><FormControl><Input placeholder="https://..." {...photoField} /></FormControl></FormItem>
                                  )} />
                               </div>
                                <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...f} /></FormControl></FormItem> )} />
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => ( <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem> )} />
                                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => ( <FormItem><FormLabel>Unit Price (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl></FormItem> )} />
                                </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0, photo: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Item </Button>
                  </div>
                   <Separator />
                   <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                        <FormField control={form.control} name="depositPercentage" render={({ field }) => ( <FormItem><FormLabel>Deposit (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="balanceTerms" render={({ field }) => ( <FormItem><FormLabel>Balance Payment Terms</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="qualityControl" render={({ field }) => ( <FormItem><FormLabel>Quality Control</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="shippingTerms" render={({ field }) => ( <FormItem><FormLabel>Shipping Terms (Incoterms)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="leadTime" render={({ field }) => ( <FormItem><FormLabel>Lead Time</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        <FormField control={form.control} name="specificClauses" render={({ field }) => ( <FormItem><FormLabel>Specific Clauses</FormLabel><FormControl><Textarea placeholder="Add any specific clauses or notes here..." {...field} rows={4} /></FormControl></FormItem> )} />
                   </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 lg:block" id="pdf-content">
            <div className="pdf-page bg-white p-8 shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="flex flex-col min-h-full">
                <header className="flex justify-between items-start mb-8">
                  <div>{companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" crossOrigin="anonymous" className="h-20 object-contain" />}</div>
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
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr className="border"><th className="p-2 border text-left w-20">图片 (Photo)</th><th className="p-2 border text-left">货描 (Description)</th><th className="p-2 border text-right">数量 (Quantity)</th><th className="p-2 border text-right">单价 (Unit Price CNY)</th><th className="p-2 border text-right">总价 (Total Amount CNY)</th></tr>
                        </thead>
                        <tbody>
                            {watchedValues.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-2 border align-top">{item.photo && <img src={item.photo.trimEnd()} alt={item.description} crossOrigin="anonymous" className="w-16 h-16 object-contain"/>}</td>
                                    <td className="p-2 border align-top">{item.description}</td>
                                    <td className="p-2 border text-right align-top">{item.quantity}</td>
                                    <td className="p-2 border text-right align-top">¥{item.unitPrice.toFixed(2)}</td>
                                    <td className="p-2 border text-right align-top">¥{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                  <>
                    <div className="flex justify-end mt-4">
                        <div className="w-1/2">
                             <table className="w-full">
                                <tbody>
                                    <tr className="font-bold">
                                        <td className="p-2 text-right">合同总价 (Total Contract Value):</td>
                                        <td className="p-2 text-right">¥{totalAmount.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <section className="mt-6 space-y-2">
                        <h2 className="font-bold text-center mb-2">2. 合同条款 (TERMS)</h2>
                        <p><strong>- 质量要求 (Quality Control):</strong> {watchedValues.qualityControl}. {watchedValues.qualityControl?.toLowerCase().includes('aql') ? 'AQL (可接受质量水平) 国际抽样标准' : ''}</p>
                        <p><strong>- 付款条件 (Payment Terms):</strong> {watchedValues.depositPercentage}% TT deposit, balance {balanceAmount.toFixed(2)} CNY ({watchedValues.balanceTerms}).</p>
                        <p><strong>- 交货条件 (Shipping Terms):</strong> {watchedValues.shippingTerms}.</p>
                        <p><strong>- 交货时间 (Lead Time):</strong> {watchedValues.leadTime}.</p>
                        {watchedValues.specificClauses && <p><strong>- 特别条款 (Specific Clauses):</strong> <span className="whitespace-pre-wrap">{watchedValues.specificClauses}</span></p>}
                    </section>
                    
                    <div className="flex-grow"></div>

                    <section className="mt-24 pt-8">
                      <div className="grid grid-cols-2 gap-16">
                          <div>
                              <p className="font-bold">买方 (The Buyer):</p>
                              <p className="mt-2">{watchedValues.buyerName}</p>
                              <div className="mt-16 border-t pt-2"><p>Authorized Signature & Stamp</p></div>
                          </div>
                          <div>
                              <p className="font-bold">卖方 (The Seller):</p>
                              <p className="mt-2">{watchedValues.supplierName}</p>
                               <div className="mt-16 border-t pt-2"><p>Authorized Signature & Stamp</p></div>
                          </div>
                      </div>
                    </section>
                  </>
                <PrintFooter />
              </div>
            </div>
        </div>
      </div>
    </>
  );
}

function ContractHistory({ onEdit, refreshKey }: { onEdit: (contract: SupplierContract) => void, refreshKey: number }) {
    const [contracts, setContracts] = useState<SupplierContract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchContracts() {
            setIsLoading(true);
            try {
                const fetchedContracts = await getSupplierContracts();
                setContracts(fetchedContracts);
            } catch (error) {
                console.error("Failed to fetch contracts", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchContracts();
    }, [refreshKey]);

    const handleDelete = async (id: string) => {
        const result = await deleteSupplierContract(id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setContracts(prev => prev.filter(c => c.id !== id));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <Card>
            <CardContent className="p-0">
                {contracts.length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground"><p>No saved supplier contracts found.</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contract #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((contract) => (
                                <TableRow key={contract.id}>
                                    <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                                    <TableCell>{contract.supplierName}</TableCell>
                                    <TableCell>{format(new Date(contract.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="text-right">¥{contract.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(contract)}><Pencil className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action will permanently delete this contract.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(contract.id)}>Delete</AlertDialogAction>
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

function SupplierContractPageContent() {
    const [activeTab, setActiveTab] = useState("generator");
    const [editingContract, setEditingContract] = useState<SupplierContract | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
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

    const handleEdit = (contract: SupplierContract) => {
        setEditingContract(contract);
        setGeneratorKey(`edit-${contract.id}-${Date.now()}`);
        setActiveTab("generator");
    };

    const handleFinished = () => {
        setEditingContract(null);
        setGeneratorKey(`new-${Date.now()}`);
        setRefreshKey(prev => prev + 1);
        setActiveTab("history");
    };

    const handleNew = () => {
        setEditingContract(null);
        setGeneratorKey(`new-${Date.now()}`);
        setActiveTab("generator");
    }
    
    if (isLoadingProducts) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container py-8">
             <div className="flex justify-between items-center mb-8 no-print">
                <h1 className="text-3xl font-bold">Supplier Contract</h1>
                 {activeTab === 'generator' && editingContract && (
                    <Button variant="outline" onClick={handleNew}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Contract
                    </Button>
                 )}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
                <TabsList className="mb-4">
                    <TabsTrigger value="generator">{editingContract ? 'Edit Contract' : 'Generator'}</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="generator">
                    <ContractGenerator key={generatorKey} editingContract={editingContract} onFinished={handleFinished} products={products} />
                </TabsContent>
                <TabsContent value="history">
                    <ContractHistory onEdit={handleEdit} refreshKey={refreshKey} />
                </TabsContent>
            </Tabs>

            <div className="hidden print-block">
                <ContractGenerator key={generatorKey} editingContract={editingContract} onFinished={handleFinished} products={products} />
            </div>
        </div>
    );
}

export default function SupplierContractPage() {
    const router = useRouter();
    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
            router.push('/admin/login');
        }
    }, [router]);

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <SupplierContractPageContent />
        </Suspense>
    );
}
