
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
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
import { addQuote, getQuotes, deleteQuote, Quote } from '@/actions/quotes';
import { getCustomers, Customer } from '@/actions/customers';
import { Loader2, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { CurrencyContext } from '@/context/currency-context';

const quoteItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().positive("Qty must be > 0."),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative."),
  total: z.number(),
});

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
  status: z.enum(["draft", "sent", "accepted", "rejected"]),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
});

export default function QuotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddQuoteOpen, setAddQuoteOpen] = useState(false);

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
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      subTotal: 0,
      transportCost: 0,
      commissionRate: 0,
      totalAmount: 0,
      status: "draft",
      shippingAddress: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
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
        const [fetchedQuotes, fetchedCustomers] = await Promise.all([getQuotes(), getCustomers()]);
        setQuotes(fetchedQuotes);
        setCustomers(fetchedCustomers);
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        form.setValue("customerId", customer.id);
        form.setValue("customerName", customer.name);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = await addQuote(values);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newQuotes = await getQuotes();
      setQuotes(newQuotes);
      setAddQuoteOpen(false);
      form.reset({
        quoteNumber: `PI-${Date.now().toString().slice(-6)}`,
        issueDate: new Date(),
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        subTotal: 0,
        transportCost: 0,
        commissionRate: 0,
        totalAmount: 0,
        status: "draft",
        shippingAddress: "",
        notes: "",
      });
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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proforma Invoices</h1>
        <Dialog open={isAddQuoteOpen} onOpenChange={setAddQuoteOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Create Proforma Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>Create a New Proforma Invoice</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                    <FormItem><FormLabel>Proforma #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customerId" render={({ field }) => (
                      <FormItem className="lg:col-span-3">
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={handleCustomerChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                          <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.company}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="validUntil" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Valid Until</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
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
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field: f }) => (
                                <FormItem className="flex-grow"><FormControl><Input placeholder="Item description" {...f} /></FormControl><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (
                                <FormItem className="w-20"><FormControl><Input type="number" placeholder="Qty" {...f} /></FormControl><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: f }) => (
                                <FormItem className="w-28"><FormControl><Input type="number" step="0.01" placeholder={`Unit Price (${currency.code})`} {...f} /></FormControl><FormMessage/></FormItem>
                            )}/>
                            <div className="w-28 pt-2 text-right">{currency.symbol}{(watchItems[index].quantity * watchItems[index].unitPrice).toFixed(2)}</div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Add Item
                    </Button>
                    <Separator className="my-4" />
                    <div className="flex justify-end">
                      <div className="w-1/2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Subtotal</span>
                          <span>{currency.symbol}{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                           <FormField control={form.control} name="transportCost" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 w-full"><FormLabel className="whitespace-nowrap">Transport Cost</FormLabel><FormControl><Input type="number" step="0.01" className="text-right" {...field} /></FormControl></FormItem>
                           )}/>
                        </div>
                         <div className="flex justify-between items-center gap-2">
                           <FormField control={form.control} name="commissionRate" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 w-full"><FormLabel className="whitespace-nowrap">Commission (%)</FormLabel><FormControl><Input type="number" step="0.01" className="text-right" {...field} /></FormControl></FormItem>
                           )}/>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground text-sm">
                          <span>Commission Amount</span>
                          <span>{currency.symbol}{commissionAmount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total</span>
                          <span>{currency.symbol}{totalAmount.toFixed(2)}</span>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Proforma</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
          ) : quotes.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <p>No proforma invoices yet.</p>
              <p className="text-sm mt-2">Click "Create Proforma Invoice" to get started.</p>
            </div>
          ) : (
            <Table>
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
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>{format(new Date(quote.issueDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge></TableCell>
                    <TableCell className="text-right">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
