
'use client';

import type { Invoice } from '@/actions/invoices';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function InvoicePreview({ invoice, customer, products, logo }: { invoice: Invoice, customer: Customer, products: Product[], logo: string }) {
    const currencyContext = useContext(CurrencyContext);

    if (!currencyContext) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const { currency, exchangeRate } = currencyContext;
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    const handlePrint = () => {
        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
    };

    return (
        <main className="w-full max-w-4xl mx-auto">
             <div className="p-8 no-print flex justify-end">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>

            <div className="print-document bg-white rounded-lg shadow-lg p-8">
                <header className="print-header">
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div className="w-1/3 flex justify-center">
                            {logo && <Image src={logo} alt="Company Logo" width={100} height={40} className="object-contain"/>}
                        </div>
                        <div className="w-1/3 text-center">
                           
                        </div>
                        <div className="w-1/3 text-right">
                            <h1 className="text-2xl font-bold text-red-500">INVOICE</h1>
                            <p className="mt-1"># {invoice.invoiceNumber}</p>
                        </div>
                    </div>
                </header>
                
                <footer className="print-footer">
                    <CompanyInfoFooter />
                </footer>
                
                <div className="print-body">
                    <div className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="font-semibold mb-2">Bill To:</h3>
                            <p className="font-bold">{customer?.name}</p>
                            <p>{customer?.company}</p>
                            <p>{customer?.email}</p>
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
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b-2 border-t-2">
                                <th className="w-16 p-2">Photo</th>
                                <th className="w-1/2 p-2">Description</th>
                                <th className="text-right p-2">Quantity</th>
                                <th className="text-right p-2">Unit Price</th>
                                <th className="text-right p-2">Total</th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {invoice.items.map((item, itemIndex) => {
                                const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                return (
                                    <tr key={itemIndex} className="border-b" style={{ height: '80px' }}>
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
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL (CNY)</span>
                                <span className="text-right">¥{invoice.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
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
