
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomerById, Customer } from '@/actions/customers';
import { Loader2, ArrowLeft, User, Mail, Phone, Building, Globe, StickyNote, Euro, ShoppingCart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CurrencyContext } from '@/context/currency-context';

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currencyContext = useContext(CurrencyContext);
    if (!currencyContext) {
        throw new Error("CurrencyContext must be used within a CurrencyProvider");
    }
    const { currency, exchangeRate } = currencyContext;

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
            router.push('/admin/login');
            return;
        }

        async function fetchCustomer() {
            setIsLoading(true);
            const fetchedCustomer = await getCustomerById(params.id);
            if (fetchedCustomer) {
                setCustomer(fetchedCustomer);
            } else {
                // Handle customer not found
                router.push('/admin/customers');
            }
            setIsLoading(false);
        }

        fetchCustomer();
    }, [params.id, router]);

    const getStatusBadgeVariant = (status: any) => {
        switch (status) {
            case 'delivered': return 'default';
            case 'shipped': return 'secondary';
            case 'processing': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    }


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (!customer) {
        return <div className="container py-8">Customer not found.</div>;
    }

    return (
        <div className="container py-8">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => router.push('/admin/customers')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> {customer.name}</CardTitle>
                             <CardDescription>
                                Customer since {format(new Date(customer.createdAt), 'MMMM yyyy')}
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {customer.email}</div>
                            {customer.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {customer.phone}</div>}
                            {customer.company && <div className="flex items-center gap-2 text-muted-foreground"><Building className="h-4 w-4" /> {customer.company}</div>}
                            {customer.country && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> {customer.country}</div>}
                            {customer.notes && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><StickyNote className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{customer.notes}</p></div>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <Euro className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currency.symbol}{((customer.totalRevenue || 0) * exchangeRate).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                From {customer.orders?.length || 0} orders
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{customer.orders?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                All-time order count
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.orders && customer.orders.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customer.orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                                <TableCell>{format(new Date(order.orderDate), 'dd MMM yyyy')}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                                                <TableCell className="text-right">{currency.symbol}{(order.totalAmount * exchangeRate).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    This customer has not placed any orders yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
