'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Printer, Save, Eye, Pencil, ArrowLeft, GripVertical, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PrintFooter } from '@/components/layout/print-footer';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { CompanyInfoContext } from '@/context/company-info-context';
import { getProducts, Product } from '@/actions/products';
import { getSuppliers, Supplier } from '@/actions/suppliers';
import { addSupplierContract, getSupplierContracts, updateSupplierContract, deleteSupplierContract, SupplierContract } from '@/actions/supplier-contracts';

const contractItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPrice: z.coerce.number().nonnegative('Price cannot be negative.'),
  total: z.coerce.number().nonnegative(),
  photo: z.string().optional(),
});

const contractClauseSchema = z.object({
  label: z.string().min(1, 'Libellé requis'),
  value: z.string().min(1, 'Contenu requis'),
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
  clauses: z.array(contractClauseSchema).min(1, 'Au moins une clause est requise'),
  specificClauses: z.string().optional(),
});

type ContractFormValues = z.infer<typeof formSchema>;

function ContractGenerator({ editingContract, onFinished, products, suppliers }: { editingContract: SupplierContract | null, onFinished: () => void, products: Product[], suppliers: Supplier[] }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);
  
  const getInitialValues = () => {
    if (editingContract) {
        return {
            ...editingContract,
            date: new Date(editingContract.date),
            items: editingContract.items.map(item => ({...item, photo: item.photo || ''})),
            clauses: editingContract.clauses || [
              { label: 'Quality Control', value: 'AQL 2.5/4.0' },
              { label: 'Payment Terms', value: '30% TT deposit, balance payable before shipping after quality control' },
              { label: 'Delivery Terms', value: 'FOB Ningbo' },
              { label: 'Lead Time', value: '30-35 days after deposit' }
            ],
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
      clauses: [
        { label: 'Quality Control', value: 'AQL 2.5/4.0' },
        { label: 'Payment Terms', value: '30% TT deposit, balance payable before shipping after quality control' },
        { label: 'Delivery Terms', value: 'FOB Ningbo' },
        { label: 'Lead Time', value: '30-35 days after deposit' }
      ],
      specificClauses: '',
    };
  }

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });
  
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control: form.control, name: 'items' });
  const { fields: clauseFields, append: appendClause, remove: removeClause } = useFieldArray({ control: form.control, name: 'clauses' });
  
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
          const src = img.src;
          if (src && !src.startsWith('data:')) {
              try {
                  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
                  const res = await fetch(proxyUrl);
                  const blob = await res.blob();
                  const b64 = await new Promise<string>(r => { const reader = new FileReader(); reader.onloadend = () => r(reader.result as string); reader.readAsDataURL(blob); });
                  img.src = b64;
                  await new Promise(r => { if (img.complete) r(1); else img.onload = () => r(1); });
              } catch (e) {}
          }
      }
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const data = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let imgWidth = pdfWidth;
      let imgHeight = imgWidth / ratio;
      let heightLeft = imgHeight;
      let pos = 0;
      pdf.addImage(data, 'PNG', 0, pos, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) { pos = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(data, 'PNG', 0, pos, imgWidth, imgHeight); heightLeft -= pdfHeight; }
      pdf.save(`contract-${watchedValues.contractNumber}.pdf`);
  };

  const onSubmit = async (values: ContractFormValues) => {
    setIsSubmitting(true);
    const result = editingContract ? await updateSupplierContract(editingContract.id, values) : await addSupplierContract(values);
    if (result.success) { toast({ title: 'Success' }); onFinished(); }
    setIsSubmitting(false);
  };
  
  const totalAmount = watchedValues.items?.reduce((sum, item) => sum + ((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)), 0) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-between items-center"><h3 className="text-xl font-semibold">Édition Contrat</h3><div className="flex gap-2"><Button type="button" variant="outline" onClick={handleDownloadPdf}><Printer className="h-4 w-4" /></Button><Button type="submit" disabled={isSubmitting}><Save className="h-4 w-4" /></Button></div></div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contractNumber" render={({ field }) => ( <FormItem><FormLabel>Contract #</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="date" render={({ field }) => ( <FormItem><FormLabel>Date</FormLabel><FormControl><Input value={format(field.value, 'yyyy-MM-dd')} readOnly disabled /></FormControl></FormItem> )} />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-sm font-bold">Fournisseur</Label>
                      <Select onValueChange={handleSupplierSelect}>
                          <SelectTrigger><SelectValue placeholder="Choisir un fournisseur" /></SelectTrigger>
                          <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormField control={form.control} name="supplierName" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Nom du fournisseur" {...field} /></FormControl></FormItem> )} />
                      <FormField control={form.control} name="supplierAddress" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Adresse complète" {...field} rows={2} /></FormControl></FormItem> )} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-black uppercase text-primary">Articles du contrat</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendItem({ description: '', quantity: 1, unitPrice: 0, total: 0, photo: '' })}>+ Article</Button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {itemFields.map((field, index) => (
                        <Card key={field.id} className="p-3 relative bg-zinc-50 border-zinc-200">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="absolute top-1 right-1 h-6 w-6"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          <div className="space-y-2">
                              <Select onValueChange={(v) => handleProductSelect(v, index)}><SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="Lier un produit global" /></SelectTrigger><SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select>
                              <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => ( <FormItem><FormControl><Input className="h-8 text-xs font-bold" {...f} /></FormControl></FormItem> )} />
                              <div className="grid grid-cols-2 gap-2">
                                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => ( <FormItem><Label className="text-[9px] uppercase font-bold text-zinc-400">Qté</Label><FormControl><Input type="number" className="h-8 text-xs" {...f} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => ( <FormItem><Label className="text-[9px] uppercase font-bold text-zinc-400">Prix Achat (¥)</Label><FormControl><Input type="number" step="0.01" className="h-8 text-xs" {...f} /></FormControl></FormItem> )} />
                              </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-black uppercase text-primary">Clauses & Conditions</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendClause({ label: 'Nouvelle Clause', value: '...' })}>+ Clause</Button>
                    </div>
                    <div className="space-y-3">
                      {clauseFields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-lg space-y-2 bg-white shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <FormField control={form.control} name={`clauses.${index}.label`} render={({ field: f }) => ( <FormItem className="flex-grow"><FormControl><Input className="h-7 text-[10px] font-black uppercase tracking-wider" {...f} /></FormControl></FormItem> )} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeClause(index)} className="h-6 w-6 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <FormField control={form.control} name={`clauses.${index}.value`} render={({ field: f }) => ( <FormItem><FormControl><Textarea className="text-[11px] min-h-[60px]" {...f} /></FormControl></FormItem> )} />
                        </div>
                      ))}
                    </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            <div id="pdf-content" className="relative p-12 bg-white shadow-lg ring-1 ring-black ring-opacity-5 min-h-[297mm] pb-24 text-[10px]">
                <div className="flex-grow">
                    <header className="flex justify-between items-start pb-4 border-b-2 border-zinc-900">
                      <div>
                        {companyInfoContext?.companyInfo.logoDocument && <img src={companyInfoContext.companyInfo.logoDocument} alt="Logo" className="h-12 object-contain" />}
                      </div>
                      <div className="text-right">
                        <h1 className="text-[18px] font-black text-primary uppercase tracking-tighter">Purchase Contract</h1>
                        <p className="font-bold">No.: {watchedValues.contractNumber}</p>
                        <p className="text-zinc-400">Date: {format(watchedValues.date, 'yyyy-MM-dd')}</p>
                      </div>
                    </header>

                    <div className="grid grid-cols-2 gap-12 my-8">
                      <div className="space-y-2">
                        <h2 className="font-black border-b-2 border-zinc-100 pb-1 mb-2 uppercase text-[11px] text-zinc-400 tracking-widest">Buyer (Acheteur)</h2>
                        <p className="font-black text-[12px] text-zinc-900">{watchedValues.buyerName}</p>
                        <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap">{watchedValues.buyerAddress}</p>
                      </div>
                      <div className="space-y-2">
                        <h2 className="font-black border-b-2 border-zinc-100 pb-1 mb-2 uppercase text-[11px] text-zinc-400 tracking-widest">Seller (Vendeur)</h2>
                        <p className="font-black text-[12px] text-zinc-900">{watchedValues.supplierName}</p>
                        <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap">{watchedValues.supplierAddress}</p>
                        {watchedValues.supplierContact && <p className="text-[9px] font-bold">Contact: {watchedValues.supplierContact}</p>}
                      </div>
                    </div>

                    <table className="w-full border-collapse mt-8">
                      <thead>
                        <tr className="bg-zinc-900 text-white">
                          <th className="p-3 border-none text-left w-16 uppercase text-[9px] font-black">Photo</th>
                          <th className="p-3 border-none text-left uppercase text-[9px] font-black">Description</th>
                          <th className="p-3 border-none text-right uppercase text-[9px] font-black w-16">Qty</th>
                          <th className="p-3 border-none text-right uppercase text-[9px] font-black w-24">Unit (CNY)</th>
                          <th className="p-3 border-none text-right uppercase text-[9px] font-black w-28">Total (CNY)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {watchedValues.items?.map((item, index) => (
                          <tr key={index} className="border-b border-zinc-100">
                            <td className="p-2 text-center">
                              {item.photo && <img src={item.photo} className="w-12 h-12 object-contain mx-auto rounded border bg-zinc-50"/>}
                            </td>
                            <td className="p-3 align-top">
                              <p className="font-bold text-[11px] text-zinc-900 leading-tight">{item.description}</p>
                            </td>
                            <td className="p-3 align-top text-right font-bold">{item.quantity}</td>
                            <td className="p-3 align-top text-right font-medium">¥{Number(item.unitPrice || 0).toFixed(2)}</td>
                            <td className="p-3 align-top text-right font-black text-zinc-900">¥{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end mt-4">
                      <div className="w-1/2 flex justify-between items-end font-black border-t-4 border-zinc-900 pt-3">
                        <span className="uppercase text-[12px] tracking-tighter">TOTAL CONTRACT VALUE:</span>
                        <span className="text-[16px] text-primary">¥{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-12 space-y-6">
                        <h2 className="font-black text-center border-y-2 border-zinc-100 py-2 uppercase tracking-[0.3em] text-zinc-400 text-[11px]">Contractual Clauses</h2>
                        <div className="grid grid-cols-1 gap-6">
                          {watchedValues.clauses?.map((clause, idx) => (
                            <div key={idx} className="space-y-1">
                              <h3 className="font-black uppercase text-[10px] text-zinc-900 tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> {clause.label}
                              </h3>
                              <p className="text-zinc-600 leading-relaxed pl-3.5 border-l border-zinc-100">{clause.value}</p>
                            </div>
                          ))}
                        </div>
                    </div>

                    <div className="mt-20 grid grid-cols-2 gap-24">
                      <div className="space-y-12">
                        <div className="h-px bg-zinc-200"></div>
                        <div className="text-center">
                          <p className="font-black uppercase text-[10px] tracking-widest text-zinc-900">Authorized Buyer Signature</p>
                          <p className="text-[8px] text-zinc-400 mt-1 uppercase">{watchedValues.buyerName}</p>
                        </div>
                      </div>
                      <div className="space-y-12">
                        <div className="h-px bg-zinc-200"></div>
                        <div className="text-center">
                          <p className="font-black uppercase text-[10px] tracking-widest text-zinc-900">Authorized Seller Signature</p>
                          <p className="text-[8px] text-zinc-400 mt-1 uppercase">{watchedValues.supplierName}</p>
                        </div>
                      </div>
                    </div>
                </div>
                <PrintFooter />
            </div>
        </div>
    </div>
  );
}

function History({ onEdit, refreshKey }: { onEdit: (contract: SupplierContract) => void, refreshKey: number }) {
  const [contracts, setContracts] = useState<SupplierContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { async function fetch() { setIsLoading(true); try { const data = await getSupplierContracts(); setContracts(data); } finally { setIsLoading(false); } } fetch(); }, [refreshKey]);
  return (
    <Card className="border-none shadow-md overflow-hidden bg-white">
      <CardContent className="p-0">
        {contracts.length === 0 ? (
          <div className="text-center p-20 text-muted-foreground flex flex-col items-center gap-4">
            <FileText className="h-12 w-12 opacity-10" />
            <p>Aucun contrat fournisseur enregistré.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="pl-6">Contract #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-black pl-6">{c.contractNumber}</TableCell>
                  <TableCell className="text-zinc-500 text-xs">{format(new Date(c.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-bold">{c.supplierName}</TableCell>
                  <TableCell className="text-right font-black text-primary">¥{c.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right pr-6 space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => { await deleteSupplierContract(c.id); setContracts(contracts.filter(ct => ct.id !== c.id)); }} className="bg-destructive">Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
    </CardContent></Card>
  );
}

export default function SupplierContractPage() {
  const [view, setView] = useState<'history' | 'form'>('history');
  const [editingContract, setEditingContract] = useState<SupplierContract | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  useEffect(() => { async function fetchData() { const [p, s] = await Promise.all([getProducts(), getSuppliers()]); setProducts(p); setSuppliers(s); } fetchData(); }, []);
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Contrats Fournisseurs</h1>
          <p className="text-zinc-500">Gérez vos ordres d'achat officiels auprès des usines chinoises.</p>
        </div>
        <Button 
          variant={view === 'history' ? 'default' : 'outline'} 
          onClick={() => { setEditingContract(null); setView(view === 'history' ? 'form' : 'history'); }}
          className={cn(view === 'history' ? "bg-primary hover:bg-primary/90 font-bold" : "")}
        >
          {view === 'history' ? <PlusCircle className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
          {view === 'history' ? 'Nouveau Contrat' : 'Retour à la liste'}
        </Button>
      </div>
      {view === 'form' ? (
        <ContractGenerator editingContract={editingContract} onFinished={() => { setView('history'); setRefreshKey(k => k + 1); }} products={products} suppliers={suppliers} />
      ) : (
        <History onEdit={(c) => { setEditingContract(c); setView('form'); }} refreshKey={refreshKey} />
      )}
    </div>
  );
}
