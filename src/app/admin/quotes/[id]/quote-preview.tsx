
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
    const displayLogo = companyInfo.publicLogo || companyInfo.logo;
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    // Use stored rate or current context rate
    const quoteRate = quote.exchangeRate || exchangeRate || 0.13;
    const commissionAmount = quote.subTotal * ((quote.commissionRate || 0) / 100);

    const itemChunks = [];
    for (let i = 0; i < quote.items.length; i += 10) {
      itemChunks.push(quote.items.slice(i, i + 10));
    }


    return (
        <main id="invoice-preview" className="w-full mx-auto bg-white">
            <div className="p-8 flex justify-end no-print">
                <Button onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-24">
                <div className="flex-grow">
                    <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                        <div>
                            {displayLogo && <img src={displayLogo} alt="Company Logo" crossOrigin="anonymous" className="h-12 w-auto object-contain block" />}
                        </div>
                        <div className="text-right w-1/3">
                            <h1 className="text-base font-bold text-black leading-tight">PROFORMA</h1>
                            <p className="mt-1 text-xs text-muted-foreground leading-tight">N° {quote.quoteNumber}</p>
                        </div>
                    </header>

                    <section>
                        <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">ÉMIS PAR</h3>
                                <p className="font-bold leading-tight">{companyInfo?.name}</p>
                                <p className="whitespace-pre-wrap leading-tight">{companyInfo?.address}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">FACTURÉ À</h3>
                                <p className="font-bold leading-tight">{(customer as any)?.companyName || customer?.company || customer?.name}</p>
                                <p className="whitespace-pre-wrap leading-tight">{quote.shippingAddress || customer?.address}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">DATE DE LA PROFORMA</h3>
                                <p className="leading-tight">{format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">NUMÉRO DE RÉFÉRENCE</h3>
                                <p className="leading-tight">{quote.quoteNumber}</p>
                            </div>
                        </div>
                    </section>
                    
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left bg-blue-100 text-blue-800">
                                <th className="p-2 font-bold border">Image</th>
                                <th className="w-1/2 p-2 font-bold border">Description</th>
                                <th className="text-right p-2 font-bold border">Quantité</th>
                                <th className="text-right p-2 font-bold border">Prix Unitaire</th>
                                <th className="text-right p-2 font-bold border">Total</th>
                            </tr>
                        </thead>
                        {itemChunks.map((chunk, chunkIndex) => (
                            <tbody key={chunkIndex} className={chunkIndex > 0 ? 'pdf-page' : ''}>
                            {chunk.map((item, itemIndex) => {
                                const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                return (
                                    <tr key={itemIndex} className="border-b">
                                        <td className="p-1 align-top border">
                                            {product?.imageUrl && (
                                                <div className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <img src={product.imageUrl} alt={item.description} crossOrigin="anonymous" width={48} height={48} className="object-contain"/>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-1 align-top border">
                                            <p className="font-medium leading-tight">{product?.name || item.description}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
                                        </td>
                                        <td className="p-1 align-top text-right leading-tight border">{item.quantity}</td>
                                        <td className="p-1 align-top text-right leading-tight border">
                                            <span className="font-bold">¥{item.unitPrice.toFixed(2)}</span>
                                            <span className="text-muted-foreground"> ({currency.symbol}{(item.unitPrice * quoteRate).toFixed(2)})</span>
                                        </td>
                                        <td className="p-1 align-top text-right font-medium leading-tight border">
                                            <span className="font-bold">¥{(item.quantity * item.unitPrice).toFixed(2)}</span>
                                            <span className="text-muted-foreground"> ({currency.symbol}{((item.quantity * item.unitPrice) * quoteRate).toFixed(2)})</span>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        ))}
                    </table>
                    
                    <div className="flex justify-end pt-4">
                            <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 text-xs">
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Sous-total :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{quote.subTotal.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(quote.subTotal * quoteRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Commission ({quote.commissionRate || 0}%) :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{commissionAmount.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(commissionAmount * quoteRate).toFixed(2)})</span>
                                    </span>
                                </div>
                                
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Frais de port :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{(quote.transportCost || 0).toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{((quote.transportCost || 0) * quoteRate).toFixed(2)})</span>
                                    </span>
                                </div>

                                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t-2 border-black">
                                    <span>TOTAL :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{quote.totalAmount.toFixed(2)}</span>
                                        <span className="text-muted-foreground"> ({currency.symbol}{(quote.totalAmount * quoteRate).toFixed(2)})</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                    <div className="mt-8 pt-4">
                        <div className="p-4 bg-zinc-50 rounded-lg border text-xs mb-4">
                            <h3 className="font-bold mb-2 uppercase">Coordonnées Bancaires (Paiement)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p><strong>Banque:</strong> Banking Circle S.A. - German Branch</p>
                                    <p><strong>Adresse:</strong> Maximilianstraße 54, 80538 München, Germany</p>
                                    <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                    <p><strong>SWIFT:</strong> SXPYDEHH</p>
                                </div>
                                <div className="space-y-1">
                                    <p><strong>Bénéficiaire:</strong> Yiwu Huanqiu Trading Co., Ltd.</p>
                                    <p><strong>Méthode:</strong> SEPA Instant / SCT</p>
                                    <p className="mt-2 italic text-primary font-bold">Référence: {quote.quoteNumber} - {quote.customerName}</p>
                                </div>
                            </div>
                        </div>

                        {quote.notes && (
                            <div className="mb-4">
                                <h3 className="font-semibold mb-1 text-xs leading-tight">Notes:</h3>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-tight">
                                    {quote.notes}
                                </p>
                            </div>
                        )}
                        
                        <div className="mb-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2 text-xs leading-tight">Termes de Paiement :</h3>
                            {quote.depositRequired ? (
                                <>
                                    <p className="text-xs text-muted-foreground space-y-1 leading-tight">
                                        Acompte ({quote.depositPercentage || 30}%): <strong>¥{(quote.totalAmount * ((quote.depositPercentage || 30) / 100)).toFixed(2)}</strong> (ou {currency.symbol}{(quote.totalAmount * ((quote.depositPercentage || 30) / 100) * quoteRate).toFixed(2)})
                                        <br />
                                        <span className="text-xs">Payable dans les 3 jours suivant la réception de cette proforma.</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground space-y-1 leading-tight mt-2">
                                        Solde restant ({100 - (quote.depositPercentage || 30)}%): <strong>¥{(quote.totalAmount * ((100 - (quote.depositPercentage || 30)) / 100)).toFixed(2)}</strong> (ou {currency.symbol}{(quote.totalAmount * ((100 - (quote.depositPercentage || 30)) / 100) * quoteRate).toFixed(2)})
                                        <br />
                                        <span className="text-xs">Payable après le contrôle qualité et avant le départ de l'usine.</span>
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground space-y-1 leading-tight">
                                    Paiement intégral de <strong>¥{quote.totalAmount.toFixed(2)}</strong> (ou {currency.symbol}{(quote.totalAmount * quoteRate).toFixed(2)}) payable avant l'expédition.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <PrintFooter />
            </div>
        </main>
    );
}
