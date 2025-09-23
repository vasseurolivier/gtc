
'use client';

import type { Quote } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export function QuotePreview({ quote, customer }: { quote: Quote, customer: Customer }) {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const { companyInfo } = companyInfoContext;
    const commissionAmount = (quote.subTotal + (quote.transportCost || 0)) * ((quote.commissionRate || 0) / 100);

    return (
        <Card className="w-full max-w-4xl mx-auto p-8 md:p-12 shadow-lg print-content" id="proforma-content">
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
                        <span>{format(new Date(quote.issueDate), 'dd MMM yyyy')}</span>
                    </div>
                        <div className="grid grid-cols-2 mt-1">
                        <span className="font-semibold">Valid Until:</span>
                        <span>{format(new Date(quote.validUntil), 'dd MMM yyyy')}</span>
                    </div>
                </div>
            </section>

            <section className="mb-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/2">Description</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price (CNY)</TableHead>
                            <TableHead className="text-right">Total (CNY)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quote.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>

            <section className="flex justify-end mb-8">
                <div className="w-1/2 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>¥{quote.subTotal.toFixed(2)}</span>
                    </div>
                    {quote.transportCost > 0 && 
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Transport Cost</span>
                            <span>¥{quote.transportCost.toFixed(2)}</span>
                        </div>
                    }
                    {quote.commissionRate > 0 &&
                        <>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Commission ({quote.commissionRate}%)</span>
                                <span>¥{commissionAmount.toFixed(2)}</span>
                            </div>
                        </>
                    }
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL (CNY)</span>
                        <span>¥{quote.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </section>
            
            <footer className="border-t pt-8 mt-8">
                {quote.notes && 
                    <div className="mb-8">
                        <h3 className="font-semibold mb-2">Notes:</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                }
                 <div>
                    <h3 className="font-bold text-base mb-2">{companyInfo.name}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{companyInfo.address}</p>
                    <p className="text-sm text-muted-foreground">{companyInfo.email}</p>
                    <p className="text-sm text-muted-foreground">{companyInfo.phone}</p>
                </div>
            </footer>
        </Card>
    );
}
