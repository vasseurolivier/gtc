

'use client';

import type { Quote } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


export function QuotePreview({ quote, customer, products }: { quote: Quote, customer: Customer, products: Product[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        let pdfHeight = pdf.internal.pageSize.getHeight();

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
        
        pdf.save(`proforma-${quote.quoteNumber}.pdf`);
    };

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

    const itemChunks = [];
    for (let i = 0; i < quote.items.length; i += 10) {
      itemChunks.push(quote.items.slice(i, i + 10));
    }


    return (
        <main id="invoice-preview" className="w-full mx-auto bg-white">
            <div className="p-8 flex justify-end">
                <Button onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <div id="pdf-content" className="p-8 relative min-h-[29.7cm] flex flex-col">
              <div className="flex-grow">
                <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                    <div>
                        {companyInfo.logo && 
                            <img src={companyInfo.logo} alt="Company Logo" crossOrigin="anonymous" width={52} height={52} style={{objectFit: 'contain'}} />
                        }
                    </div>
                    <div className="text-right w-1/3">
                        <h1 className="text-base font-bold text-black">PROFORMA</h1>
                        <p className="mt-1 text-xs text-muted-foreground">N° {quote.quoteNumber}</p>
                    </div>
                </header>

                  <section>
                      <div className="grid grid-cols-2 gap-8 my-4 text-xs">
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

                      <div className="grid grid-cols-2 gap-8 my-4 text-xs">
                          <div>
                              <h3 className="font-semibold text-muted-foreground mb-1">DATE DE LA PROFORMA</h3>
                              <p>{format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                          </div>
                          <div>
                              <h3 className="font-semibold text-muted-foreground mb-1">NUMÉRO DE RÉFÉRENCE</h3>
                              <p>{quote.quoteNumber}</p>
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
                                          <p className="font-medium">{item.description}</p>
                                          {product?.description && <p className="text-[10px] text-muted-foreground">{product.description}</p>}
                                      </td>
                                      <td className="p-1 align-top text-right">{item.quantity}</td>
                                      <td className="p-1 align-top text-right">
                                          <span className="font-bold">¥{item.unitPrice.toFixed(2)}</span>
                                          <span className="text-muted-foreground"> ({currency.symbol}{(item.unitPrice * exchangeRate).toFixed(2)})</span>
                                      </td>
                                      <td className="p-1 align-top text-right font-medium">
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
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sous-total :</span>
                                <span className="text-right">
                                    <span className="font-bold">¥{quote.subTotal.toFixed(2)}</span>
                                    <span className="text-muted-foreground"> ({currency.symbol}{(quote.subTotal * exchangeRate).toFixed(2)})</span>
                                </span>
                            </div>
                            {(quote.commissionRate || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Commission ({quote.commissionRate}%) :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{commissionAmount.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(commissionAmount * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                            )}
                            {(quote.transportCost || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Frais de port :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{(quote.transportCost || 0).toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{((quote.transportCost || 0) * exchangeRate).toFixed(2)})</span>
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-sm pt-1 mt-2 border-t-2 border-black">
                                <span>TOTAL :</span>
                                <span className="text-right">
                                    <span className="font-bold">¥{quote.totalAmount.toFixed(2)}</span>
                                    <span className="text-muted-foreground"> ({currency.symbol}{(quote.totalAmount * exchangeRate).toFixed(2)})</span>
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Acompte à payer :</span>
                                <span className="text-right">
                                    <span className="font-bold">¥{downPayment.toFixed(2)}</span>
                                    <span className="text-muted-foreground"> ({currency.symbol}{(downPayment * exchangeRate).toFixed(2)})</span>
                                </span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Solde restant :</span>
                                <span className="text-right">
                                    <span className="font-bold">¥{remainingBalance.toFixed(2)}</span>
                                    <span className="text-muted-foreground"> ({currency.symbol}{(remainingBalance * exchangeRate).toFixed(2)})</span>
                                </span>
                            </div>
                        </div>
                    </div>

                  <div className="mt-8 pt-4">
                      {quote.notes && (
                          <div className="mb-8 border-t pt-4">
                              <h3 className="font-semibold mb-1 text-xs">Notes:</h3>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {quote.notes}
                              </p>
                          </div>
                      )}
                  </div>
              </div>
              <div className="break-before-page">
                <div className="text-left border-t pt-4">
                    <h3 className="font-semibold mb-1 text-xs">Coordonnées Bancaires :</h3>
                    <div className="text-xs text-muted-foreground">
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
              <PrintFooter />
            </div>
        </main>
    );
}
