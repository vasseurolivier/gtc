'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addQuote, getQuotes, deleteQuote, Quote } from '@/actions/quotes';
import { getCustomers, Customer } from '@/actions/customers';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  customerId: z.string({ required_error: "Please select a customer." }),
  customerName: z.string(),
  items: z.string().min(10, { message: "Please describe the items for the quote." }),
  totalAmount: z.coerce.number().positive({ message: "Total amount must be a positive number." }),
  status: z.enum(["draft", "sent", "accepted", "rejected"]),
});

export default function QuotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddQuoteOpen, setAddQuoteOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: "",
      totalAmount: 0,
      status: "draft",
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
        const [fetchedQuotes, fetchedCustomers] = await Promise.all([
          getQuotes(),
          getCustomers()
        ]);
        setQuotes(fetchedQuotes);
        setCustomers(fetchedCustomers);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally {
        setIsLoading(false);
      }
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
      form.reset({ items: "", totalAmount: 0, status: "draft" });
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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <Dialog open={isAddQuoteOpen} onOpenChange={setAddQuoteOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create a New Quote</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={handleCustomerChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.company}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control} name="totalAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Total Amount (€)</FormLabel>
                        <FormControl><Input type="number" placeholder="1250.00" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control} name="items" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Items</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Describe the items, quantities, and prices for this quote..."
                        className="resize-y"
                        rows={6}
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Quote
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
          ) : quotes.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <p>No quotes yet.</p>
              <p className="text-sm mt-2">Click "Create Quote" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.customerName}</TableCell>
                    <TableCell>{format(new Date(quote.createdAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge></TableCell>
                    <TableCell>€{quote.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this quote.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)}>
                                    Delete
                                </AlertDialogAction>
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
