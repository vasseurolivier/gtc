
'use client';

import type { Quote } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext, useState, useRef } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';


export function QuotePreview({ quote, customer, products }: { quote: Quote, customer: Customer, products: Product[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!currencyContext || !companyInfoContext?.isCompanyInfoLoaded) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const { currency, exchangeRate } = currencyContext;
    const { companyInfo } = companyInfoContext;
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    const commissionAmount = quote.subTotal * ((quote.commissionRate || 0) / 100);
    const downPayment = quote.totalAmount * 0.3; // Assuming 30% down payment
    const remainingBalance = quote.totalAmount - downPayment;
    
    const ITEMS_PER_PAGE = 10;
    const chunkedItems: Quote['items'][] = [];
    for (let i = 0; i < quote.items.length; i += ITEMS_PER_PAGE) {
        chunkedItems.push(quote.items.slice(i, i + ITEMS_PER_PAGE));
    }


    return (
        <>
            <main id="invoice-preview" className="w-full mx-auto">
                <div className="p-8 no-print flex justify-end">
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Export to PDF
                    </Button>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg border print-document">
                    <header className="flex justify-between items-start pb-8 mb-8 border-b print-header">
                        <div>
                            {companyInfo.logo && 
                                <Image src={companyInfo.logo} alt="Company Logo" width={26} height={6} style={{objectFit: 'contain'}} />
                            }
                        </div>
                        <div className="text-right w-1/3">
                            <h1 className="text-2xl font-bold text-black">PROFORMA</h1>
                            <p className="mt-1 text-xs text-muted-foreground">N° {quote.quoteNumber}</p>
                        </div>
                    </header>
                    
                    <section>
                        <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">ÉMIS PAR</h3>
                                <p className="font-bold">{companyInfo?.name}</p>
                                <p className="whitespace-pre-wrap">{companyInfo?.address}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">FACTURÉ À</h3>
                                <p className="font-bold">{customer?.name}</p>
                                {customer?.company && <p>{customer.company}</p>}
                                <p className="whitespace-pre-wrap">{quote.shippingAddress || customer?.address}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">DATE DE LA PROFORMA</h3>
                                <p>{format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1">NUMÉRO DE RÉFÉRENCE</h3>
                                <p>{quote.quoteNumber}</p>
                            </div>
                        </div>

                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b-2 border-t-2">
                                    <th className="p-1 font-semibold">Image</th>
                                    <th className="w-1/2 p-1 font-semibold">Description</th>
                                    <th className="text-right p-1 font-semibold">Quantité</th>
                                    <th className="text-right p-1 font-semibold">Prix Unitaire</th>
                                    <th className="text-right p-1 font-semibold">Total</th>
                                </tr>
                            </thead>
                            
                            {chunkedItems.map((chunk, chunkIndex) => (
                                <tbody key={chunkIndex} className={chunkIndex > 0 ? 'break-before-page' : ''}>
                                    {chunk.map((item, itemIndex) => {
                                        const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                        return (
                                            <tr key={itemIndex} className="border-b">
                                                <td className="p-1 align-top">
                                                    {product?.imageUrl && (
                                                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <Image src={product.imageUrl} alt={item.description} width={48} height={48} className="object-contain"/>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-1 align-top leading-tight">
                                                    <p className="font-medium">{item.description}</p>
                                                    {product?.description && <p className="text-[10px] text-muted-foreground">{product.description}</p>}
                                                </td>
                                                <td className="p-1 align-top text-right">{item.quantity}</td>
                                                <td className="p-1 align-top text-right">
                                                    <div>¥{item.unitPrice.toFixed(2)}</div>
                                                    <div className="text-[10px] text-muted-foreground">{currency.symbol}{(item.unitPrice * exchangeRate).toFixed(2)}</div>
                                                </td>
                                                <td className="p-1 align-top text-right font-medium">
                                                    <div>¥{(item.quantity * item.unitPrice).toFixed(2)}</div>
                                                    <div className="text-[10px] text-muted-foreground">{currency.symbol}{((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)}</div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            ))}
                        </table>
                        
                        <div className="flex justify-end pt-4">
                            <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sous-total :</span>
                                    <span className="font-medium text-right">
                                        <div>¥{quote.subTotal.toFixed(2)}</div>
                                        <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(quote.subTotal * exchangeRate).toFixed(2)}</div>
                                    </span>
                                </div>
                                {(quote.commissionRate || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Commission ({quote.commissionRate}%) :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{commissionAmount.toFixed(2)}</div>
                                            <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(commissionAmount * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Frais de port :</span>
                                    <span className="font-medium text-right">
                                        <div>¥{(quote.transportCost || 0).toFixed(2)}</div>
                                        <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{((quote.transportCost || 0) * exchangeRate).toFixed(2)}</div>
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
                                    <span>TOTAL :</span>
                                    <span className="text-right">
                                        <div>¥{quote.totalAmount.toFixed(2)}</div>
                                        <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</div>
                                    </span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-muted-foreground">Acompte à payer :</span>
                                    <span className="font-medium text-right">
                                        <div>¥{downPayment.toFixed(2)}</div>
                                        <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(downPayment * exchangeRate).toFixed(2)}</div>
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Solde restant :</span>
                                    <span className="text-right">
                                        <div>¥{remainingBalance.toFixed(2)}</div>
                                        <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(remainingBalance * exchangeRate).toFixed(2)}</div>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="break-before-page pt-4 mt-8">
                            {quote.notes && (
                                <div className="mb-8 border-t pt-4">
                                    <h3 className="font-semibold mb-1 text-xs">Notes:</h3>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-tight">
                                        {quote.notes}
                                    </p>
                                </div>
                            )}

                            <div className="text-left border-t pt-4">
                                <h3 className="font-semibold mb-1 text-xs">Coordonnées Bancaires :</h3>
                                <div className="text-xs text-muted-foreground space-y-0.5 leading-tight">
                                    <p><span className="font-medium">Bank Name:</span> Banking Circle S.A. - German Branch</p>
                                    <p><span className="font-medium">Account Name:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
                                    <p><span className="font-medium">Bank Address:</span> Maximilianstraße 54,80538 München, Germany</p>
                                    <p><span className="font-medium">Payment method:</span> SEPA Inst /SEPA SCT.</p>
                                    <p><span className="font-medium">IBAN:</span> DE24202208000056168461</p>
                                    <p><span className="font-medium">SWIFT Code:</span> SXPYDEHH (XXX* If 11 characters are required)</p>
                                    <p className="mt-1"><span className="font-medium">Payment Message:</span> Please include the following memo/message to receiver when making a payment: [Buyer Name] [Invoice/Contract Number] [Product]</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <div className="print-footer-container">
                 <PrintFooter />
            </div>
        </>
    );
}
