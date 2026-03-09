
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { addSupplier, getSuppliers, deleteSupplier, updateSupplier, Supplier, SupplierFormValues } from '@/actions/suppliers';
import { Loader2, PlusCircle, Trash2, Pencil, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import Link from 'next/link';

const supplierSchema = z.object({
  name: z.string().min(2, { message: "Supplier name must be at least 2 characters." }),
  nickname: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email." }).or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).or(z.literal("")).optional(),
  mainProducts: z.string().optional(),
  notes: z.string().optional(),
});


export default function SuppliersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { 
        name: "",
        nickname: "",
        contactName: "",
        email: "", 
        phone: "",
        address: "",
        website: "",
        mainProducts: "",
        notes: "",
    },
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchSuppliers() {
      setIsLoading(true);
      try {
        const fetchedSuppliers = await getSuppliers();
        setSuppliers(fetchedSuppliers);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch suppliers.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuppliers();
  }, [router, toast]);
  
  const handleOpenDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    if (supplier) {
      form.reset({
        name: supplier.name,
        nickname: supplier.nickname,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        website: supplier.website,
        mainProducts: supplier.mainProducts,
        notes: supplier.notes,
      });
    } else {
      form.reset({
        name: "", 
        nickname: "",
        contactName: "",
        email: "", 
        phone: "",
        address: "",
        website: "",
        mainProducts: "",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    const result = editingSupplier
      ? await updateSupplier(editingSupplier.id, values)
      : await addSupplier(values);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newSuppliers = await getSuppliers();
      setSuppliers(newSuppliers);
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteSupplier = async (id: string) => {
    const result = await deleteSupplier(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        setSuppliers(suppliers.filter(s => s.id !== id));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
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
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add a New Supplier'}</DialogTitle>
                <DialogDescription>
                    Fill in the details below to add or update a supplier record.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Supplier Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Yiwu Awesome Factory" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="nickname" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nickname</FormLabel>
                          <FormControl><Input placeholder="e.g., T-shirt guy" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="contactName" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Mr. Lee" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input placeholder="contact@factory.com" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Phone / WeChat</FormLabel>
                          <FormControl><Input placeholder="+86 138..." {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                      <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl><Input placeholder="https://factory.com" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                          <Textarea
                          placeholder="Factory address..."
                          className="resize-y"
                          rows={3}
                          {...field}
                          />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="mainProducts" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Products</FormLabel>
                      <FormControl><Input placeholder="e.g., Textiles, Mugs, Electronics" {...field} /></FormControl>
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
                          {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                      </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <p>No suppliers yet.</p>
              <p className="text-sm mt-2">Click "Add Supplier" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Main Products</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      {supplier.website ? (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                           {supplier.name} <Globe className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ) : (
                        supplier.name
                      )}
                    </TableCell>
                    <TableCell>{supplier.nickname || 'N/A'}</TableCell>
                    <TableCell>
                        <div className="font-medium">{supplier.contactName}</div>
                        <div className="text-sm text-muted-foreground">{supplier.email}</div>
                    </TableCell>
                    <TableCell>{supplier.mainProducts || 'N/A'}</TableCell>
                    <TableCell>{supplier.createdAt ? format(new Date(supplier.createdAt), 'dd MMM yyyy') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                            <Pencil className="h-4 w-4" />
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
                                    This action cannot be undone. This will permanently delete this supplier.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)}>
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
