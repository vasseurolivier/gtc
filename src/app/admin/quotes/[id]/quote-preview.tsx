'use client';

import type { Quote } from '@/actions/quotes';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from "@/lib/utils"

export function QuotePreview({ quote, customer, products }: { quote: Quote, customer: any, products: any[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;

        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            logging: false,
            allowTaint: true
        });
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.logo;
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    const quoteRate = quote.exchangeRate || currencyContext.exchangeRate || 0.13;
    const currencyPref = customer?.currencyPreference || 'BOTH';

    const renderPrice = (cnyValue: number, isMain = false) => {
        const eurValue = cnyValue * quoteRate;
        if (currencyPref === 'EUR') return `€${eurValue.toFixed(2)}`;
        if (currencyPref === 'CNY') return `¥${cnyValue.toFixed(2)}`;
        return (
            <div className="flex flex-col items-end">
                <span className={cn(isMain ? "font-black" : "")}>€${eurValue.toFixed(2)}</span>
                <span className="text-[10px] text-zinc-400 font-normal">¥${cnyValue.toFixed(2)}</span>
            </div>
        );
    };

    const commissionCny = quote.subTotal * ((quote.commissionRate || 0) / 100);
    const transportCny = quote.transportCost || 0;

    const itemChunks = [];
    for (let i = 0; i < quote.items.length; i += 10) {
      itemChunks.push(quote.items.slice(i, i + 10));
    }

    const companyName = customer.companyName || customer.company || '';
    const contactName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : (customer.name || 'Client');

    return (
        <main id="invoice-preview" className="w-full mx-auto bg-white">
            <div className="p-8 flex justify-end no-print">
                <Button onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" /> Exporter en PDF
                </Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-24">
                <div className="flex-grow">
                    <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                        <div>
                            {displayLogo && <img src={displayLogo} alt="Logo" className="h-12 w-auto object-contain block" />}
                        </div>
                        <div className="text-right w-1/3">
                            <h1 className="text-base font-bold text-black uppercase leading-tight">Proforma</h1>
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
                                {companyName && <p className="font-bold uppercase leading-tight">{companyName}</p>}
                                <p className={cn("leading-tight", companyName ? "text-muted-foreground" : "font-bold")}>{contactName}</p>
                                <p className="whitespace-pre-wrap leading-tight mt-1">{quote.shippingAddress || customer?.address}</p>
                                <div className="mt-2 space-y-0.5">
                                    {customer?.phone && <p className="flex items-center gap-1 text-[10px]"><Phone className="h-2.5 w-2.5" /> {customer.phone}</p>}
                                    {customer?.email && <p className="flex items-center gap-1 text-[10px]"><Mail className="h-2.5 w-2.5" /> {customer.email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">DATE</h3>
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
                                <th className="text-right p-2 font-bold border">Qté</th>
                                <th className="text-right p-2 font-bold border">Prix Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                <th className="text-right p-2 font-bold border">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
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
                                                    <img src={product.imageUrl} alt={item.description} width={48} height={48} className="object-contain"/>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-1 align-top border">
                                            <p className="font-medium leading-tight">{product?.name || item.description}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
                                        </td>
                                        <td className="p-1 align-top text-right leading-tight border">{item.quantity}</td>
                                        <td className="p-1 align-top text-right leading-tight border">
                                            {renderPrice(item.unitPrice)}
                                        </td>
                                        <td className="p-1 align-top text-right font-medium leading-tight border">
                                            {renderPrice(item.total)}
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
                                    <span className="text-right">{renderPrice(quote.subTotal)}</span>
                                </div>
                                
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Commission ({quote.commissionRate || 0}%) :</span>
                                    <span className="text-right">{renderPrice(commissionCny)}</span>
                                </div>
                                
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Frais de port :</span>
                                    <span className="text-right">{renderPrice(transportCny)}</span>
                                </div>

                                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t-2 border-black">
                                    <span>TOTAL :</span>
                                    <span className="text-right">{renderPrice(quote.totalAmount, true)}</span>
                                </div>
                            </div>
                        </div>

                    <div className="mt-8 pt-4">
                        <div className="p-4 bg-zinc-50 rounded-lg border text-xs mb-4">
                            <h3 className="font-bold mb-2 uppercase">COORDONNÉES BANCAIRES</h3>
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
                                    <p className="mt-2 italic text-primary font-bold">Ref: {quote.quoteNumber} - {quote.customerName}</p>
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
                            <h3 className="font-semibold mb-2 text-xs leading-tight">Conditions :</h3>
                            {quote.depositRequired ? (
                                <>
                                    <p className="text-xs text-muted-foreground space-y-1 leading-tight">
                                        Acompte ({quote.depositPercentage || 30}%): <strong>{renderPrice(quote.totalAmount * ((quote.depositPercentage || 30) / 100))}</strong>
                                        <br />
                                        <span className="text-xs">Payable sous 3 jours.</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground space-y-1 leading-tight mt-2">
                                        Solde ({100 - (quote.depositPercentage || 30)}%): <strong>{renderPrice(quote.totalAmount * ((100 - (quote.depositPercentage || 30)) / 100))}</strong>
                                        <br />
                                        <span className="text-xs">Payable après contrôle qualité et avant expédition.</span>
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground space-y-1 leading-tight">
                                    Paiement intégral avant expédition.
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