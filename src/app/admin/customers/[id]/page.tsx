'use client';

import { useEffect, useState } from 'react';
import { getCustomerById, Customer } from '@/actions/customers';
import { Loader2, ArrowLeft, User, Mail, Phone, Building, Globe, StickyNote, Euro, ShoppingCart, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function CustomerProfilePage({
  params,
}: {
  params: { id: string };
}) {
    const { id } = params;
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchCustomer() {
            try {
                const fetchedCustomer = await getCustomerById(id);
                setCustomer(fetchedCustomer);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch customer details.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchCustomer();
    }, [id, toast]);

    const getStatusBadgeVariant = (status: any) => {
        switch (status) {
            case 'delivered': return 'default';
            case 'shipped': return 'secondary';
            case 'processing': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const handleExport = () => {
        if (!customer) return;

        // Customer Info Sheet
        const customerInfoData = [
            { 'Field': 'Name', 'Value': customer.name },
            { 'Field': 'Email', 'Value': customer.email },
            { 'Field': 'Phone', 'Value': customer.phone || 'N/A' },
            { 'Field': 'Company', 'Value': customer.company || 'N/A' },
            { 'Field': 'Country', 'Value': customer.country || 'N/A' },
            { 'Field': 'Status', 'Value': customer.status || 'N/A' },
            { 'Field': 'Source', 'Value': customer.source || 'N/A' },
            { 'Field': 'Customer Since', 'Value': customer.createdAt ? format(new Date(customer.createdAt), 'dd MMM yyyy') : 'N/A' },
            { 'Field': 'Total Revenue (CNY)', 'Value': (customer.totalRevenue || 0).toFixed(2) },
            { 'Field': 'Total Orders', 'Value': customer.orders?.length || 0 },
            { 'Field': 'Notes', 'Value': customer.notes || 'N/A' },
        ];
        const customerInfoWs = XLSX.utils.json_to_sheet(customerInfoData, { skipHeader: true });
        customerInfoWs['!cols'] = [{ wch: 20 }, { wch: 50 }];


        // Order History Sheet
        const orderHistoryData = (customer.orders || []).map(order => ({
            'Order #': order.orderNumber,
            'Date': format(new Date(order.orderDate), 'dd MMM yyyy'),
            'Status': order.status,
            'Total (CNY)': order.totalAmount.toFixed(2)
        }));
        const orderHistoryWs = XLSX.utils.json_to_sheet(orderHistoryData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, customerInfoWs, "Customer Info");
        XLSX.utils.book_append_sheet(wb, orderHistoryWs, "Order History");

        XLSX.writeFile(wb, `${customer.name}_profile.xlsx`);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Customers
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Customer not found.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Link>
                </Button>
                <Button onClick={handleExport} variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export to Excel
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
                            <div className="text-2xl font-bold">¥{(customer.totalRevenue || 0).toFixed(2)}</div>
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
                                            <TableHead className="text-right">Total (CNY)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customer.orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                                <TableCell>{format(new Date(order.orderDate), 'dd MMM yyyy')}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                                                <TableCell className="text-right">¥{order.totalAmount.toFixed(2)}</TableCell>
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