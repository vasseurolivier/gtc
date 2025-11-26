
'use client';

import { useEffect, useState, useContext } from 'react';
import { getCustomerById, Customer } from '@/actions/customers';
import { User, Mail, Phone, Building, Globe, StickyNote, Euro, ShoppingCart, FileSpreadsheet, ArrowLeft, Loader2, MapPin, TrendingUp, Banknote, Scale, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams } from 'next/navigation';
import { CurrencyContext } from '@/context/currency-context';

export default function CustomerProfilePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currencyContext = useContext(CurrencyContext);
    if (!currencyContext) {
        throw new Error("CurrencyContext must be used within a CurrencyProvider");
    }
    const { currency, exchangeRate } = currencyContext;

    useEffect(() => {
        if (id) {
            getCustomerById(id)
                .then(data => {
                    setCustomer(data);
                })
                .catch(err => {
                    console.error("Failed to fetch customer", err);
                    setCustomer(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [id]);

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

    const handleExport = () => {
        if (!customer || !customer.financials) return;

        const financials = customer.financials;

        const customerInfoData = [
            { 'Field': 'Name', 'Value': customer.name },
            { 'Field': 'Email', 'Value': customer.email },
            { 'Field': 'Phone', 'Value': customer.phone || 'N/A' },
            { 'Field': 'Company', 'Value': customer.company || 'N/A' },
            { 'Field': 'Address', 'Value': customer.address || 'N/A' },
            { 'Field': 'Country', 'Value': customer.country || 'N/A' },
            { 'Field': 'Status', 'Value': customer.status || 'N/A' },
            { 'Field': 'Source', 'Value': customer.source || 'N/A' },
            { 'Field': 'Customer Since', 'Value': customer.createdAt ? formatInTimeZone(new Date(customer.createdAt), 'UTC', 'dd MMM yyyy') : 'N/A' },
            { 'Field': 'Notes', 'Value': customer.notes || 'N/A' },
        ];
        const customerInfoWs = XLSX.utils.json_to_sheet(customerInfoData, { skipHeader: true });
        customerInfoWs['!cols'] = [{ wch: 20 }, { wch: 50 }];

        const financialSummaryData = [
            { 'Metric': 'Total Revenue (CNY)', 'Value': financials.totalRevenue.toFixed(2) },
            { 'Metric': 'Cost of Goods Sold (CNY)', 'Value': financials.cogs.toFixed(2) },
            { 'Metric': 'Gross Profit (CNY)', 'Value': financials.grossProfit.toFixed(2) },
            { 'Metric': 'Gross Profit Margin (%)', 'Value': financials.grossProfitMargin.toFixed(2) },
            { 'Metric': 'Operating Expenses (CNY)', 'Value': financials.operatingExpenses.toFixed(2) },
            { 'Metric': 'Net Profit (CNY)', 'Value': financials.netProfit.toFixed(2) },
        ];
        const financialWs = XLSX.utils.json_to_sheet(financialSummaryData);

        const orderHistoryData = (customer.orders || []).map(order => ({
            'Order #': order.orderNumber,
            'Date': formatInTimeZone(new Date(order.orderDate), 'UTC', 'dd MMM yyyy'),
            'Status': order.status,
            'Total (CNY)': order.totalAmount.toFixed(2)
        }));
        const orderHistoryWs = XLSX.utils.json_to_sheet(orderHistoryData);

        const invoiceHistoryData = (customer.invoices || []).map(invoice => ({
            'Invoice #': invoice.invoiceNumber,
            'Date': formatInTimeZone(new Date(invoice.issueDate), 'UTC', 'dd MMM yyyy'),
            'Status': invoice.status,
            'Total (CNY)': invoice.totalAmount.toFixed(2)
        }));
        const invoiceHistoryWs = XLSX.utils.json_to_sheet(invoiceHistoryData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, customerInfoWs, "Customer Info");
        XLSX.utils.book_append_sheet(wb, financialWs, "Financial Summary");
        XLSX.utils.book_append_sheet(wb, orderHistoryWs, "Order History");
        XLSX.utils.book_append_sheet(wb, invoiceHistoryWs, "Invoice History");

        XLSX.writeFile(wb, `${customer.name}_profile.xlsx`);
    };
    
    const formatCurrency = (amount: number) => {
        return (
            <div className="text-right">
                <div className="font-semibold">¥{amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{currency.symbol}{(amount * exchangeRate).toFixed(2)}</div>
            </div>
        );
    };

    if (isLoading) {
        return (
             <div className="container py-8">
                <div className="flex h-screen items-center justify-center">
                   <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
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
                    {financials && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Summary</CardTitle>
                                <CardDescription>All-time financial data for this customer based on paid invoices.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Revenue</span>{formatCurrency(financials.totalRevenue)}</div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>{formatCurrency(financials.cogs)}</div>
                                    <Separator/>
                                    <div className="flex justify-between items-center font-semibold"><span className="text-muted-foreground">Gross Profit</span>{formatCurrency(financials.grossProfit)}</div>
                                    <Separator/>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Operating Expenses (commission, transport)</span>{formatCurrency(financials.operatingExpenses)}</div>
                                    <Separator/>
                                    <div className="flex justify-between items-center font-bold text-lg"><span >Net Profit</span><div className={`${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(financials.netProfit)}</div></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
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
