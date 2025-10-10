
'use client';

import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CurrencyContext } from '@/context/currency-context';
import type { Order } from '@/actions/orders';
import type { Customer } from '@/actions/customers';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';


export function OrderDetailClient({ order, customer, children }: { order: Order, customer: Customer | null, children: React.ReactNode }) {
    const currencyContext = useContext(CurrencyContext);

    if (!currencyContext) {
        // Fallback or loading state
        return <div>Chargement du contexte monétaire...</div>;
    }

    const { currency, exchangeRate } = currencyContext;

    const handleExport = () => {
        if (!order || !customer) return;

        const orderInfoData = [
            { Field: 'Numéro de commande', Value: order.orderNumber },
            { Field: 'Date de commande', Value: format(new Date(order.orderDate), 'dd MMM yyyy') },
            { Field: 'Statut', Value: order.status },
            { Field: 'Client', Value: customer.name },
            { Field: 'Société', Value: customer.company || 'N/A' },
            { Field: 'Montant total (CNY)', Value: order.totalAmount.toFixed(2) },
            { Field: `Montant total (${currency.code})`, Value: (order.totalAmount * exchangeRate).toFixed(2) },
            { Field: 'Coût du transport (CNY)', Value: (order.transportCost || 0).toFixed(2) },
            { Field: 'Taux de commission (%)', Value: `${(order.commissionRate || 0)}%` },
            { Field: 'Adresse de livraison', Value: order.shippingAddress || 'N/A' },
            { Field: 'Notes', Value: order.notes || 'N/A' },
        ];
        const orderInfoWs = XLSX.utils.json_to_sheet(orderInfoData, { skipHeader: true });
        orderInfoWs['!cols'] = [{ wch: 25 }, { wch: 50 }];

        const itemsData = (order.items || []).map(item => ({
            'SKU': item.sku || 'N/A',
            'Description': item.description,
            'Quantité': item.quantity,
            'Prix Unitaire (CNY)': item.unitPrice.toFixed(2),
            'Total (CNY)': (item.quantity * item.unitPrice).toFixed(2),
        }));
        const itemsWs = XLSX.utils.json_to_sheet(itemsData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, orderInfoWs, "Infos Commande");
        XLSX.utils.book_append_sheet(wb, itemsWs, "Articles");

        XLSX.writeFile(wb, `Commande_${order.orderNumber}.xlsx`);
    };

    // Replace the specific card with a client-side rendered version
    const updatedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.className?.includes('lg:col-span-1')) {
            const grandChildren = React.Children.map(child.props.children, (grandChild: any) => {
                 if (React.isValidElement(grandChild) && grandChild.props.children?.props?.className?.includes('text-2xl')) {
                     if (grandChild.props.children?.props?.children[0]?.props?.className?.includes('DollarSign')){
                        return (
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">¥{order.totalAmount.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {currency.symbol}{(order.totalAmount * exchangeRate).toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>
                        )
                     }
                }
                return grandChild;
            });
            return React.cloneElement(child, { children: grandChildren });
        }
        return child;
    });

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux commandes
                    </Link>
                </Button>
                <Button onClick={handleExport} variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exporter vers Excel
                </Button>
            </div>
            {updatedChildren}
        </div>
    );
}

