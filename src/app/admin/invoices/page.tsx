
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addInvoiceFromOrder, getInvoices, deleteInvoice, updateInvoiceStatus, updateInvoiceAmountPaid, Invoice } from '@/actions/invoices';
import { getCustomers, Customer } from '@/actions/customers';
import { getOrders, Order } from '@/actions/orders';
import { Loader2, PlusCircle, Trash2, Eye, Check } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { CurrencyContext } from '@/context/currency-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const createInvoiceSchema = z.object({
  orderId: z.string().min(1, "Please select an order."),
});


export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  const form = useForm<z.infer<typeof createInvoiceSchema>>({
    resolver: zodResolver(createInvoiceSchema),
  });

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }
    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedInvoices, fetchedOrders, fetchedCustomers] = await Promise.all([
            getInvoices(),
            getOrders(),
            getCustomers(),
        ]);
        setInvoices(fetchedInvoices);
        setOrders(fetchedOrders);
        setCustomers(fetchedCustomers);
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const onSubmit = async (values: z.infer<typeof createInvoiceSchema>) => {
    setIsSubmitting(true);
    const selectedOrder = orders.find(o => o.id === values.orderId);

    if (!selectedOrder) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected order not found.' });
        setIsSubmitting(false);
        return;
    }

    const result = await addInvoiceFromOrder(selectedOrder);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newInvoices = await getInvoices();
      setInvoices(newInvoices);
      setIsDialogOpen(false);
      form.reset();
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
  
  const invoicedOrderIds = new Set(invoices.map(i => i.orderId));
  const ordersWithoutInvoice = orders.filter(o => !invoicedOrderIds.has(o.id));

  const ongoingInvoices = invoices.filter(i => ['unpaid', 'partially_paid', 'overdue'].includes(i.status));
  const archivedInvoices = invoices.filter(i => ['paid', 'cancelled'].includes(i.status));

  const archivedInvoicesByCustomer = archivedInvoices.reduce((acc, invoice) => {
    const customerId = invoice.customerId;
    if (!acc[customerId]) {
      acc[customerId] = [];
    }
    acc[customerId].push(invoice);
    return acc;
  }, {} as Record<string, Invoice[]>);


  const renderTable = (invoiceList: Invoice[], isArchived = false) => (
     <Table>
      {!isArchived && (
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
      )}
      <TableBody>
        {invoiceList.map((invoice) => {
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
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => setIsDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Create Invoice</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice from Order</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                 <FormField control={form.control} name="orderId" render={({ field }) => (
                      <FormItem>
                      <FormLabel>Select an Order to Invoice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger>
                            <SelectValue placeholder="Select an order" />
                          </SelectTrigger></FormControl>
                          <SelectContent>
                            {ordersWithoutInvoice.length > 0 ? ordersWithoutInvoice.map(o => <SelectItem key={o.id} value={o.id}>
                                {o.orderNumber} - {o.customerName} - ¥{o.totalAmount.toFixed(2)}
                            </SelectItem>) : <div className="p-4 text-sm text-muted-foreground">All orders have been invoiced.</div>}
                          </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Invoice</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="ongoing">
            <TabsList className="mb-4">
                <TabsTrigger value="ongoing">En cours</TabsTrigger>
                <TabsTrigger value="archived">Archivées</TabsTrigger>
            </TabsList>
            <Card>
                <CardContent className="p-0">
                    <TabsContent value="ongoing">
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                        ) : ongoingInvoices.length === 0 ? (
                            <div className="text-center p-16 text-muted-foreground"><p>Aucune facture en cours.</p></div>
                        ) : (
                            renderTable(ongoingInvoices)
                        )}
                    </TabsContent>
                    <TabsContent value="archived">
                        {isLoading ? (
                             <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                        ) : Object.keys(archivedInvoicesByCustomer).length === 0 ? (
                            <div className="text-center p-16 text-muted-foreground"><p>Aucune facture archivée.</p></div>
                        ) : (
                            <Accordion type="multiple" className="w-full">
                              {Object.entries(archivedInvoicesByCustomer).map(([customerId, customerInvoices]) => {
                                const customer = customers.find(c => c.id === customerId);
                                return (
                                  <AccordionItem value={customerId} key={customerId}>
                                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                      <div className='flex justify-between w-full pr-4'>
                                        <span>{customer?.name || 'Unknown Customer'}</span>
                                        <span className='text-muted-foreground'>{customerInvoices.length} document(s)</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      {renderTable(customerInvoices, true)}
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
