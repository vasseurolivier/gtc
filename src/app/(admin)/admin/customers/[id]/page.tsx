
import { getCustomerById, Customer } from '@/actions/customers';
import { User, Mail, Phone, Building, Globe, StickyNote, MapPin, TrendingUp, Banknote, Scale, Receipt, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function getCustomerData(id: string) {
    try {
        const customer = await getCustomerById(id);
        return customer;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
    const customer = await getCustomerData(params.id);

    if (!customer) {
        return (
            <div className="container mx-auto py-8">
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
    
    const getStatusBadgeVariant = (status: any) => {
        switch (status) {
            case 'paid':
            case 'delivered': return 'default';
            case 'sent':
            case 'shipped': return 'secondary';
            case 'processing':
            case 'partially_paid':
            case 'draft': return 'outline';
            case 'cancelled':
            case 'rejected':
            case 'overdue': return 'destructive';
            default: return 'outline';
        }
    };
    
    const financials = customer.financials;

    return (
        <div className="container py-8">
             <div className="flex justify-between items-center mb-8">
                 <Button variant="ghost" asChild>
                    <Link href="/admin/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Link>
                </Button>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> {customer.name}</CardTitle>
                             <CardDescription>
                                Customer since {formatInTimeZone(new Date(customer.createdAt), 'UTC', 'MMMM yyyy')}
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {customer.email || 'N/A'}</div>
                            {customer.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {customer.phone}</div>}
                            {customer.company && <div className="flex items-center gap-2 text-muted-foreground"><Building className="h-4 w-4" /> {customer.company}</div>}
                            {customer.country && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> {customer.country}</div>}
                            {customer.address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{customer.address}</p></div>}
                            {customer.notes && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><StickyNote className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{customer.notes}</p></div>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">¥{(financials?.totalRevenue || 0).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Based on paid invoices
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${financials && financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{(financials?.netProfit || 0).toFixed(2)}
                            </div>
                             <p className="text-xs text-muted-foreground">
                                All-time net profit from this customer
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gross Profit Margin</CardTitle>
                            <Scale className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(financials?.grossProfitMargin || 0).toFixed(2)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                (Revenue - COGS) / Revenue
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice History</CardTitle>
                            <CardDescription>All invoices associated with this customer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {customer.invoices && customer.invoices.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customer.invoices.map(invoice => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">
                                                    <Button variant="link" asChild className="p-0 h-auto">
                                                        <Link href={`/admin/invoices/${invoice.id}`} target="_blank">{invoice.invoiceNumber}</Link>
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{formatInTimeZone(new Date(invoice.issueDate), 'UTC', 'dd MMM yyyy')}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge></TableCell>
                                                <TableCell className="text-right">¥{invoice.totalAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    No invoices found for this customer.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History</CardTitle>
                            <CardDescription>All orders placed by this customer.</CardDescription>
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
                                                <TableCell>{formatInTimeZone(new Date(order.orderDate), 'UTC', 'dd MMM yyyy')}</TableCell>
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
