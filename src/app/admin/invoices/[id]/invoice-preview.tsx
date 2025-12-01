
'use client';

import type { Invoice } from '@/actions/invoices';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { getOrderById, Order } from '@/actions/orders';
import { useContext, useEffect, useState, useRef } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function InvoicePreview({ invoice, customer, products }: { invoice: Invoice, customer: Customer, products: Product[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [order, setOrder] = useState<Order | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const printContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (invoice.orderId) {
            getOrderById(invoice.orderId).then(setOrder);
        }
    }, [invoice.orderId]);

    const handlePrint = async () => {
        setIsPrinting(true);
        const content = printContentRef.current;
        const footer = document.getElementById('print-footer-template');

        if (content && footer) {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10; // 10mm margin
                const contentWidth = pdfWidth - (margin * 2);
                
                const footerCanvas = await html2canvas(footer, { scale: 2 });
                const footerImgData = footerCanvas.toDataURL('image/png');
                const footerHeightMM = (footerCanvas.height * contentWidth / footerCanvas.width) * 0.264583;

                const contentCanvas = await html2canvas(content, { scale: 2, windowWidth: content.scrollWidth, windowHeight: content.scrollHeight });
                const contentImgData = contentCanvas.toDataURL('image/png');
                const contentImgHeight = contentCanvas.height * contentWidth / contentCanvas.width;
                
                const pageContentHeight = pdfHeight - (margin * 2) - footerHeightMM - 5; // 5mm extra space before footer
                
                let heightLeft = contentImgHeight;
                let position = 0;
                let pageCount = 0;

                while (heightLeft > 0) {
                    if (pageCount > 0) {
                        pdf.addPage();
                    }
                    // The position `y` is negative because we are slicing the image from the top.
                    pdf.addImage(contentImgData, 'PNG', margin, position, contentWidth, contentImgHeight);
                    pdf.addImage(footerImgData, 'PNG', margin, pdfHeight - footerHeightMM - margin, contentWidth, footerHeightMM);
                    
                    heightLeft -= pageContentHeight;
                    position -= pdfHeight - (margin * 2); // Move the image up for the next page.
                    pageCount++;
                }

                pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);

            } catch (error) {
                console.error("Error generating PDF:", error);
            }
        }
        setIsPrinting(false);
    };

    if (!currencyContext || !companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const { currency, exchangeRate } = currencyContext;
    const { companyInfo } = companyInfoContext;
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    const balanceDue = invoice.totalAmount - (invoice.amountPaid || 0);

    const subTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const commissionRate = order?.commissionRate || 0;
    const commissionAmount = subTotal * (commissionRate / 100);
    const transportCost = order?.transportCost || 0;
    
    return (
        <>
            <main className="w-full mx-auto" id="invoice-preview">
                <div className="p-8 no-print flex justify-end">
                    <Button onClick={handlePrint} disabled={isPrinting}>
                        {isPrinting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="mr-2 h-4 w-4" />
                        )}
                        Export to PDF
                    </Button>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg border print-document">
                    <div ref={printContentRef} className="px-8 py-10 pb-48">
                        <header className="flex justify-between items-start pb-8 mb-8 border-b">
                            <div>
                            {companyInfo.logo && 
                                    <Image src={companyInfo.logo} alt="Company Logo" width={160} height={40} style={{objectFit: 'contain'}}/>
                                }
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-bold text-black">INVOICE</h1>
                                <p className="mt-1 text-xs text-muted-foreground">N° {invoice.invoiceNumber}</p>
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
                                    <p className="whitespace-pre-wrap">{customer?.address}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">DATE DE LA FACTURE</h3>
                                    <p>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">NUMÉRO DE RÉFÉRENCE</h3>
                                    <p>{invoice.invoiceNumber}</p>
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
                                
                                <tbody>
                                    {invoice.items.map((item, itemIndex) => {
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
                            </table>

                            <div className="flex justify-end pt-4">
                                <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sous-total :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{subTotal.toFixed(2)}</div>
                                            <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(subTotal * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    {commissionRate > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Commission ({commissionRate}%) :</span>
                                            <span className="font-medium text-right">
                                                <div>¥{commissionAmount.toFixed(2)}</div>
                                                <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(commissionAmount * exchangeRate).toFixed(2)}</div>
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Frais de port :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{transportCost.toFixed(2)}</div>
                                            <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(transportCost * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
                                        <span>TOTAL :</span>
                                        <span className="text-right">
                                            <div>¥{invoice.totalAmount.toFixed(2)}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(invoice.totalAmount * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-muted-foreground">Montant Payé :</span>
                                        <span className="font-medium text-right">
                                            <div>¥{(invoice.amountPaid || 0).toFixed(2)}</div>
                                            <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{((invoice.amountPaid || 0) * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Solde restant :</span>
                                        <span className="text-right">
                                            <div>¥{balanceDue.toFixed(2)}</div>
                                            <div className="text-[10px] font-normal text-muted-foreground">{currency.symbol}{(balanceDue * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-left border-t pt-4">
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
                        </section>
                    </div>
                </div>
            </main>
            <div className="hidden">
                 <PrintFooter />
            </div>
        </>
    );
}
