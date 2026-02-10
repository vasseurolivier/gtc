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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, Trash2, Printer, UploadCloud, Save, Eye, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PrintFooter } from '@/components/layout/print-footer';

import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { getProducts, Product } from '@/actions/products';
import { addSupplier, getSuppliers, Supplier } from '@/actions/suppliers';
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

function ContractGenerator({ editingContract, onFinished, products, suppliers, onSupplierCreated }: { editingContract: SupplierContract | null, onFinished: () => void, products: Product[], suppliers: Supplier[], onSupplierCreated: () => void }) {
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

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
        form.setValue('supplierName', supplier.name);
        form.setValue('supplierAddress', supplier.address || '');
        form.setValue('supplierContact', supplier.contactName || '');
    }
  };

  const handleDownloadPdf = async () => {
      const element = document.getElementById('pdf-content');
      if (!element) return;
  
      const imgs = Array.from(element.getElementsByTagName('img'));
      for (const img of imgs) {
          const originalSrc = img.src;
          if (originalSrc && !originalSrc.startsWith('data:')) {
              try {
                  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(originalSrc)}`;
                  const response = await fetch(proxyUrl);
                  if (!response.ok) throw new Error('Proxy fetch failed');
                  const blob = await response.blob();
                  const base64 = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(blob);
                  });
                  img.src = base64;
                  await new Promise((resolve) => {
                      if (img.complete) resolve(true);
                      else img.onload = () => resolve(true);
                  });
              } catch (e) {
                  console.error("PDF Image conversion failed", originalSrc);
              }
          }
      }

      const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
      });
      const data = canvas.toDataURL('image/png');
  
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
  
      const ratio = canvas.width / canvas.height;
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
    setIsSubmitting(true);
    const result = editingContract
        ? await updateSupplierContract(editingContract.id, values)
        : await addSupplierContract(values);
    
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
  
  const totalAmount = watchedValues.items?.reduce((sum, item) => sum + ((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)), 0) || 0;
  const depositPercentage = Number(watchedValues.depositPercentage) || 0;
  const depositAmount = totalAmount * (depositPercentage / 100);
  const balanceAmount = totalAmount - depositAmount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Détails Contrat</h3>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleDownloadPdf}><Printer className="mr-2 h-4 w-4" /> PDF</Button>
                        <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}><Save className="mr-2 h-4 w-4" /> Sauver</Button>
                    </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contractNumber" render={({ field }) => ( <FormItem><FormLabel>Contract #</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="date" render={({ field }) => ( <FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl></FormItem> )} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                    <FormLabel>Fournisseur</FormLabel>
                    <Select onValueChange={handleSupplierSelect}>
                        <SelectTrigger><SelectValue placeholder="Choisir un fournisseur" /></SelectTrigger>
                        <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormField control={form.control} name="supplierName" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Nom Usine" {...field} /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="supplierAddress" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Adresse Usine" {...field} rows={2} /></FormControl></FormItem> )} />
                </div>
                 <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Articles</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                          <Card key={field.id} className="p-2 relative">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-1 right-1 h-6 w-6"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                            <div className="space-y-2">
                                <Select onValueChange={(value) => handleProductSelect(value, index)}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Lier produit" /></SelectTrigger>
                                    <SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                                </Select>
                                <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => ( <FormItem><FormControl><Input className="h-8 text-xs" placeholder="Description" {...f} /></FormControl></FormItem> )} />
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => ( <FormItem><FormControl><Input type="number" className="h-8 text-xs" {...f} /></FormControl></FormItem> )} />
                                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => ( <FormItem><FormControl><Input type="number" step="0.01" className="h-8 text-xs" {...f} /></FormControl></FormItem> )} />
                                </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0, photo: '' })}>+ Ajouter ligne</Button>
                  </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            <div id="pdf-content" className="relative p-8 bg-white shadow-lg ring-1 ring-black ring-opacity-5 min-h-[297mm] pb-12">
                <div className="flex-grow">
                    <header className="flex justify-between items-start pb-2 border-b">
                      <div>{companyInfoContext.companyInfo.logoDocument && <img src={companyInfoContext.companyInfo.logoDocument} alt="Logo" className="h-10 object-contain" />}</div>
                      <div className="text-right">
                        <h1 className="text-[14px] font-bold text-primary leading-tight uppercase">Purchase Contract</h1>
                        <p className="text-[10px] text-muted-foreground">Contract No.: {watchedValues.contractNumber}</p>
                        <p className="text-[10px] text-muted-foreground">Date: {format(watchedValues.date, 'yyyy-MM-dd')}</p>
                      </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-4 text-[10px]">
                      <div>
                        <h2 className="font-bold border-b mb-2 uppercase text-zinc-400">The Buyer:</h2>
                        <p className="font-bold text-zinc-900">{watchedValues.buyerName}</p>
                        <p className="whitespace-pre-wrap text-zinc-500 leading-tight">{watchedValues.buyerAddress}</p>
                      </div>
                      <div>
                        <h2 className="font-bold border-b mb-2 uppercase text-zinc-400">The Seller:</h2>
                        <p className="font-bold text-zinc-900">{watchedValues.supplierName}</p>
                        <p className="whitespace-pre-wrap text-zinc-500 leading-tight">{watchedValues.supplierAddress}</p>
                      </div>
                    </section>

                    <section>
                        <h2 className="font-bold text-center mb-2 text-[11px] uppercase tracking-widest border-y py-1">1. COMMODITY</h2>
                        <table className="w-full text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-zinc-100 text-zinc-900">
                                    <th className="p-2 border text-left w-12">Photo</th>
                                    <th className="p-2 border text-left">Description</th>
                                    <th className="p-2 border text-right w-10">Qty</th>
                                    <th className="p-2 border text-right w-24">Unit (CNY)</th>
                                    <th className="p-2 border text-right w-28">Total (CNY)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchedValues.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="p-1 border text-center">{item.photo && <img src={item.photo} alt="p" className="w-10 h-10 object-contain mx-auto"/>}</td>
                                        <td className="p-2 border font-medium leading-tight">{item.description}</td>
                                        <td className="p-2 border text-right">{item.quantity}</td>
                                        <td className="p-2 border text-right">¥{Number(item.unitPrice || 0).toFixed(2)}</td>
                                        <td className="p-2 border text-right font-bold">¥{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end mt-2">
                            <div className="w-1/2 flex justify-between font-black text-[11px] border-t-2 border-zinc-900 pt-1">
                                <span>TOTAL CONTRACT VALUE:</span>
                                <span>¥{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>
                    
                    <section className="mt-4 space-y-1 text-[10px]">
                        <h2 className="font-bold text-center mb-2 uppercase tracking-widest border-y py-1">2. TERMS</h2>
                        <p><strong>- Quality:</strong> {watchedValues.qualityControl}.</p>
                        <p><strong>- Payment:</strong> {depositPercentage}% TT deposit, balance {balanceAmount.toFixed(2)} CNY ({watchedValues.balanceTerms}).</p>
                        <p><strong>- Delivery:</strong> {watchedValues.shippingTerms} | {watchedValues.leadTime}.</p>
                        {watchedValues.specificClauses && <p><strong>- Clauses:</strong> <span className="whitespace-pre-wrap">{watchedValues.specificClauses}</span></p>}
                    </section>
                    
                    <section className="mt-12 text-[10px]">
                      <div className="grid grid-cols-2 gap-16">
                          <div className="pt-6 border-t border-zinc-200">
                              <p className="font-bold uppercase mb-1">The Buyer Signature</p>
                              <p className="text-zinc-400 italic">Authorized Signature & Stamp</p>
                          </div>
                          <div className="pt-6 border-t border-zinc-200">
                              <p className="font-bold uppercase mb-1">The Seller Signature</p>
                              <p className="text-zinc-400 italic">Authorized Signature & Stamp</p>
                          </div>
                      </div>
                    </section>
                </div>
                <PrintFooter />
            </div>
        </div>
    </div>
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
                    <div className="text-center p-16 text-muted-foreground"><p>Aucun contrat archivé.</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contract #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((contract) => (
                                <TableRow key={contract.id}>
                                    <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                                    <TableCell>{contract.supplierName}</TableCell>
                                    <TableCell>{format(new Date(contract.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-right">¥{contract.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(contract)}><Pencil className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirmer suppression ?</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(contract.id)}>Supprimer</AlertDialogAction>
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
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            try {
                const [fetchedProducts, fetchedSuppliers] = await Promise.all([
                    getProducts(),
                    getSuppliers()
                ]);
                setProducts(fetchedProducts);
                setSuppliers(fetchedSuppliers);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load initial data.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);
    
    const handleSupplierCreated = async () => {
        const fetchedSuppliers = await getSuppliers();
        setSuppliers(fetchedSuppliers);
    };

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
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container py-8">
             <div className="flex justify-between items-center mb-8 no-print">
                <h1 className="text-3xl font-bold">Contrats Fournisseurs</h1>
                 {activeTab === 'generator' && editingContract && (
                    <Button variant="outline" onClick={handleNew}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Nouveau Contrat
                    </Button>
                 )}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
                <TabsList className="mb-4">
                    <TabsTrigger value="generator">{editingContract ? 'Modifier' : 'Générateur'}</TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <TabsContent value="generator">
                    <ContractGenerator 
                        key={generatorKey} 
                        editingContract={editingContract} 
                        onFinished={handleFinished} 
                        products={products}
                        suppliers={suppliers}
                        onSupplierCreated={handleSupplierCreated}
                    />
                </TabsContent>
                <TabsContent value="history">
                    <ContractHistory onEdit={handleEdit} refreshKey={refreshKey} />
                </TabsContent>
            </Tabs>
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
