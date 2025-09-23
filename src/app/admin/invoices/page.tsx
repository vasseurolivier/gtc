
'use client';

import { useEffect, useState, useTransition, useContext } from 'react';
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
import { addInvoice, getInvoices, deleteInvoice, updateInvoice, updateInvoiceStatus, updateInvoiceAmountPaid, Invoice } from '@/actions/invoices';
import { getCustomers, Customer } from '@/actions/customers';
import { getProducts, Product } from '@/actions/products';
import { getOrders, Order } from '@/actions/orders';
import { Loader2, PlusCircle, Trash2, Eye, Pencil, CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { CurrencyContext } from '@/context/currency-context';

const invoiceItemSchema = z.object({
  sku: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().positive("Qty must be > 0."),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative."),
  total: z.number(),
});

const invoiceStatusSchema = z.enum(["unpaid", "paid", "overdue", "cancelled", "partially_paid"]);

const formSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  issueDate: z.date({ required_error: "Issue date is required."}),
  dueDate: z.date({ required_error: "Due date is required."}),
  items: z.array(invoiceItemSchema).min(1, "Please add at least one item."),
  totalAmount: z.coerce.number(),
  amountPaid: z.coerce.number().nonnegative("Amount paid cannot be negative.").optional().default(0),
  status: invoiceStatusSchema,
});


export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, total: 0 }],
      totalAmount: 0,
      amountPaid: 0,
      status: "unpaid",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchItems = form.watch("items");

  useEffect(() => {
    const subTotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    form.setValue("totalAmount", subTotal);
  }, [watchItems, form]);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }
    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedInvoices, fetchedOrders, fetchedCustomers, fetchedProducts] = await Promise.all([
            getInvoices(),
            getOrders(),
            getCustomers(),
            getProducts(),
        ]);
        setInvoices(fetchedInvoices);
        setOrders(fetchedOrders);
        setCustomers(fetchedCustomers);
        setProducts(fetchedProducts);
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const handleOpenDialog = (invoice: Invoice | null = null) => {
    setEditingInvoice(invoice);
    if (invoice) {
        form.reset({
            ...invoice,
            issueDate: new Date(invoice.issueDate),
            dueDate: new Date(invoice.dueDate),
            amountPaid: invoice.amountPaid || 0,
        });
    } else {
        form.reset({
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ sku: "", description: "", quantity: 1, unitPrice: 0, total: 0 }],
            totalAmount: 0,
            amountPaid: 0,
            status: "unpaid",
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
    const result = editingInvoice
      ? await updateInvoice(editingInvoice.id, values)
      : await addInvoice(values);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newInvoices = await getInvoices();
      setInvoices(newInvoices);
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteInvoice = async (id: string) => {
    const result = await deleteInvoice(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        setInvoices(invoices.filter(i => i.id !== id));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };
  
  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    const originalInvoices = [...invoices];
    const updatedInvoices = invoices.map(i => i.id === invoiceId ? {...i, status: newStatus} : i);
    setInvoices(updatedInvoices);

    const result = await updateInvoiceStatus(invoiceId, newStatus);
    if (!result.success) {
        setInvoices(originalInvoices);
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    } else {
        toast({ title: 'Success', description: 'Invoice status updated.' });
    }
  }

  const [amountPaidInputs, setAmountPaidInputs] = useState<Record<string, string>>({});
  const [isUpdatingAmount, setIsUpdatingAmount] = useState<string | null>(null);

  const handleAmountPaidChange = (invoiceId: string, value: string) => {
    setAmountPaidInputs(prev => ({ ...prev, [invoiceId]: value }));
  };

  const handleUpdateAmountPaid = async (invoiceId: string) => {
    const amountStr = amountPaidInputs[invoiceId];
    if (amountStr === undefined) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
        toast({ variant: "destructive", title: "Invalid input", description: "Please enter a valid number." });
        return;
    }
    
    setIsUpdatingAmount(invoiceId);
    const result = await updateInvoiceAmountPaid(invoiceId, amount);
    setIsUpdatingAmount(null);

    if (result.success) {
        toast({ title: "Success", description: result.message });
        setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId 
            ? { ...inv, amountPaid: amount, status: result.newStatus! } 
            : inv
        ));
        setAmountPaidInputs(prev => ({...prev, [invoiceId]: ''}));

    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  useEffect(() => {
    const initialAmounts: Record<string, string> = {};
    invoices.forEach(inv => {
        initialAmounts[inv.id] = (inv.amountPaid || 0).toString();
    });
    setAmountPaidInputs(initialAmounts);
  }, [invoices]);


  const getStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
        case 'paid': return 'default';
        case 'unpaid': return 'secondary';
        case 'overdue': return 'destructive';
        case 'cancelled': return 'destructive';
        case 'partially_paid': return 'outline';
        default: return 'outline';
    }
  }

  const totalAmount = form.getValues('totalAmount');

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" />Create Invoice</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create a New Invoice'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                    <FormItem><FormLabel>Invoice #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                </div>
                
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
                      <div className="w-full md:w-1/2 space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>¥{form.getValues('totalAmount').toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>TOTAL (CNY)</span>
                          <span>¥{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg text-primary">
                          <span>TOTAL ({currency.code})</span>
                          <span>{currency.symbol}{(totalAmount * exchangeRate).toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center pt-2">
                           <FormField control={form.control} name="amountPaid" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 w-full"><FormLabel className="whitespace-nowrap">Amount Paid (CNY)</FormLabel><FormControl><Input type="number" step="0.01" className="text-right" {...field} /></FormControl></FormItem>
                           )}/>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
          ) : invoices.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <p>No invoices yet.</p>
              <p className="text-sm mt-2">Click "Create Invoice" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">Remaining Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const remainingBalance = invoice.totalAmount - (invoice.amountPaid || 0);
                  return(
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value: Invoice['status']) => handleStatusChange(invoice.id, value)} defaultValue={invoice.status}>
                        <SelectTrigger className="w-36">
                           <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                        <div>¥{invoice.totalAmount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{currency.symbol}{(invoice.totalAmount * exchangeRate).toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         <Input
                           type="number"
                           step="0.01"
                           className="w-28 h-8 text-right"
                           value={amountPaidInputs[invoice.id] ?? (invoice.amountPaid || 0)}
                           onChange={(e) => handleAmountPaidChange(invoice.id, e.target.value)}
                           onBlur={() => handleUpdateAmountPaid(invoice.id)}
                           disabled={isUpdatingAmount === invoice.id}
                         />
                         {isUpdatingAmount === invoice.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateAmountPaid(invoice.id)}>
                            <Check className="h-4 w-4" />
                           </Button>
                         )}
                       </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                        <div>¥{remainingBalance.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{currency.symbol}{(remainingBalance * exchangeRate).toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/invoices/${invoice.id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(invoice)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this invoice.
                                </AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
