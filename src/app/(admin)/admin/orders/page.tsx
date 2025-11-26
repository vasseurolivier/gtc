
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addOrder, getOrders, deleteOrder, updateOrderStatus, Order } from '@/actions/orders';
import { getQuotes, Quote } from '@/actions/quotes';
import { getCustomers, Customer } from '@/actions/customers';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { CurrencyContext } from '@/context/currency-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formSchema = z.object({
  quoteId: z.string().min(1, "Please select a proforma invoice."),
});

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOrderOpen, setAddOrderOpen] = useState(false);
  
  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quoteId: "",
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
        const [fetchedOrders, fetchedQuotes, fetchedCustomers] = await Promise.all([
            getOrders(),
            getQuotes(),
            getCustomers()
        ]);
        setOrders(fetchedOrders);
        const acceptedQuotes = fetchedQuotes.filter(q => q.status === 'accepted');
        setQuotes(acceptedQuotes);
        setCustomers(fetchedCustomers);
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const selectedQuote = quotes.find(q => q.id === values.quoteId);
    if (!selectedQuote) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected proforma not found.' });
        setIsSubmitting(false);
        return;
    }

    const result = await addOrder(selectedQuote);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newOrders = await getOrders();
      setOrders(newOrders);
      setAddOrderOpen(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteOrder = async (id: string) => {
    const result = await deleteOrder(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        setOrders(orders.filter(o => o.id !== id));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };
  
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const originalOrders = [...orders];
    const updatedOrders = orders.map(o => o.id === orderId ? {...o, status: newStatus} : o);
    setOrders(updatedOrders);

    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
        setOrders(originalOrders);
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    } else {
        toast({ title: 'Success', description: 'Order status updated.' });
    }
  }

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'shipped': return 'secondary';
        case 'processing': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'outline';
    }
  }

  const ongoingOrders = orders.filter(o => o.status === 'processing' || o.status === 'shipped');
  const archivedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
  
  const archivedOrdersByCustomer = archivedOrders.reduce((acc, order) => {
    const customerId = order.customerId;
    if (!acc[customerId]) {
      acc[customerId] = [];
    }
    acc[customerId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);


  const renderTable = (orderList: Order[], isArchived = false) => (
    <Table>
      {!isArchived && (
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {orderList.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.orderNumber}</TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell>{formatInTimeZone(new Date(order.orderDate), 'UTC', 'dd MMM yyyy')}</TableCell>
            <TableCell>
              <Select onValueChange={(value: Order['status']) => handleStatusChange(order.id, value)} defaultValue={order.status}>
                <SelectTrigger className="w-36">
                  <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right">
                <div>¥{order.totalAmount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{currency.symbol}{(order.totalAmount * exchangeRate).toFixed(2)}</div>
            </TableCell>
            <TableCell className="text-right">
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this order.
                        </AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>Delete</AlertDialogAction>
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
        <h1 className="text-3xl font-bold">Orders</h1>
        <Dialog open={isAddOrderOpen} onOpenChange={setAddOrderOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Create Order</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Order from Proforma Invoice</DialogTitle>
                <DialogDescription>
                    Select an accepted proforma invoice to create a new order.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                 <FormField control={form.control} name="quoteId" render={({ field }) => (
                      <FormItem>
                      <FormLabel>Accepted Proforma Invoice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger>
                            <SelectValue placeholder="Select an accepted proforma" />
                          </SelectTrigger></FormControl>
                          <SelectContent>
                            {quotes.length > 0 ? quotes.map(q => <SelectItem key={q.id} value={q.id}>
                                {q.quoteNumber} - {q.customerName} - ¥{q.totalAmount.toFixed(2)}
                            </SelectItem>) : <p className="p-4 text-sm text-muted-foreground">No accepted proformas found.</p>}
                          </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Order</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
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
                ) : ongoingOrders.length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground">
                        <p>Aucune commande en cours.</p>
                    </div>
                ) : (
                    renderTable(ongoingOrders)
                )}
            </TabsContent>
            <TabsContent value="archived">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                ) : Object.keys(archivedOrdersByCustomer).length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground">
                        <p>Aucune commande archivée.</p>
                    </div>
                ) : (
                   <Accordion type="multiple" className="w-full">
                      {Object.entries(archivedOrdersByCustomer).map(([customerId, customerOrders]) => {
                        const customer = customers.find(c => c.id === customerId);
                        return (
                          <AccordionItem value={customerId} key={customerId}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                              <div className='flex justify-between w-full pr-4'>
                                <span>{customer?.name || 'Unknown Customer'}</span>
                                <span className='text-muted-foreground'>{customerOrders.length} document(s)</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderTable(customerOrders, true)}
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
