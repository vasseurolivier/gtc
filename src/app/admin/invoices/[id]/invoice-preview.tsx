

'use client';

import type { Invoice } from '@/actions/invoices';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { getOrderById, Order } from '@/actions/orders';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function InvoicePreview({ invoice, customer, products }: { invoice: Invoice, customer: Customer, products: Product[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (invoice.orderId) {
            getOrderById(invoice.orderId).then(setOrder);
        }
    }, [invoice.orderId]);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
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

    const itemChunks = [];
    for (let i = 0; i < invoice.items.length; i += 10) {
      itemChunks.push(invoice.items.slice(i, i + 10));
    }
    
    return (
        <main className="w-full mx-auto bg-white" id="invoice-preview">
            <div className="p-8 flex justify-end no-print">
                <Button onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <div className="relative">
                <div id="pdf-content" className="p-8 bg-white">
                    <div className="flex-grow">
                        <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                            <div>
                            {companyInfo.logo && 
                                <img src={companyInfo.logo} alt="Company Logo" crossOrigin="anonymous" className="h-12 w-auto object-contain"/>
                            }
                            </div>
                            <div className="text-right">
                                <h1 className="text-base font-bold text-black leading-tight">INVOICE</h1>
                                <p className="mt-1 text-xs text-muted-foreground leading-tight">N° {invoice.invoiceNumber}</p>
                            </div>
                        </header>

                        <section>
                            <div className="grid grid-cols-2 gap-8 my-4 text-xs">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">ÉMIS PAR</h3>
                                    <p className="font-bold leading-tight">{companyInfo?.name}</p>
                                    <p className="whitespace-pre-wrap leading-tight">{companyInfo?.address}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">FACTURÉ À</h3>
                                    <p className="font-bold leading-tight">{customer?.name}</p>
                                    {customer?.company && <p className="leading-tight">{customer.company}</p>}
                                    <p className="whitespace-pre-wrap leading-tight">{customer?.address}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 my-4 text-xs">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">DATE DE LA FACTURE</h3>
                                    <p className="leading-tight">{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">NUMÉRO DE RÉFÉRENCE</h3>
                                    <p className="leading-tight">{invoice.invoiceNumber}</p>
                                </div>
                            </div>
                        </section>
                        
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
                            {itemChunks.map((chunk, chunkIndex) => (
                              <tbody key={chunkIndex} className={chunkIndex > 0 ? 'break-before-page' : ''}>
                                  {chunk.map((item, itemIndex) => {
                                      const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                      return (
                                          <tr key={itemIndex} className="border-b">
                                              <td className="p-1 align-top">
                                                  {product?.imageUrl && (
                                                      <div className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                          <img src={product.imageUrl} alt={item.description} crossOrigin="anonymous" width={48} height={48} className="object-contain"/>
                                                      </div>
                                                  )}
                                              </td>
                                              <td className="p-1 align-top">
                                                  <p className="font-medium leading-tight">{item.description}</p>
                                                  {product?.description && <p className="text-[10px] text-muted-foreground leading-tight">{product.description}</p>}
                                              </td>
                                              <td className="p-1 align-top text-right leading-tight">{item.quantity}</td>
                                              <td className="p-1 align-top text-right leading-tight">
                                                  <span className="font-bold">¥{item.unitPrice.toFixed(2)}</span>
                                                  <span className="text-muted-foreground"> ({currency.symbol}{(item.unitPrice * exchangeRate).toFixed(2)})</span>
                                              </td>
                                              <td className="p-1 align-top text-right font-medium leading-tight">
                                                  <span className="font-bold">¥{(item.quantity * item.unitPrice).toFixed(2)}</span>
                                                  <span className="text-muted-foreground"> ({currency.symbol}{((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)})</span>
                                              </td>
                                          </tr>
                                      )
                                  })}
                              </tbody>
                            ))}
                        </table>
                        
                        <div className="flex justify-end pt-4">
                            <div className="w-full md:w-2/3 lg:w-1/2 space-y-0 text-xs">
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Sous-total :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{subTotal.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(subTotal * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Commission ({commissionRate}%) :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{commissionAmount.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(commissionAmount * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                
                                <div className="flex justify-between mt-1 leading-tight">
                                    <span className="text-muted-foreground">Frais de port :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{transportCost.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(transportCost * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-sm pt-1 mt-2 border-t-2 border-black leading-tight">
                                    <span>TOTAL :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{invoice.totalAmount.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(invoice.totalAmount * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Montant Payé :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{(invoice.amountPaid || 0).toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{((invoice.amountPaid || 0) * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold leading-tight">
                                    <span>Solde restant :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{balanceDue.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(balanceDue * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                     <div className="break-before-page">
                        <div className="mt-8 pt-4">
                            <h3 className="font-semibold mb-1 text-xs leading-tight">Coordonnées Bancaires :</h3>
                            <div className="text-xs text-muted-foreground space-y-0 leading-tight">
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
                </div>
                <PrintFooter />
            </div>
        </main>
    );
}
