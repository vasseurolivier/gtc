
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
import { getProducts, Product } from '@/actions/products';
import { Loader2, PlusCircle, Trash2, CalendarIcon, Copy, Eye, Pencil } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
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
  total: z.number(),
});

const quoteStatusSchema = z.enum(["draft", "sent", "accepted", "rejected"]);

const formSchema = z.object({
  quoteNumber: z.string().min(1, "Proforma number is required."),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
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
});

export default function QuotesPage() {
  const router = useRouter();
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
      items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, total: 0 }],
      subTotal: 0,
      transportCost: 0,
      commissionRate: 0,
      totalAmount: 0,
      status: "draft",
      shippingAddress: "",
      notes: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchItems = form.watch("items");
  const watchTransportCost = form.watch("transportCost");
  const watchCommissionRate = form.watch("commissionRate");

  useEffect(() => {
    const subTotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    form.setValue("subTotal", subTotal);

    const transportCost = Number(watchTransportCost) || 0;
    const commissionRate = Number(watchCommissionRate) || 0;
    const commissionAmount = (subTotal + transportCost) * (commissionRate / 100);
    const totalAmount = subTotal + transportCost + commissionAmount;
    form.setValue("totalAmount", totalAmount);

  }, [watchItems, watchTransportCost, watchCommissionRate, form]);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }
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
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const handleOpenDialog = (quote: Quote | null = null) => {
    setEditingQuote(quote);
    if (quote) {
        form.reset({
            ...quote,
            issueDate: new Date(quote.issueDate),
            validUntil: new Date(quote.validUntil),
        });
    } else {
        form.reset({
            quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
            issueDate: new Date(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, total: 0 }],
            subTotal: 0,
            transportCost: 0,
            commissionRate: 0,
            totalAmount: 0,
            status: "draft",
            shippingAddress: "",
            notes: "",
            customerId: undefined,
            customerName: undefined,
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
        update(index, {
            ...fields[index],
            sku: product.sku,
            description: product.name,
            unitPrice: product.price
        });
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
      router.refresh(); // Refresh server components
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
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
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
        router.refresh(); // Refresh server components to reflect changes in orders/invoices
    }
  }
  
  const handleDuplicateQuote = (quoteToDuplicate: Quote) => {
    form.reset({
      ...quoteToDuplicate,
      issueDate: new Date(),
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
      quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
      status: "draft",
    });
    setEditingQuote(null); // Ensure it's a new quote
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

  const subTotal = form.getValues('subTotal');
  const transportCost = form.getValues('transportCost') || 0;
  const commissionRate = form.getValues('commissionRate') || 0;
  const commissionAmount = (subTotal + transportCost) * (commissionRate / 100);
  const totalAmount = form.getValues('totalAmount');

  const ongoingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const archivedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'rejected');
  
  const archivedQuotesByCustomer = archivedQuotes.reduce((acc, quote) => {
    const customerId = quote.customerId;
    if (!acc[customerId]) {
      acc[customerId] = [];
    }
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
            <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
            <TableCell>{quote.customerName}</TableCell>
            <TableCell>{formatInTimeZone(new Date(quote.issueDate), 'UTC', 'dd MMM yyyy')}</TableCell>
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
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/quotes/${quote.id}`}>
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(quote)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDuplicateQuote(quote)}>
                    <Copy className="h-4 w-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this document.
                        </AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)}>Delete</AlertDialogAction>
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
        <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" />Create Proforma Invoice</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{editingQuote ? 'Edit Proforma Invoice' : 'Create a New Proforma Invoice'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                    <FormItem><FormLabel>Proforma #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customerId" render={({ field }) => (
                      <FormItem className="lg:col-span-3">
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={handleCustomerChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                          <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.company}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? formatInTimeZone(field.value, 'UTC', "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="validUntil" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Valid Until</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? formatInTimeZone(field.value, 'UTC', "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                </div>

                 <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Shipping Address</FormLabel>
                        <FormControl><Textarea placeholder="Enter the full shipping address..." {...field} rows={3} /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                
                <Card className="p-4">
                  <CardHeader className="p-2 mb-2"><h4 className="font-semibold">Items</h4></CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2">
                          <div className="flex-grow">
                             <Select onValueChange={(value) => handleProductSelect(value, index)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product or type manually" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => (
                                <FormItem className="mt-2"><FormControl><Input placeholder="Item description" {...f} /></FormControl><FormMessage/></FormItem>
                            )}/>
                          </div>
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (
                                <FormItem className="w-20"><FormLabel>Qty</FormLabel><FormControl><Input type="number" placeholder="Qty" {...f} /></FormControl><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => (
                                <FormItem className="w-28"><FormLabel>Unit Price (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...f} /></FormControl><FormMessage/></FormItem>
                            )}/>
                            <div className="w-28 pt-8 text-right font-medium">¥{(watchItems[index].quantity * watchItems[index].unitPrice).toFixed(2)}</div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-6"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ sku: "", description: "", quantity: 1, unitPrice: 0, total: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Add Item
                    </Button>
                    <Separator className="my-4" />
                    <div className="flex justify-end">
                      <div className="w-1/2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Subtotal</span>
                          <span>¥{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                           <FormField control={form.control} name="transportCost" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 w-full"><FormLabel className="whitespace-nowrap">Transport Cost (CNY)</FormLabel><FormControl><Input type="number" step="0.01" className="text-right" {...field} /></FormControl></FormItem>
                           )}/>
                        </div>
                         <div className="flex justify-between items-center gap-2">
                           <FormField control={form.control} name="commissionRate" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 w-full"><FormLabel className="whitespace-nowrap">Commission (%)</FormLabel><FormControl><Input type="number" step="0.01" className="text-right" {...field} /></FormControl></FormItem>
                           )}/>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground text-sm">
                          <span>Commission Amount</span>
                          <span>¥{commissionAmount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total (CNY)</span>
                          <span>¥{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-semibold text-primary">
                          <span>Total ({currency.code})</span>
                          <span>{currency.symbol}{(totalAmount * exchangeRate).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                 <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Additional Information / Notes</FormLabel>
                        <FormControl><Textarea placeholder="Any specific instructions, terms, or notes..." {...field} rows={3} /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingQuote ? 'Save Changes' : 'Create Proforma'}</Button>
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
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                ) : ongoingQuotes.length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground">
                        <p>Aucune proforma en cours.</p>
                    </div>
                ) : (
                    renderTable(ongoingQuotes)
                )}
            </TabsContent>
            <TabsContent value="archived">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                ) : Object.keys(archivedQuotesByCustomer).length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground">
                        <p>Aucune proforma archivée.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(archivedQuotesByCustomer).map(([customerId, customerQuotes]) => {
                        const customer = customers.find(c => c.id === customerId);
                        return (
                          <AccordionItem value={customerId} key={customerId}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                              <div className='flex justify-between w-full pr-4'>
                                <span>{customer?.name || 'Unknown Customer'}</span>
                                <span className='text-muted-foreground'>{customerQuotes.length} document(s)</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderTable(customerQuotes, true)}
                            </AccordionContent>
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

    