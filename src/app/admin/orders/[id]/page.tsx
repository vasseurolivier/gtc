
import { getOrderById, Order } from '@/actions/orders';
import { getCustomerById, Customer } from '@/actions/customers';
import { ArrowLeft, Loader2, FileSpreadsheet, Package, User, Calendar, Truck, DollarSign, StickyNote, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { OrderDetailClient } from './order-detail-client';

async function getOrderData(id: string) {
    try {
        const order = await getOrderById(id);
        if (!order) {
            return { order: null, customer: null };
        }
        const customer = await getCustomerById(order.customerId);
        return { order, customer };
    } catch (e) {
        console.error(e);
        return { order: null, customer: null };
    }
}

export default async function OrderProfilePage({ params }: { params: { id: string } }) {
    const { id } = params;
    
    if (!id) {
        return (
            <div className="container py-8">
                <div className="text-center text-muted-foreground py-12">
                    ID de commande manquant.
                </div>
            </div>
        );
    }
    
    const { order, customer } = await getOrderData(id);

    if (!order) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux commandes
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Commande non trouvée.
                </div>
            </div>
        );
    }
    
    const getStatusBadgeVariant = (status: any) => {
        switch (status) {
            case 'delivered': return 'default';
            case 'shipped': return 'secondary';
            case 'processing': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };


    return (
        <OrderDetailClient order={order} customer={customer}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Package /> Commande {order.orderNumber}</CardTitle>
                             <CardDescription className="flex items-center gap-2 pt-2">
                                <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Date: {format(new Date(order.orderDate), 'dd MMM yyyy')}</div>
                            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Client: {order.customerName}</div>
                            {order.shippingAddress && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><Truck className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{order.shippingAddress}</p></div>}
                            {order.notes && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><StickyNote className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{order.notes}</p></div>}
                             <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><Info className="h-4 w-4 mt-1 flex-shrink-0" /> 
                                <p className="whitespace-pre-wrap">ID Proforma: {order.quoteId}</p>
                             </div>

                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">¥{order.totalAmount.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Montant en devise locale sera affiché ici.
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Coûts & Commission</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between"><span>Coût du Transport</span> <span>¥{(order.transportCost || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Taux de Commission</span> <span>{(order.commissionRate || 0)}%</span></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Articles de la Commande</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qté</TableHead>
                                        <TableHead className="text-right">Prix Unitaire (CNY)</TableHead>
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
        </OrderDetailClient>
    );
}
