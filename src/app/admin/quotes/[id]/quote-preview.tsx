
'use client';

import type { Quote } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function QuotePreview({ quote, customer, products, logo }: { quote: Quote, customer: Customer, products: Product[], logo: string }) {
    const currencyContext = useContext(CurrencyContext);

    if (!currencyContext) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const { currency, exchangeRate } = currencyContext;
    const commissionAmount = (quote.subTotal) * ((quote.commissionRate || 0) / 100);
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    const handlePrint = () => {
        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
    };

    return (
        <main className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-auto">
            <div className="p-8 no-print">
                <div className="flex justify-end mb-4">
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Export to PDF
                    </Button>
                </div>
            </div>
            
            <div className="print-document p-8">
                <header className="print-header">
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div>
                            {logo && <Image src={logo} alt="Company Logo" width={100} height={40} className="object-contain"/>}
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold text-primary">PROFORMA INVOICE</h1>
                            <p className="mt-1"># {quote.quoteNumber}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="font-semibold mb-2">Bill To:</h3>
                            <p className="font-bold">{customer?.name}</p>
                            <p>{customer?.company}</p>
                            <p>{customer?.email}</p>
                            <p className="whitespace-pre-wrap">{quote.shippingAddress}</p>
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
                </header>

                <footer className="print-footer">
                    <CompanyInfoFooter />
                </footer>
                    
                <div className="print-body">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left">
                                <th className="w-16 p-2">Photo</th>
                                <th className="w-1/2 p-2">Description</th>
                                <th className="text-right p-2">Quantity</th>
                                <th className="text-right p-2">Unit Price</th>
                                <th className="text-right p-2">Total</th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {quote.items.map((item, itemIndex) => {
                                const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                return (
                                    <tr key={itemIndex}>
                                        <td className="p-2 align-top">
                                            {product?.imageUrl && (
                                                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <Image src={product.imageUrl} alt={item.description} width={64} height={64} className="object-contain"/>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2 align-top">{item.description}</td>
                                        <td className="p-2 align-top text-right">{item.quantity}</td>
                                        <td className="p-2 align-top text-right">
                                            <div>¥{item.unitPrice.toFixed(2)}</div>
                                            <div className="text-xs">{currency.symbol}{(item.unitPrice * exchangeRate).toFixed(2)}</div>
                                        </td>
                                        <td className="p-2 align-top text-right">
                                            <div>¥{(item.quantity * item.unitPrice).toFixed(2)}</div>
                                            <div className="text-xs">{currency.symbol}{((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)}</div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
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
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL ({currency.code})</span>
                                <span className="text-right">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {quote.notes && 
                        <div className="mt-8 text-left border-t pt-4">
                            <h3 className="font-semibold mb-2">Notes:</h3>
                            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                        </div>
                    }
                </div>
            </div>
        </main>
    );
}

function CompanyInfoFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);
     if (!companyInfoContext) return null;
    const { companyInfo } = companyInfoContext;
    
    return (
        <div className="pt-4 border-t text-center text-xs">
            <p className="font-bold">{companyInfo.name}</p>
            <p>{companyInfo.address}</p>
            <p>Email: {companyInfo.email} | Phone: {companyInfo.phone}</p>
        </div>
    );
}
