
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addInvoice, getInvoices, deleteInvoice, updateInvoiceStatus, Invoice } from '@/actions/invoices';
import { getOrders, Order } from '@/actions/orders';
import { Loader2, PlusCircle, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CurrencyContext } from '@/context/currency-context';

const formSchema = z.object({
  orderId: z.string().min(1, "Please select an order."),
});

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddInvoiceOpen, setAddInvoiceOpen] = useState(false);
  
  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderId: "",
    },
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
        const [fetchedInvoices, fetchedOrders] = await Promise.all([
            getInvoices(),
            getOrders(),
        ]);
        setInvoices(fetchedInvoices);
        setOrders(fetchedOrders);
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const selectedOrder = orders.find(o => o.id === values.orderId);
    if (!selectedOrder) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected order not found.' });
        setIsSubmitting(false);
        return;
    }

    const result = await addInvoice(selectedOrder);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newInvoices = await getInvoices();
      setInvoices(newInvoices);
      setAddInvoiceOpen(false);
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

  const getStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
        case 'paid': return 'default';
        case 'unpaid': return 'secondary';
        case 'overdue': return 'destructive';
        case 'cancelled': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Dialog open={isAddInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Create Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice from Order</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                 <FormField control={form.control} name="orderId" render={({ field }) => (
                      <FormItem>
                      <FormLabel>Order to Invoice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger>
                            <SelectValue placeholder="Select an order" />
                          </SelectTrigger></FormControl>
                          <SelectContent>
                            {orders.length > 0 ? orders.map(o => <SelectItem key={o.id} value={o.id}>
                                {o.orderNumber} - {o.customerName} - ¥{o.totalAmount.toFixed(2)}
                            </SelectItem>) : <p className="p-4 text-sm text-muted-foreground">No orders found.</p>}
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
      </div>
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
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{format(new Date(invoice.issueDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value: Invoice['status']) => handleStatusChange(invoice.id, value)} defaultValue={invoice.status}>
                        <SelectTrigger className="w-32">
                           <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">¥{invoice.totalAmount.toFixed(2)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
