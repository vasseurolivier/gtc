
'use client';

import type { Quote } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function QuotePreview({ quote, customer, products }: { quote: Quote, customer: Customer, products: Product[] }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const currencyContext = useContext(CurrencyContext);

    if (!companyInfoContext || !currencyContext) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const { companyInfo } = companyInfoContext;
    const { currency, exchangeRate } = currencyContext;
    const commissionAmount = (quote.subTotal) * ((quote.commissionRate || 0) / 100);
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    return (
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-auto print-document">
            <div className="flex justify-end mb-4 no-print">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
             <table className="w-full">
                <thead className="print-header">
                    <tr>
                        <td colSpan={5}>
                           <div className="flex justify-between items-start pb-4 border-b">
                                <div>
                                    {companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={100} height={100} className="object-contain"/>}
                                </div>
                                <div className="text-right">
                                    <h1 className="text-3xl font-bold text-primary">PROFORMA INVOICE</h1>
                                    <p className="text-muted-foreground mt-1"># {quote.quoteNumber}</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                </thead>
                 <tbody>
                    <tr>
                        <td colSpan={5}>
                            <div className="grid grid-cols-2 gap-8 my-8">
                                <div>
                                    <h3 className="font-semibold mb-2 text-left">Bill To:</h3>
                                    <p className="font-bold text-left">{customer?.name}</p>
                                    <p className="text-muted-foreground text-left">{customer?.company}</p>
                                    <p className="text-muted-foreground text-left">{customer?.email}</p>
                                    <p className="text-muted-foreground text-left">{quote.shippingAddress}</p>
                                </div>
                                <div className="text-right">
                                    <div className="grid grid-cols-2">
                                        <span className="font-semibold">Issue Date:</span>
                                        <span>{format(new Date(quote.issueDate), 'dd MMM yyyy')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 mt-1">
                                        <span className="font-semibold">Valid Until:</span>
                                        <span>{format(new Date(quote.validUntil), 'dd MMM yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr className="border-b">
                        <TableHead className="w-16">Photo</TableHead>
                        <TableHead className="w-1/2">Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </tr>
                    {quote.items.map((item, itemIndex) => {
                        const product = item.sku ? productsBySku.get(item.sku) : undefined;
                        return (
                            <TableRow key={itemIndex}>
                                <TableCell className="w-16">
                                    {product?.imageUrl && (
                                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <Image src={product.imageUrl} alt={item.description} width={64} height={64} className="object-contain"/>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="w-1/2">
                                    <div>{item.description}</div>
                                </TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                    <div>¥{item.unitPrice.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">{currency.symbol}{(item.unitPrice * exchangeRate).toFixed(2)}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div>¥{(item.quantity * item.unitPrice).toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">{currency.symbol}{((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)}</div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </tbody>
                 <tfoot className="print-footer">
                    <tr>
                        <td colSpan={5}>
                            <div className="flex justify-end pt-8">
                                <div className="w-full md:w-2/3 lg:w-1/2 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium text-right">¥{quote.subTotal.toFixed(2)}</span>
                                    </div>
                                    {(quote.transportCost && quote.transportCost > 0) && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Transport Cost</span>
                                            <span className="font-medium text-right">¥{quote.transportCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {(quote.commissionRate && quote.commissionRate > 0) && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Commission ({quote.commissionRate}%)</span>
                                                <span className="font-medium text-right">¥{commissionAmount.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>TOTAL (CNY)</span>
                                        <span className="text-right">¥{quote.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg text-primary">
                                        <span>TOTAL ({currency.code})</span>
                                        <span className="text-right">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                             {quote.notes && 
                                <div className="mt-8 text-left">
                                    <h3 className="font-semibold mb-2">Notes:</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                                </div>
                            }
                           <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                                <p className="font-bold">{companyInfo.name}</p>
                                <p>{companyInfo.address}</p>
                                <p>Email: {companyInfo.email} | Phone: {companyInfo.phone}</p>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
