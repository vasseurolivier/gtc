
'use client';

import { useEffect, useState, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addQuote, getQuotes, deleteQuote, updateQuoteStatus, updateQuote, Quote } from '@/actions/quotes';
import { getCustomers, Customer } from '@/actions/customers';
import { getRegisteredClients, RegisteredClient, getRegisteredClientById } from '@/actions/registered-clients';
import { getProducts, Product } from '@/actions/products';
import { getOrderById } from '@/actions/orders';
import { uploadImage } from '@/actions/upload';
import { Loader2, PlusCircle, Trash2, Eye, Pencil, Package, ShieldCheck, Sparkles, Link as LinkIcon, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { CurrencyContext } from '@/context/currency-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const quoteItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().positive("Qty must be > 0."),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative."),
  purchasePrice: z.coerce.number().nonnegative("Cost price cannot be negative.").optional().default(0),
  total: z.number(),
  photo: z.string().optional(),
  weight: z.coerce.number().optional().default(0),
});

const quoteStatusSchema = z.enum(["draft", "sent", "accepted", "rejected", "paid"]);

const formSchema = z.object({
  quoteNumber: z.string().min(1, "Proforma number is required."),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  orderId: z.string().optional(),
  issueDate: z.date({ required_error: "Issue date is required."}),
  validUntil: z.date({ required_error: "Validity date is required."}),
  items: z.array(quoteItemSchema).min(1, "Please add at least one item."),
  subTotal: z.coerce.number(),
  transportCost: z.coerce.number().nonnegative("Transport cost cannot be negative.").optional().default(0),
  commissionRate: z.coerce.number().min(0).max(100).optional().default(0),
  commissionBasis: z.enum(['products_only', 'total']).default('products_only'),
  totalAmount: z.coerce.number(),
  status: quoteStatusSchema,
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  depositRequired: z.boolean().default(true),
  depositPercentage: z.coerce.number().min(0).max(100).optional().default(30),
});

function QuotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
      issueDate: new Date(),
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "", weight: 0 }],
      subTotal: 0,
      transportCost: 0,
      commissionRate: 0,
      commissionBasis: 'products_only',
      totalAmount: 0,
      status: "draft",
      shippingAddress: "",
      notes: "",
      depositRequired: true,
      depositPercentage: 30,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchItems = form.watch("items");
  const watchBasis = form.watch("commissionBasis");

  const calculateTotals = () => {
    const values = form.getValues();
    const items = values.items || [];
    let currentSubTotal = 0;
    
    items.forEach((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const newTotal = quantity * unitPrice;
      currentSubTotal += newTotal;
      if (item.total !== newTotal) {
        form.setValue(`items.${index}.total`, newTotal, { shouldValidate: false });
      }
    });

    const transportCost = Number(values.transportCost) || 0;
    const commissionRate = Number(values.commissionRate) || 0;
    const basis = values.commissionBasis;
    
    let totalAmount = 0;
    if (basis === 'total') {
      totalAmount = (currentSubTotal + transportCost) * (1 + commissionRate / 100);
    } else {
      const commissionAmount = currentSubTotal * (commissionRate / 100);
      totalAmount = currentSubTotal + transportCost + commissionAmount;
    }
    
    form.setValue("subTotal", currentSubTotal, { shouldValidate: true });
    form.setValue("totalAmount", totalAmount, { shouldValidate: true });
  };

  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name && (name.startsWith('items') || name === 'transportCost' || name === 'commissionRate' || name === 'commissionBasis')) {
        calculateTotals();
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }
    const orderId = searchParams.get('fromOrder');
    const directClientId = searchParams.get('clientId');

    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedQuotes, fetchedCustomers, fetchedProducts, fetchedRegistered] = await Promise.all([
          getQuotes(), 
          getCustomers(),
          getProducts(),
          getRegisteredClients()
        ]);
        setQuotes(fetchedQuotes);
        setCustomers(fetchedCustomers);
        setProducts(fetchedProducts);
        setRegisteredClients(fetchedRegistered);

        if (orderId) {
          const order = await getOrderById(orderId);
          if (order) {
            const clientData = await getRegisteredClientById(order.customerId);
            const basis = clientData?.commissionBasis || 'products_only';
            const newItems = order.items.map(item => ({
              sku: item.sku || "",
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              purchasePrice: (item as any).purchasePrice || 0,
              total: item.total,
              photo: (item as any).photo || "",
              weight: (item as any).weight || 0,
            }));
            const itemsTotal = newItems.reduce((sum, i) => sum + i.total, 0);
            form.reset({
              quoteNumber: `PI-${order.orderNumber.replace('ORD-', '').replace('O-', '')}`,
              customerId: order.customerId,
              customerName: order.customerName,
              orderId: order.id,
              issueDate: new Date(),
              validUntil: new Date(new Date().setDate(new Date().getDate() + 15)),
              items: newItems,
              subTotal: itemsTotal,
              transportCost: order.transportCost || 0,
              commissionRate: order.commissionRate || 0,
              commissionBasis: basis,
              totalAmount: order.totalAmount,
              status: "draft",
              shippingAddress: order.shippingAddress || "",
              depositRequired: true,
              depositPercentage: 30,
            });
            setIsDialogOpen(true);
            router.replace('/admin/quotes');
          }
        } else if (directClientId) {
            const client = fetchedRegistered.find(c => c.id === directClientId) || fetchedCustomers.find(c => c.id === directClientId);
            if (client) {
                const isReg = 'firstName' in client;
                form.reset({
                    quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
                    customerId: directClientId,
                    customerName: isReg ? `${(client as any).firstName} ${(client as any).lastName}` : (client as any).name,
                    issueDate: new Date(),
                    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
                    items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "", weight: 0 }],
                    subTotal: 0,
                    transportCost: 0,
                    commissionRate: 0,
                    commissionBasis: isReg ? (client as any).commissionBasis : 'products_only',
                    totalAmount: 0,
                    status: "draft",
                    shippingAddress: (client as any).address || "",
                    depositRequired: true,
                    depositPercentage: 30,
                });
                setIsDialogOpen(true);
                router.replace('/admin/quotes');
            }
        }
      } catch (error) { toast({ variant: 'destructive', title: 'Error' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast, searchParams, form]);
  
  const handleOpenDialog = (quote: Quote | null = null) => {
    setEditingQuote(quote);
    if (quote) {
        form.reset({
            ...quote,
            issueDate: new Date(quote.issueDate),
            validUntil: new Date(quote.validUntil),
            items: quote.items.map(item => ({...item, photo: item.photo || '', weight: item.weight || 0})),
            depositRequired: quote.depositRequired !== false,
            depositPercentage: quote.depositPercentage || 30,
            commissionBasis: (quote as any).commissionBasis || 'products_only',
        });
    } else {
        form.reset({
            quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
            issueDate: new Date(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "", weight: 0 }],
            subTotal: 0,
            transportCost: 0,
            commissionRate: 0,
            commissionBasis: 'products_only',
            totalAmount: 0,
            status: "draft",
            shippingAddress: "",
            notes: "",
            depositRequired: true,
            depositPercentage: 30,
        });
    }
    setIsDialogOpen(true);
  };
  
  const handleCustomerChange = async (customerId: string) => {
    const lead = customers.find(c => c.id === customerId);
    const registered = registeredClients.find(c => c.id === customerId);
    if (registered) {
        form.setValue("customerId", registered.id);
        form.setValue("customerName", `${registered.firstName} ${registered.lastName}`);
        form.setValue("commissionBasis", registered.commissionBasis || 'products_only');
    } else if (lead) {
        form.setValue("customerId", lead.id);
        form.setValue("customerName", lead.name);
        form.setValue("commissionBasis", 'products_only');
    }
  };

  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        form.setValue(`items.${index}.sku`, product.sku);
        form.setValue(`items.${index}.description`, product.description || product.name);
        form.setValue(`items.${index}.unitPrice`, product.price);
        form.setValue(`items.${index}.purchasePrice`, product.purchasePrice || 0);
        form.setValue(`items.${index}.photo`, product.imageUrl || "");
        form.setValue(`items.${index}.weight`, product.weight || 0);
        calculateTotals();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(index);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'proforma-manual');
    const result = await uploadImage(formData);
    if (result.success && result.url) {
      form.setValue(`items.${index}.photo`, result.url);
      toast({ title: "Image chargée" });
    }
    setUploadingIdx(null);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = editingQuote ? await updateQuote(editingQuote.id, values) : await addQuote(values);
    if (result.success) {
      toast({ title: 'Success' });
      const newQuotes = await getQuotes();
      setQuotes(newQuotes);
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteQuote = async (id: string) => {
    const result = await deleteQuote(id);
    if (result.success) {
        toast({ title: 'Success' });
        setQuotes(quotes.filter(q => q.id !== id));
    }
  };

  const handleStatusChange = async (quote: Quote, newStatus: Quote['status']) => {
    const originalQuotes = [...quotes];
    const updatedQuotes = quotes.map(q => q.id === quote.id ? {...q, status: newStatus} : q);
    setQuotes(updatedQuotes);
    const result = await updateQuoteStatus(quote.id, newStatus);
    if (!result.success) {
        setQuotes(originalQuotes);
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const subTotalValue = form.watch('subTotal') || 0;
  const totalAmountValue = form.watch('totalAmount') || 0;

  const ongoingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const archivedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'rejected' || q.status === 'paid');
  
  const archivedQuotesByCustomer = archivedQuotes.reduce((acc, quote) => {
    const customerId = quote.customerId;
    if (!acc[customerId]) acc[customerId] = [];
    acc[customerId].push(quote);
    return acc;
  }, {} as Record<string, Quote[]>);

  const renderTable = (quoteList: Quote[], isArchived = false) => (
    <Table>
      {!isArchived && (
        <TableHeader><TableRow><TableHead>Proforma #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      )}
      <TableBody>
        {quoteList.map((quote) => {
          const isLocked = quote.status === 'accepted' || quote.status === 'paid';
          return (
            <TableRow key={quote.id}>
              <TableCell className="font-medium"><div className="flex items-center gap-2">{quote.quoteNumber}{quote.orderId && <LinkIcon className="h-3 w-3 text-primary" />}{isLocked && <ShieldCheck className="h-3 w-3 text-green-600" />}</div></TableCell>
              <TableCell>{quote.customerName}</TableCell>
              <TableCell>{format(new Date(quote.issueDate), 'dd MMM yyyy')}</TableCell>
              <TableCell>
                <Select onValueChange={(value: Quote['status']) => handleStatusChange(quote, value)} defaultValue={quote.status}>
                  <SelectTrigger className="w-32"><Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="accepted">Accepted</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right"><div>¥{quote.totalAmount.toFixed(2)}</div><div className="text-xs text-muted-foreground">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</div></TableCell>
              <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild title="Voir PDF"><Link href={`/admin/quotes/${quote.id}`}><Eye className="h-4 w-4" /></Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(quote)} disabled={isLocked} className={cn(isLocked && "opacity-20")}><Pencil className="h-4 w-4" /></Button>
                  {!isLocked && (
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action supprimera définitivement ce document.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter></AlertDialogContent></AlertDialog>
                  )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const getStatusBadgeVariant = (status: Quote['status']) => {
    switch (status) {
        case 'paid': return 'default';
        case 'accepted': return 'default';
        case 'sent': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Proforma Invoices</h1><Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" />Créer manuellement</Button></div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingQuote ? 'Modifier Proforma' : 'Nouvelle Proforma'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="quoteNumber" render={({ field }) => ( <FormItem><FormLabel>Proforma #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="customerId" render={({ field }) => (
                      <FormItem className="lg:col-span-3">
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={handleCustomerChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <div className="p-2 text-[10px] font-bold text-zinc-400 uppercase bg-zinc-50">COMPTES CLIENTS</div>
                            {registeredClients.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                            <div className="p-2 text-[10px] font-bold text-zinc-400 uppercase bg-zinc-50 mt-2">PROSPECTS CRM</div>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <Card className="p-4 border-primary/20 bg-primary/5">
                  <CardHeader className="p-2 mb-2"><h4 className="font-bold flex items-center gap-2"><Package className="h-4 w-4"/> Articles</h4></CardHeader>
                  <CardContent className="p-0 space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-md bg-white shadow-sm">
                          <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                          <div className="space-y-4">
                                <Select onValueChange={(v) => handleProductSelect(v, index)}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Lier un produit global" /></SelectTrigger><SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>))}</SelectContent></Select>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => ( <FormItem><FormControl><Textarea placeholder="Désignation de l'article..." {...f} rows={2} /></FormControl></FormItem> )} />
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image Article</Label>
                                        <div className="flex gap-2">
                                          <div className="w-16 h-16 rounded border bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                                            {uploadingIdx === index ? <Loader2 className="h-4 w-4 animate-spin" /> : watchItems[index]?.photo ? <img src={watchItems[index].photo} className="object-contain w-full h-full" alt="" /> : <ImageIcon className="h-6 w-6 text-zinc-300" />}
                                          </div>
                                          <div className="flex-grow space-y-1">
                                            <FormField control={form.control} name={`items.${index}.photo`} render={({ field: f }) => ( <FormItem><FormControl><Input placeholder="URL photo..." {...f} className="h-7 text-[10px]" /></FormControl></FormItem> )} />
                                            <label className="flex items-center gap-2 cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-3 h-7 rounded text-[10px] font-bold transition-colors">
                                              <UploadCloud className="h-3 w-3" /> {uploadingIdx === index ? "Envoi..." : "Envoyer fichier"}
                                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, index)} disabled={uploadingIdx !== null} />
                                            </label>
                                          </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 items-end">
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (<FormItem><Label className="text-[10px] uppercase font-bold">Qté</Label><FormControl><Input type="number" {...f} /></FormControl></FormItem>)}/>
                                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => (<FormItem><Label className="text-[10px] uppercase font-bold">Prix Unit.</Label><FormControl><Input type="number" step="0.01" {...f} /></FormControl></FormItem>)}/>
                                    <div className="col-span-2 text-right pb-2"><Label className="text-[10px] uppercase font-bold block mb-1">Total</Label><span className="font-black text-sm">¥{watchItems[index]?.total?.toFixed(2) || '0.00'}</span></div>
                                </div>
                          </div>
                        </div>
                      ))}
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "", weight: 0 })}>+ Ajouter une ligne manuelle</Button>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t pt-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-white border rounded-2xl shadow-sm space-y-3">
                          <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Base de Commission</Label>
                          <FormField
                            control={form.control}
                            name="commissionBasis"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="products_only" id="pi-basis-prod" />
                                      <Label htmlFor="pi-basis-prod" className="text-xs font-bold cursor-pointer">Articles uniquement</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="total" id="pi-basis-total" />
                                      <Label htmlFor="pi-basis-total" className="text-xs font-bold cursor-pointer">Total (Articles + Transport)</Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem> )} />
                    </div>
                    <div className="bg-zinc-950 text-white p-6 rounded-2xl space-y-3">
                        <div className="flex justify-between text-sm"><span>Sous-total articles</span><span>¥{subTotalValue.toFixed(2)}</span></div>
                        <div className="grid grid-cols-2 gap-4 items-center"><span>Port (CNY)</span><FormField control={form.control} name="transportCost" render={({ field }) => ( <FormItem><FormControl><Input type="number" step="0.01" className="bg-white/10 h-8" {...field} /></FormControl></FormItem> )}/></div>
                        <div className="grid grid-cols-2 gap-4 items-center"><span>Commission (%)</span><FormField control={form.control} name="commissionRate" render={({ field }) => ( <FormItem><FormControl><Input type="number" step="0.01" className="bg-white/10 h-8 text-primary font-black" {...field} /></FormControl></FormItem> )}/></div>
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between font-black"><span>TOTAL FINAL</span><div className="text-right"><div>¥{totalAmountValue.toFixed(2)}</div><div className="text-xs">{currency.symbol}{(totalAmountValue * exchangeRate).toFixed(2)}</div></div></div>
                    </div>
                </div>
                <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t mt-6"><DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer Proforma</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      <Tabs defaultValue="ongoing">
        <TabsList className="mb-4"><TabsTrigger value="ongoing">En cours</TabsTrigger><TabsTrigger value="archived">Archivés</TabsTrigger></TabsList>
        <Card><CardContent className="p-0">
            <TabsContent value="ongoing">{ongoingQuotes.length === 0 ? <div className="text-center p-16 text-muted-foreground">Aucune proforma.</div> : renderTable(ongoingQuotes)}</TabsContent>
            <TabsContent value="archived">{Object.keys(archivedQuotesByCustomer).length === 0 ? <div className="text-center p-16 text-muted-foreground">Aucun archivé.</div> : (
                <Accordion type="multiple">{Object.entries(archivedQuotesByCustomer).map(([id, qs]) => (
                    <AccordionItem value={id} key={id}><AccordionTrigger className="px-6 py-4"><span>{qs[0].customerName}</span></AccordionTrigger><AccordionContent>{renderTable(qs, true)}</AccordionContent></AccordionItem>
                ))}</Accordion>
            )}</TabsContent>
        </CardContent></Card>
      </Tabs>
    </div>
  );
}

export default function QuotesPage() {
    return ( <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}><QuotesPageContent /></Suspense> );
}
