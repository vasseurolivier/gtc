

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { addCustomer, getCustomers, deleteCustomer, Customer, CustomerFormValues } from '@/actions/customers';
import { Loader2, PlusCircle, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import Link from 'next/link';

const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(["lead", "active", "inactive", "prospect"]).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { 
        name: "", 
        email: "", 
        phone: "",
        company: "",
        country: "",
        status: "lead",
        source: "",
        notes: "",
    },
  });

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchCustomers() {
      setIsLoading(true);
      try {
        const fetchedCustomers = await getCustomers();
        setCustomers(fetchedCustomers);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch customers.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomers();
  }, [router, toast]);

  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
    const result = await addCustomer(values);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newCustomers = await getCustomers();
      setCustomers(newCustomers);
      setAddCustomerOpen(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteCustomer = async (id: string) => {
    const result = await deleteCustomer(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        setCustomers(customers.filter(c => c.id !== id));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleExport = () => {
    const dataToExport = customers.map(customer => ({
      'Name': customer.name,
      'Email': customer.email,
      'Phone': customer.phone,
      'Company': customer.company,
      'Country': customer.country,
      'Status': customer.status,
      'Source': customer.source,
      'Date Added': customer.createdAt ? format(new Date(customer.createdAt), 'dd MMM yyyy') : 'N/A',
      'Notes': customer.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

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
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={customers.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Dialog open={isAddCustomerOpen} onOpenChange={setAddCustomerOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add a New Customer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl><Input placeholder="+1 555-123-4567" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="company" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl><Input placeholder="Acme Inc." {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl><Input placeholder="United States" {...field} /></FormControl>
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
                                      <SelectItem value="lead">Lead</SelectItem>
                                      <SelectItem value="prospect">Prospect</SelectItem>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>

                  <FormField control={form.control} name="source" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl><Input placeholder="e.g., Website, Trade Show, Referral" {...field} /></FormControl>
                      <FormDescription>How did you get this customer?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                              <Textarea
                              placeholder="Any relevant notes about this customer..."
                              className="resize-y"
                              rows={4}
                              {...field}
                              />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />

                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add Customer
                      </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
          ) : customers.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <p>No customers yet.</p>
              <p className="text-sm mt-2">Click "Add Customer" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                        <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                            {customer.name}
                        </Link>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.company || 'N/A'}</TableCell>
                    <TableCell>{customer.createdAt ? format(new Date(customer.createdAt), 'dd MMM yyyy') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
                                    This action cannot be undone. This will permanently delete the customer.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
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
