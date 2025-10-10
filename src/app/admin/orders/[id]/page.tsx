
'use client';

import { useEffect, useState, useContext } from 'react';
import { getOrderById, Order } from '@/actions/orders';
import { getCustomerById, Customer } from '@/actions/customers';
import { ArrowLeft, Loader2, FileSpreadsheet, Package, User, Calendar, Truck, DollarSign, StickyNote, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams } from 'next/navigation';
import { CurrencyContext } from '@/context/currency-context';

export default function OrderProfilePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currencyContext = useContext(CurrencyContext);

    useEffect(() => {
        if (id) {
            async function fetchData() {
                try {
                    const orderData = await getOrderById(id);
                    setOrder(orderData);
                    if (orderData) {
                        const customerData = await getCustomerById(orderData.customerId);
                        setCustomer(customerData);
                    }
                } catch (err) {
                    console.error("Failed to fetch order details", err);
                    setOrder(null);
                    setCustomer(null);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [id]);

    if (!currencyContext) {
        return (
             <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    const { currency, exchangeRate } = currencyContext;

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
        if (!order || !customer) return;

        const orderInfoData = [
            { Field: 'Order #', Value: order.orderNumber },
            { Field: 'Order Date', Value: format(new Date(order.orderDate), 'dd MMM yyyy') },
            { Field: 'Status', Value: order.status },
            { Field: 'Customer', Value: customer.name },
            { Field: 'Company', Value: customer.company || 'N/A' },
            { Field: 'Total Amount (CNY)', Value: order.totalAmount.toFixed(2) },
            { Field: `Total Amount (${currency.code})`, Value: (order.totalAmount * exchangeRate).toFixed(2) },
            { Field: 'Transport Cost (CNY)', Value: (order.transportCost || 0).toFixed(2) },
            { Field: 'Commission Rate (%)', Value: `${(order.commissionRate || 0)}%` },
            { Field: 'Shipping Address', Value: order.shippingAddress || 'N/A' },
            { Field: 'Notes', Value: order.notes || 'N/A' },
        ];
        const orderInfoWs = XLSX.utils.json_to_sheet(orderInfoData, { skipHeader: true });
        orderInfoWs['!cols'] = [{ wch: 25 }, { wch: 50 }];

        const itemsData = (order.items || []).map(item => ({
            'SKU': item.sku || 'N/A',
            'Description': item.description,
            'Quantity': item.quantity,
            'Unit Price (CNY)': item.unitPrice.toFixed(2),
            'Total (CNY)': (item.quantity * item.unitPrice).toFixed(2),
        }));
        const itemsWs = XLSX.utils.json_to_sheet(itemsData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, orderInfoWs, "Order Info");
        XLSX.utils.book_append_sheet(wb, itemsWs, "Items");

        XLSX.writeFile(wb, `Order_${order.orderNumber}.xlsx`);
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

    if (!order) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Order not found.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
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
                            <CardTitle className="flex items-center gap-2"><Package /> Order {order.orderNumber}</CardTitle>
                             <CardDescription className="flex items-center gap-2 pt-2">
                                <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Date: {format(new Date(order.orderDate), 'dd MMM yyyy')}</div>
                            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Customer: {order.customerName}</div>
                            {order.shippingAddress && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><Truck className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{order.shippingAddress}</p></div>}
                            {order.notes && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><StickyNote className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{order.notes}</p></div>}
                             <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><Info className="h-4 w-4 mt-1 flex-shrink-0" /> 
                                <p className="whitespace-pre-wrap">Proforma ID: {order.quoteId}</p>
                             </div>

                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">¥{order.totalAmount.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                {currency.symbol}{(order.totalAmount * exchangeRate).toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Costs & Commission</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between"><span>Transport Cost</span> <span>¥{(order.transportCost || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Commission Rate</span> <span>{(order.commissionRate || 0)}%</span></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Price (CNY)</TableHead>
                                        <TableHead className="text-right">Total (CNY)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.sku || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">¥{item.unitPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">¥{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
