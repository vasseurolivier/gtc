
'use client';

import type { Invoice } from '@/actions/invoices';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export function InvoicePreview({ invoice, customer, products }: { invoice: Invoice, customer: Customer, products: Product[] }) {
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
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    const subTotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return (
        <>
            <Card className="w-full max-w-4xl mx-auto p-8 md:p-12 shadow-lg print-card" id="invoice-content">
                <header className="flex justify-between items-start mb-8 border-b pb-8">
                    <div>
                        {companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={120} height={120} className="object-contain"/>}
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-primary">INVOICE</h2>
                        <p className="text-muted-foreground mt-2"># {invoice.invoiceNumber}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold mb-2">Bill To:</h3>
                        <p className="font-bold">{customer?.name}</p>
                        <p className="text-muted-foreground">{customer?.company}</p>
                        <p className="text-muted-foreground">{customer?.email}</p>
                    </div>
                    <div className="text-right">
                        <div className="grid grid-cols-2">
                            <span className="font-semibold">Issue Date:</span>
                            <span>{format(new Date(invoice.issueDate), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="grid grid-cols-2 mt-1">
                            <span className="font-semibold">Due Date:</span>
                            <span>{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                </section>
                
                <main className="flex-grow">
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
                            {invoice.items.map((item, index) => {
                                const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                return (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                {product?.imageUrl && (
                                                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        <Image src={product.imageUrl} alt={item.description} width={64} height={64} className="object-contain"/>
                                                    </div>
                                                )}
                                                <div>{item.description}</div>
                                            </div>
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
                                <span className="font-medium text-right">¥{subTotal.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL (CNY)</span>
                                <span className="text-right">¥{invoice.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-primary">
                                <span>TOTAL ({currency.code})</span>
                                <span className="text-right">{currency.symbol}{(invoice.totalAmount * exchangeRate).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-medium text-right">¥{(invoice.amountPaid || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-destructive">
                                <span>Balance Due ({currency.code})</span>
                                <span className="text-right">{currency.symbol}{((invoice.totalAmount - (invoice.amountPaid || 0)) * exchangeRate).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </main>
            </Card>
        </>
    );
}
