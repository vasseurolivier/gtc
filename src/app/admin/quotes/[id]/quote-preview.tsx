
'use client';

import type { Quote } from '@/actions/quotes';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer, Phone, Mail, Package, Truck } from 'lucide-react';
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
        
        pdf.save(`proforma-${quote.quoteNumber}.pdf`);
    };

    if (!currencyContext || !companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return (
             <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.logoDocument; 
    const productsBySku = new Map(products.map(p => [p.sku, p]));
    
    const quoteRate = quote.exchangeRate || currencyContext.exchangeRate || 0.13;
    const currencyPref = customer?.currencyPreference || 'BOTH';

    const calculatedSubTotalCny = quote.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const commissionRate = Number(quote.commissionRate) || 0;
    const commissionCny = calculatedSubTotalCny * (commissionRate / 100);
    const transportCny = Number(quote.transportCost) || 0;
    const totalFinalCny = calculatedSubTotalCny + commissionCny + transportCny;

    const renderPrice = (cnyValue: number, isMain = false) => {
        const eurValue = cnyValue * quoteRate;
        if (currencyPref === 'EUR') return `€${eurValue.toFixed(2)}`;
        if (currencyPref === 'CNY') return `¥${cnyValue.toFixed(2)}`;
        return (
            <div className="flex flex-col items-end">
                <span className={cn(isMain ? "font-black" : "")}>€${eurValue.toFixed(2)}</span>
                <span className="text-[9px] text-zinc-400 font-normal">¥${cnyValue.toFixed(2)}</span>
            </div>
        );
    };

    const companyName = customer.companyName || customer.company || '';
    const contactName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : (customer.name || 'Client');

    return (
        <main id="invoice-preview" className="w-full mx-auto bg-white">
            <div className="p-4 flex justify-end no-print">
                <Button size="sm" onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" /> Exporter en PDF
                </Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-20">
                <div className="flex-grow">
                    <header className="w-full flex justify-between items-start pt-2 pb-4 border-b">
                        <div>
                            {displayLogo && <img src={displayLogo} alt="Logo" className="h-14 w-auto object-contain block" crossOrigin="anonymous" />}
                        </div>
                        <div className="text-right">
                            <h1 className="text-lg font-black text-black uppercase leading-tight">Proforma</h1>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-tight">N° {quote.quoteNumber}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-6 text-xs">
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">ÉMIS PAR</h3>
                            <p className="font-bold leading-tight">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap leading-tight text-[10px]">{companyInfo?.address}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">FACTURÉ À</h3>
                            {companyName && <p className="font-bold uppercase leading-tight">{companyName}</p>}
                            <p className={cn("leading-tight", companyName ? "text-muted-foreground" : "font-bold")}>{contactName}</p>
                            <p className="whitespace-pre-wrap leading-tight mt-1 text-[10px]">{quote.shippingAddress || customer?.address}</p>
                            <div className="mt-2 space-y-0.5 text-[10px]">
                                {customer?.phone && <p className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {customer.phone}</p>}
                                {customer?.email && <p className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {customer.email}</p>}
                            </div>
                        </div>
                    </section>

                    <div className="my-2 text-[10px] flex gap-8">
                        <div><span className="text-muted-foreground font-semibold">DATE:</span> {format(new Date(quote.issueDate), 'dd/MM/yyyy')}</div>
                        <div><span className="text-muted-foreground font-semibold">VALABLE JUSQU'AU:</span> {format(new Date(quote.validUntil), 'dd/MM/yyyy')}</div>
                    </div>
                    
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="text-left bg-zinc-100 text-zinc-900">
                                <th className="p-2 font-bold border">Image</th>
                                <th className="w-1/2 p-2 font-bold border">Description</th>
                                <th className="text-right p-2 font-bold border">Qté</th>
                                <th className="text-right p-2 font-bold border">Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                <th className="text-right p-2 font-bold border">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                            </tr>
                        </thead>
                        <tbody>
                        {quote.items.map((item, itemIndex) => {
                            const catalogProduct = item.sku ? productsBySku.get(item.sku) : undefined;
                            const displayImage = item.photo || catalogProduct?.imageUrl;
                            
                            return (
                                <tr key={itemIndex} className="border-b">
                                    <td className="p-1 align-top border text-center">
                                        <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                            {displayImage ? (
                                                <img src={displayImage} alt="Product" className="max-w-full max-h-full object-contain rounded border shadow-sm" crossOrigin="anonymous" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-zinc-50 flex items-center justify-center border text-zinc-300">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-1 align-top border">
                                        <p className="font-bold text-[11px] leading-tight">{catalogProduct?.name || item.description}</p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">{item.description}</p>
                                    </td>
                                    <td className="p-1 align-top text-center border">{item.quantity}</td>
                                    <td className="p-1 align-top text-right border">
                                        {renderPrice(item.unitPrice)}
                                    </td>
                                    <td className="p-1 align-top text-right font-bold border">
                                        {renderPrice(Number(item.quantity) * Number(item.unitPrice))}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    
                    <div className="flex justify-end pt-6">
                        <div className="w-full max-w-[250px] space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Sous-total articles :</span>
                                <span className="font-bold">{renderPrice(calculatedSubTotalCny)}</span>
                            </div>
                            
                            {commissionRate > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Commission ({commissionRate}%) :</span>
                                    <span className="font-bold">{renderPrice(commissionCny)}</span>
                                </div>
                            )}
                            
                            {transportCny > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium flex items-center gap-1"><Truck className="h-3 w-3" /> Frais de port :</span>
                                    <span className="font-bold">{renderPrice(transportCny)}</span>
                                </div>
                            )}

                            <div className="flex justify-between font-black text-sm mt-2 pt-2 border-t-2 border-black">
                                <span>TOTAL :</span>
                                <span className="text-right text-primary">{renderPrice(totalFinalCny, true)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4">
                        <div className="p-4 bg-zinc-50 rounded-lg border text-[10px] mb-4">
                            <h3 className="font-bold mb-2 uppercase">COORDONNÉES BANCAIRES</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <p><strong>Banque:</strong> Banking Circle S.A. - German Branch</p>
                                    <p><strong>Adresse:</strong> Maximilianstraße 54, 80538 München, Germany</p>
                                    <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                    <p><strong>SWIFT:</strong> SXPYDEHH</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p><strong>Bénéficiaire:</strong> Yiwu Huanqiu Trading Co., Ltd.</p>
                                    <p><strong>Méthode:</strong> SEPA Instant / SCT</p>
                                    <p className="mt-2 italic text-primary font-black text-[11px]">Ref: {quote.quoteNumber} - {quote.customerName}</p>
                                </div>
                            </div>
                        </div>

                        {quote.notes && (
                            <div className="mb-4">
                                <h3 className="font-semibold mb-1 text-[10px] leading-tight">Notes:</h3>
                                <p className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-tight">
                                    {quote.notes}
                                </p>
                            </div>
                        )}
                        
                        <div className="mb-4 pt-2 border-t text-[10px]">
                            <h3 className="font-semibold mb-1 uppercase tracking-widest text-[9px] text-zinc-400">Conditions :</h3>
                            {quote.depositRequired ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-muted-foreground leading-tight">
                                        Acompte ({quote.depositPercentage || 30}%): <strong>{renderPrice(totalFinalCny * ((quote.depositPercentage || 30) / 100))}</strong>
                                        <br />Payable sous 3 jours.
                                    </p>
                                    <p className="text-muted-foreground leading-tight">
                                        Solde ({100 - (quote.depositPercentage || 30)}%): <strong>{renderPrice(totalFinalCny * ((100 - (quote.depositPercentage || 30)) / 100))}</strong>
                                        <br />Payable après contrôle qualité (AQL).
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground leading-tight">
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
