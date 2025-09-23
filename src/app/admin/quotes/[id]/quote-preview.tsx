'use client';

import type { Quote } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import Image from 'next/image';

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
    const commissionAmount = (quote.subTotal + (quote.transportCost || 0)) * ((quote.commissionRate || 0) / 100);

    const productsBySku = new Map(products.map(p => [p.sku, p]));

    return (
        <Card className="w-full max-w-4xl mx-auto p-8 md:p-12 shadow-lg print-content flex flex-col min-h-full" id="proforma-content">
            <header className="flex justify-between items-start mb-8 border-b pb-8">
                <div>
                    {companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={120} height={120} className="object-contain"/>}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-primary">PROFORMA INVOICE</h2>
                    <p className="text-muted-foreground mt-2"># {quote.quoteNumber}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-semibold mb-2">Bill To:</h3>
                    <p className="font-bold">{customer?.name}</p>
                    <p className="text-muted-foreground">{customer?.company}</p>
                    <p className="text-muted-foreground">{customer?.email}</p>
                    <p className="text-muted-foreground">{quote.shippingAddress}</p>
                </div>
                <div className="text-right">
                    <div className="grid grid-cols-2">
                        <span className="font-semibold">Issue Date:</span>
                        <span>{formatInTimeZone(new Date(quote.issueDate), 'UTC', 'dd MMM yyyy')}</span>
                    </div>
                        <div className="grid grid-cols-2 mt-1">
                        <span className="font-semibold">Valid Until:</span>
                        <span>{formatInTimeZone(new Date(quote.validUntil), 'UTC', 'dd MMM yyyy')}</span>
                    </div>
                </div>
            </section>

            <div className="flex-grow">
                <section>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/2">Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quote.items.map((item, index) => {
                                const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                return (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {product?.imageUrl && (
                                                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 mb-2">
                                                    <Image src={product.imageUrl} alt={item.description} width={64} height={64} className="object-contain"/>
                                                </div>
                                            )}
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
                        </TableBody>
                    </Table>

                    <div className="flex justify-end mt-8">
                        <div className="w-full md:w-2/3 lg:w-1/2 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium text-right">¥{quote.subTotal.toFixed(2)}</span>
                            </div>
                            {quote.transportCost && quote.transportCost > 0 && 
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Transport Cost</span>
                                    <span className="font-medium text-right">¥{quote.transportCost.toFixed(2)}</span>
                                </div>
                            }
                            {quote.commissionRate && quote.commissionRate > 0 &&
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Commission ({quote.commissionRate}%)</span>
                                        <span className="font-medium text-right">¥{commissionAmount.toFixed(2)}</span>
                                    </div>
                                </>
                            }
                            <Separator />
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
                </section>
            </div>

            
            <footer className="border-t pt-8 mt-auto">
                 <div className="text-center">
                    <h3 className="font-bold text-base">{companyInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">{companyInfo.address}</p>
                    <p className="text-sm text-muted-foreground">
                        {companyInfo.phone && <span>{companyInfo.phone}</span>}
                        {companyInfo.phone && companyInfo.email && <span> | </span>}
                        {companyInfo.email && <span>{companyInfo.email}</span>}
                    </p>
                </div>
                {quote.notes && 
                    <div className="mt-8 text-left">
                        <h3 className="font-semibold mb-2">Notes:</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                }
            </footer>
        </Card>
    );
}
