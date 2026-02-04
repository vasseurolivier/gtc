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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addQuote, getQuotes, deleteQuote, updateQuoteStatus, updateQuote, Quote } from '@/actions/quotes';
import { getCustomers, Customer } from '@/actions/customers';
import { getProducts, Product, addProduct } from '@/actions/products';
import { getPackingListById } from '@/actions/packing-lists';
import { getOrderById } from '@/actions/orders';
import { Loader2, PlusCircle, Trash2, CalendarIcon, Copy, Eye, Pencil, UploadCloud, Save, Link as LinkIcon, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { CurrencyContext } from '@/context/currency-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from '@/components/ui/switch';

const quoteItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().positive("Qty must be > 0."),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative."),
  purchasePrice: z.coerce.number().nonnegative("Cost price cannot be negative.").optional().default(0),
  total: z.number(),
  photo: z.string().optional(),
});

const quoteStatusSchema = z.enum(["draft", "sent", "accepted", "rejected"]);

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

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
      items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "" }],
      subTotal: 0,
      transportCost: 0,
      commissionRate: 0,
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
  const watchTransportCost = form.watch("transportCost");
  const watchCommissionRate = form.watch("commissionRate");
  const watchDepositRequired = form.watch("depositRequired");
  
  const [isSavingProduct, setIsSavingProduct] = useState<number | null>(null);
  
  const handleSaveAsProduct = async (index: number) => {
    const item = form.getValues(`items.${index}`);
    if (!item.description) return;
    
    setIsSavingProduct(index);
    try {
        const result = await addProduct({
            name: item.description,
            sku: item.sku || `SKU-${Date.now().toString().slice(-8)}`,
            price: item.unitPrice,
            purchasePrice: item.purchasePrice || 0,
            imageUrl: item.photo || '',
            stock: 0,
        });

        if (result.success) {
            toast({ title: 'Produit Sauvegardé', description: `${item.description} a été ajouté au catalogue global.` });
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);
        }
    } finally {
        setIsSavingProduct(null);
    }
  };

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
        if (name && (name.startsWith('items') || name === 'transportCost' || name === 'commissionRate')) {
            const items = values.items || [];
            items.forEach((item, index) => {
                if (!item) return;
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const newTotal = quantity * unitPrice;
                if (item.total !== newTotal) {
                     form.setValue(`items.${index}.total`, newTotal, { shouldValidate: true });
                }
            });

            const subTotal = items.reduce((sum, item) => sum + (item?.total || 0), 0);
            const transportCost = Number(values.transportCost) || 0;
            const commissionRate = Number(values.commissionRate) || 0;
            const commissionAmount = subTotal * (commissionRate / 100);
            const totalAmount = subTotal + transportCost + commissionAmount;
            
            form.setValue("subTotal", subTotal, { shouldValidate: true });
            form.setValue("totalAmount", totalAmount, { shouldValidate: true });
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
    
    const packingListId = searchParams.get('fromPackingList');
    const orderId = searchParams.get('fromOrder');

    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedQuotes, fetchedCustomers, fetchedProducts] = await Promise.all([
          getQuotes(), 
          getCustomers(),
          getProducts()
        ]);
        setQuotes(fetchedQuotes);
        setCustomers(fetchedCustomers);
        setProducts(fetchedProducts);

        if (packingListId) {
            const packingList = await getPackingListById(packingListId);
            if (packingList) {
                const newItems = packingList.items.map(item => ({
                    sku: item.sku || "",
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPriceCny,
                    purchasePrice: item.unitPriceCny,
                    total: item.quantity * item.unitPriceCny,
                    photo: item.photo || "",
                }));
                form.reset({
                    quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
                    issueDate: new Date(),
                    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
                    items: newItems,
                    status: "draft",
                    depositRequired: true,
                    depositPercentage: 30,
                });
                setIsDialogOpen(true);
                router.replace('/admin/quotes');
            }
        }

        if (orderId) {
          const order = await getOrderById(orderId);
          if (order) {
            const newItems = order.items.map(item => ({
              sku: item.sku || "",
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              purchasePrice: item.purchasePrice || 0,
              total: item.total,
              photo: (item as any).photo || "",
            }));
            form.reset({
              quoteNumber: `PI-${order.orderNumber.replace('ORD-', '')}`,
              customerId: order.customerId,
              customerName: order.customerName,
              orderId: order.id,
              issueDate: new Date(),
              validUntil: new Date(new Date().setDate(new Date().getDate() + 15)),
              items: newItems,
              subTotal: order.totalAmount,
              transportCost: order.transportCost || 0,
              commissionRate: order.commissionRate || 0,
              totalAmount: order.totalAmount,
              status: "draft",
              shippingAddress: order.shippingAddress || "",
              depositRequired: true,
              depositPercentage: 30,
            });
            setIsDialogOpen(true);
            router.replace('/admin/quotes');
          }
        }
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
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
            items: quote.items.map(item => ({...item, photo: ''})),
            depositRequired: quote.depositRequired !== false,
            depositPercentage: quote.depositPercentage || 30,
        });
    } else {
        form.reset({
            quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
            issueDate: new Date(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "" }],
            subTotal: 0,
            transportCost: 0,
            commissionRate: 0,
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
  
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        form.setValue("customerId", customer.id);
        form.setValue("customerName", customer.name);
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
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = editingQuote
      ? await updateQuote(editingQuote.id, values)
      : await addQuote(values);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newQuotes = await getQuotes();
      setQuotes(newQuotes);
      setIsDialogOpen(false);
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteQuote = async (id: string) => {
    const result = await deleteQuote(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
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
    } else {
        toast({ title: 'Success', description: 'Proforma status updated.' });
        router.refresh();
    }
  };
  
  const handleDuplicateQuote = (quoteToDuplicate: Quote) => {
    form.reset({
      ...quoteToDuplicate,
      issueDate: new Date(),
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
      quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
      status: "draft",
      items: quoteToDuplicate.items.map(item => ({...item, photo: ''}))
    });
    setEditingQuote(null);
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: "draft" | "sent" | "accepted" | "rejected") => {
    switch (status) {
        case 'accepted': return 'default';
        case 'sent': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  }

  const subTotalValue = form.getValues('subTotal') || 0;
  const commissionAmount = subTotalValue * ((form.getValues('commissionRate') || 0) / 100);
  const totalAmountValue = form.getValues('totalAmount') || 0;

  const ongoingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const archivedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'rejected');
  
  const archivedQuotesByCustomer = archivedQuotes.reduce((acc, quote) => {
    const customerId = quote.customerId;
    if (!acc[customerId]) acc[customerId] = [];
    acc[customerId].push(quote);
    return acc;
  }, {} as Record<string, Quote[]>);

  const renderTable = (quoteList: Quote[], isArchived = false) => (
    <Table>
      {!isArchived && (
        <TableHeader>
          <TableRow>
            <TableHead>Proforma #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {quoteList.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {quote.quoteNumber}
                {quote.orderId && <LinkIcon className="h-3 w-3 text-primary" title="Lié à une commande client" />}
              </div>
            </TableCell>
            <TableCell>{quote.customerName}</TableCell>
            <TableCell>{format(new Date(quote.issueDate), 'dd MMM yyyy')}</TableCell>
            <TableCell>
              <Select onValueChange={(value: Quote['status']) => handleStatusChange(quote, value)} defaultValue={quote.status}>
                <SelectTrigger className="w-32">
                   <Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right">
                <div>¥{quote.totalAmount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</div>
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild title="Voir PDF">
                    <Link href={`/admin/quotes/${quote.id}`}>
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(quote)} title="Modifier">
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDuplicateQuote(quote)} title="Dupliquer">
                    <Copy className="h-4 w-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>
                            Cette action supprimera définitivement cette Proforma.
                        </AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proforma Invoices</h1>
        <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" />Créer manuellement</Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingQuote ? 'Modifier Proforma' : 'Nouvelle Proforma'}</DialogTitle>
                <DialogDescription>
                    {form.getValues('orderId') ? "Génération à partir d'une commande client." : "Remplissez les détails ci-dessous."}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                    <FormItem><FormLabel>Proforma #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customerId" render={({ field }) => (
                      <FormItem className="lg:col-span-3">
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={handleCustomerChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger></FormControl>
                          <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.company}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date d'émission</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="validUntil" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Valide jusqu'au</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                </div>

                 <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Adresse de livraison</FormLabel>
                        <FormControl><Textarea placeholder="Adresse complète..." {...field} rows={3} /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                
                <Card className="p-4 border-primary/20 bg-primary/5">
                  <CardHeader className="p-2 mb-2"><h4 className="font-bold flex items-center gap-2"><Package className="h-4 w-4"/> Articles</h4></CardHeader>
                  <CardContent className="p-0 space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-md bg-white shadow-sm">
                          <div className="flex justify-end">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                          <div className="space-y-4">
                                <Select onValueChange={(value) => handleProductSelect(value, index)}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Lier un produit du catalogue global" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => (
                                    <FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Textarea placeholder="Spécifications..." {...f} rows={2} /></FormControl><FormMessage/></FormItem>
                                )} />
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (<FormItem><FormLabel className="text-xs">Qté</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem>)}/>
                                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => (<FormItem><FormLabel className="text-xs">Prix Unit. (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl></FormItem>)}/>
                                    <div className="text-right space-y-1">
                                        <span className="text-[10px] text-zinc-400 uppercase font-bold">Total</span>
                                        <div className="font-black text-sm">¥{watchItems[index]?.total.toFixed(2) || '0.00'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="w-12 h-12 rounded border bg-zinc-50 flex items-center justify-center overflow-hidden">
                                        {watchItems[index]?.photo ? <img src={watchItems[index].photo} className="object-contain" /> : <UploadCloud className="h-4 w-4 text-zinc-300" />}
                                    </div>
                                    <FormField control={form.control} name={`items.${index}.photo`} render={({ field: photoField }) => (
                                        <FormItem className="flex-grow"><FormControl><Input placeholder="URL photo..." {...photoField} className="h-8 text-xs" /></FormControl></FormItem>
                                    )}/>
                                    {watchItems[index]?.description && !products.some(p => p.sku === watchItems[index].sku) && (
                                        <Button type="button" variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleSaveAsProduct(index)} disabled={isSavingProduct === index}>
                                            <Save className="h-3 w-3 mr-1" /> SAUVER AU CATALOGUE
                                        </Button>
                                    )}
                                </div>
                          </div>
                        </div>
                      ))}
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ sku: "", description: "", quantity: 1, unitPrice: 0, purchasePrice: 0, total: 0, photo: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Ajouter une ligne
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t pt-6">
                    <div className="space-y-4">
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>Notes internes / Conditions</FormLabel><FormControl><Textarea placeholder="Détails bancaires, délais..." {...field} rows={4} /></FormControl></FormItem>
                        )} />
                        <Card className="p-4 bg-zinc-50 border-none">
                            <FormField control={form.control} name="depositRequired" render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <FormLabel className="m-0">Acompte requis ?</FormLabel>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                                </FormItem>
                            )}/>
                            {watchDepositRequired && (
                                <FormField control={form.control} name="depositPercentage" render={({ field }) => (
                                    <FormItem className="mt-4"><FormLabel className="text-xs">Pourcentage d'acompte (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )}/>
                            )}
                        </Card>
                    </div>
                    <div className="bg-zinc-950 text-white p-6 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-zinc-400 text-sm">
                            <span>Sous-total</span>
                            <span>¥{subTotalValue.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <span className="text-zinc-400 text-sm">Frais de port (CNY)</span>
                            <FormField control={form.control} name="transportCost" render={({ field }) => (
                                <FormItem><FormControl><Input type="number" step="0.01" className="bg-white/10 border-white/20 text-right h-8" {...field} /></FormControl></FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <span className="text-zinc-400 text-sm">Commission (%)</span>
                            <FormField control={form.control} name="commissionRate" render={({ field }) => (
                                <FormItem><FormControl><Input type="number" step="0.01" className="bg-white/10 border-white/20 text-right h-8" {...field} /></FormControl></FormItem>
                            )}/>
                        </div>
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-primary font-bold">TOTAL FINAL</span>
                            <div className="text-right">
                                <div className="text-2xl font-black">¥{totalAmountValue.toFixed(2)}</div>
                                <div className="text-sm text-zinc-400">{currency.symbol}{(totalAmountValue * exchangeRate).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t mt-6">
                    <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                    <div className="flex gap-2">
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="w-32"><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                        <Button type="submit" disabled={isSubmitting} className="font-bold bg-primary hover:bg-primary/90">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer Proforma
                        </Button>
                    </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      
      <Tabs defaultValue="ongoing">
        <TabsList className="mb-4">
            <TabsTrigger value="ongoing">En cours</TabsTrigger>
            <TabsTrigger value="archived">Archivés</TabsTrigger>
        </TabsList>
        <Card>
            <CardContent className="p-0">
            <TabsContent value="ongoing">
                {ongoingQuotes.length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground"><p>Aucune proforma en cours.</p></div>
                ) : renderTable(ongoingQuotes)}
            </TabsContent>
            <TabsContent value="archived">
                {Object.keys(archivedQuotesByCustomer).length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground"><p>Aucun historique archivé.</p></div>
                ) : (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(archivedQuotesByCustomer).map(([customerId, customerQuotes]) => {
                        const customer = customers.find(c => c.id === customerId);
                        return (
                          <AccordionItem value={customerId} key={customerId}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                              <div className='flex justify-between w-full pr-4 font-bold'>
                                <span>{customer?.name || 'Client inconnu'}</span>
                                <Badge variant="outline">{customerQuotes.length} document(s)</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>{renderTable(customerQuotes, true)}</AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                )}
            </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}


export default function QuotesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <QuotesPageContent />
        </Suspense>
    );
}
