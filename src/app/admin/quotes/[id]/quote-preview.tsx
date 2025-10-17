
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function QuotePreview({ quote, customer, products, logo }: { quote: Quote, customer: Customer, products: Product[], logo: string }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    if (!currencyContext || !companyInfoContext) {
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

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        const input = printRef.current;
        if (input) {
            try {
                const canvas = await html2canvas(input, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const pdfHeight = canvasHeight * pdfWidth / canvasWidth;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Proforma_${quote.quoteNumber}.pdf`);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("An error occurred while generating the PDF.");
            }
        }
        setIsGeneratingPdf(false);
    };
    

    return (
        <main className="w-full mx-auto">
            <div className="p-8 no-print flex justify-end">
                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Printer className="mr-2 h-4 w-4" />
                    )}
                    Export to PDF
                </Button>
            </div>
            
            <div ref={printRef} className="bg-white rounded-lg shadow-lg p-8 border">
                <div style={{ display: 'table', width: '100%' }}>
                    <header style={{ display: 'table-header-group' }}>
                        <div className="pb-4 border-b flex justify-between items-start">
                            <div className="w-1/3 flex justify-start">
                                {logo && <Image src={logo} alt="Company Logo" width={120} height={50} className="object-contain"/>}
                            </div>
                            <div className="w-1/3 text-right">
                                <h1 className="text-3xl font-bold text-black">PROFORMA</h1>
                                <p className="mt-1 text-muted-foreground">N° {quote.quoteNumber}</p>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-8 my-8">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">ÉMIS PAR</h3>
                                <p className="font-bold">{companyInfo?.name}</p>
                                <p className="whitespace-pre-wrap text-sm">{companyInfo?.address}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">FACTURÉ À</h3>
                                <p className="font-bold">{customer?.name}</p>
                                {customer?.company && <p>{customer.company}</p>}
                                <p className="whitespace-pre-wrap text-sm">{quote.shippingAddress || customer?.address}</p>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-8 my-8">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">DATE DE LA PROFORMA</h3>
                                <p>{format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
                                <p>{quote.quoteNumber}</p>
                            </div>
                        </div>
                    </header>
                    
                    <footer style={{ display: 'table-footer-group' }}>
                         <div className="pt-4 border-t text-center text-xs text-muted-foreground">
                            <p>Merci de votre confiance</p>
                            <p>{companyInfo?.address}</p>
                            <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
                        </div>
                    </footer>
                
                    <section style={{ display: 'table-row-group' }}>
                        <div className="page-1-content">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-muted-foreground border-b-2 border-t-2 text-sm">
                                        <th className="p-2 font-semibold">Image</th>
                                        <th className="w-1/2 p-2 font-semibold">Description</th>
                                        <th className="text-right p-2 font-semibold">Quantité</th>
                                        <th className="text-right p-2 font-semibold">Prix Unitaire</th>
                                        <th className="text-right p-2 font-semibold">Total</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    {quote.items.map((item, itemIndex) => {
                                        const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                        return (
                                            <tr key={itemIndex} className="border-b" style={{ height: 'auto' }}>
                                                <td className="p-2 align-top">
                                                    {product?.imageUrl && (
                                                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <Image src={product.imageUrl} alt={item.description} width={64} height={64} className="object-contain"/>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2 align-top">
                                                    <p className="font-medium">{item.description}</p>
                                                    {product?.description && <p className="text-xs text-muted-foreground">{product.description}</p>}
                                                </td>
                                                <td className="p-2 align-top text-right">{item.quantity}</td>
                                                <td className="p-2 align-top text-right">
                                                    <div>¥{item.unitPrice.toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">{currency.symbol}{(item.unitPrice * exchangeRate).toFixed(2)}</div>
                                                </td>
                                                <td className="p-2 align-top text-right font-medium">
                                                    <div>¥{(item.quantity * item.unitPrice).toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">{currency.symbol}{((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)}</div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            
                            <div className="flex justify-end pt-8">
                                <div className="w-full md:w-2/3 lg:w-1/2 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sous-total :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{quote.subTotal.toFixed(2)}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(quote.subTotal * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    {(quote.commissionRate || 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Commission ({quote.commissionRate}%) :</span>
                                            <span className="font-medium text-right">
                                                <div>¥{commissionAmount.toFixed(2)}</div>
                                                <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(commissionAmount * exchangeRate).toFixed(2)}</div>
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Frais de port :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{(quote.transportCost || 0).toFixed(2)}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{((quote.transportCost || 0) * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                        <span>TOTAL :</span>
                                        <span className="text-right">
                                            <div>¥{quote.totalAmount.toFixed(2)}</div>
                                            <div className="text-sm font-normal text-muted-foreground">{currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        <span className="text-muted-foreground">Acompte à payer :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{downPayment.toFixed(2)}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(downPayment * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Solde restant :</span>
                                        <span className="text-right">
                                            <div>¥{remainingBalance.toFixed(2)}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(remainingBalance * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="page-2-content" style={{pageBreakBefore: 'always'}}>
                            <div className="mt-12 text-left border-t pt-4">
                                <h3 className="font-semibold mb-2">Coordonnées Bancaires :</h3>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p><span className="font-medium">Bank Name:</span> Banking Circle S.A. - German Branch</p>
                                    <p><span className="font-medium">Account Name:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
                                    <p><span className="font-medium">Bank Address:</span> Maximilianstraße 54,80538 München, Germany</p>
                                    <p><span className="font-medium">Payment method:</span> SEPA Inst /SEPA SCT.</p>
                                    <p><span className="font-medium">IBAN:</span> DE24202208000056168461</p>
                                    <p><span className="font-medium">SWIFT Code:</span> SXPYDEHH (XXX* If 11 characters are required)</p>
                                    <p className="mt-2"><span className="font-medium">Payment Message:</span> Please include the following memo/message to receiver when making a payment: [Buyer Name] [Invoice/Contract Number] [Product]</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
