'use client';

import type { Quote } from '@/actions/quotes';
import { getOrderById, Order } from '@/actions/orders';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer, Phone, Mail, Package, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from "@/lib/utils";

const WAREHOUSE_3PL_ADDRESS = "Entrepot GTC china";

export function QuotePreview({ quote, customer, products }: { quote: Quote, customer: any, products: any[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [order, setOrder] = useState<Order | null>(null);

    const is3PL = quote.shippingAddress === WAREHOUSE_3PL_ADDRESS;

    useEffect(() => {
        if (quote.orderId) {
            getOrderById(quote.orderId).then(setOrder);
        }
    }, [quote.orderId]);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;

        const imgs = Array.from(element.getElementsByTagName('img'));
        for (const img of imgs) {
            const originalSrc = img.src;
            if (originalSrc && !originalSrc.startsWith('data:')) {
                try {
                    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(originalSrc)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error('Proxy fetch failed');
                    const blob = await response.blob();
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    img.src = base64;
                    await new Promise((resolve) => {
                        if (img.complete) resolve(true);
                        else img.onload = () => resolve(true);
                    });
                } catch (e) {
                    console.error("PDF Proxy conversion failed", originalSrc);
                }
            }
        }

        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
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
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.logoDocument; 
    
    const quoteRate = quote.exchangeRate || currencyContext.exchangeRate || 0.13;
    const currencyPref = customer?.currencyPreference || 'BOTH';

    const calculatedSubTotalCny = quote.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    
    // Calcul précis du sous-total EUR en respectant les prix manuels EUR des articles
    const calculatedSubTotalEur = quote.items.reduce((sum, item) => {
        const manualEur = (item as any).unitPriceEur || 0;
        const lineEur = manualEur > 0 ? manualEur * item.quantity : (item.unitPrice * item.quantity * quoteRate);
        return sum + lineEur;
    }, 0);

    const transportCny = Number(quote.transportCost || 0);
    const transportEur = transportCny * quoteRate;

    const commissionRate = Number(quote.commissionRate || 0);
    const basis = quote.commissionBasis || 'products_only';

    let commissionCny = 0;
    let commissionEur = 0;
    if (basis === 'total') {
        commissionCny = (calculatedSubTotalCny + transportCny) * (commissionRate / 100);
        commissionEur = (calculatedSubTotalEur + transportEur) * (commissionRate / 100);
    } else {
        commissionCny = calculatedSubTotalCny * (commissionRate / 100);
        commissionEur = calculatedSubTotalEur * (commissionRate / 100);
    }

    const totalFinalCny = calculatedSubTotalCny + commissionCny + transportCny;
    const totalFinalEur = calculatedSubTotalEur + commissionEur + transportEur;

    const renderPrice = (cnyValue: number, eurValue: number, isMain = false) => {
        if (currencyPref === 'EUR') return `€${eurValue.toFixed(2)}`;
        if (currencyPref === 'CNY') return `¥${cnyValue.toFixed(2)}`;
        return (
            <div className="flex flex-col items-end leading-none">
                <span className={cn(isMain ? "font-black" : "font-bold")}>€{eurValue.toFixed(2)}</span>
                <span className="text-[8px] text-zinc-400 font-normal">¥{cnyValue.toFixed(2)}</span>
            </div>
        );
    };

    const companyName = customer.companyName || customer.company || '';
    const contactName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : (customer.name || 'Client');

    const cleanCompanyAddress = is3PL 
        ? companyInfo.address.replace(/Yiwu/gi, '').replace(/义乌/g, '').replace(/,,/g, ',').trim()
        : companyInfo.address;

    const beneficiaryName = "Yiwu Huanqiu Trading Co., Ltd.";

    return (
        <main id="invoice-preview" className="w-full mx-auto bg-white">
            <div className="p-4 flex justify-end no-print gap-2">
                <Badge variant={quote.status === 'accepted' || quote.status === 'paid' ? 'default' : 'outline'} className="mr-auto h-10 px-6 uppercase font-black tracking-widest text-sm">STATUT: {quote.status}</Badge>
                <Button size="sm" onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" /> Export PDF
                </Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-12 text-[10px]">
                {(quote.status === 'accepted' || quote.status === 'paid') && (
                    <div className="absolute top-24 right-12 border-2 border-green-500 rounded-lg px-6 py-2 rotate-[-15deg] opacity-20 z-0">
                        <span className="text-3xl font-black text-green-500 uppercase">VALIDÉ</span>
                    </div>
                )}

                <div className="flex-grow relative z-10">
                    <header className="w-full flex justify-between items-start pb-2 border-b">
                        <div>
                            {displayLogo && <img src={displayLogo} alt="Logo" className="h-10 w-auto object-contain block" />}
                        </div>
                        <div className="text-right">
                            <h1 className="text-sm font-black text-black uppercase leading-tight">Proforma Invoice</h1>
                            <p className="text-[10px] text-muted-foreground leading-tight">N° {quote.quoteNumber}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-4 text-[10px]">
                        <div>
                            <h3 className="font-bold text-zinc-400 mb-1 uppercase tracking-wider">ÉMIS PAR</h3>
                            <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap text-zinc-500 leading-tight">{cleanCompanyAddress}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-400 mb-1 uppercase tracking-wider">FACTURÉ À</h3>
                            {companyName && <p className="font-bold uppercase text-zinc-900">{companyName}</p>}
                            <div className={cn("leading-tight", companyName ? "text-zinc-500" : "font-bold text-zinc-900")}>{contactName}</div>
                            <p className="whitespace-pre-wrap mt-1 text-zinc-500 leading-tight">{quote.shippingAddress || customer?.address}</p>
                            <div className="mt-2 space-y-1 flex flex-col text-[9px]">
                                {customer?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>}
                                {customer?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</span>}
                            </div>
                        </div>
                    </section>

                    <div className="my-2 text-[10px] flex gap-6 border-y py-1">
                        <div><span className="text-zinc-400 font-bold uppercase">DATE:</span> {format(new Date(quote.issueDate), 'dd/MM/yyyy')}</div>
                        <div><span className="text-zinc-400 font-bold uppercase">VALABLE:</span> {format(new Date(quote.validUntil), 'dd/MM/yyyy')}</div>
                    </div>
                    
                    <table className="w-full text-[10px] border-collapse">
                        <thead>
                            <tr className="text-left bg-zinc-100 text-zinc-900">
                                <th className="p-2 font-bold border w-12">Image</th>
                                <th className="p-2 font-bold border">Description des articles</th>
                                <th className="p-2 text-center font-bold border w-10">Qté</th>
                                <th className="p-2 text-right font-bold border w-24">Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                <th className="p-2 text-right font-bold border w-28">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                            </tr>
                        </thead>
                        <tbody>
                        {quote.items.map((item, itemIndex) => {
                            const displayImage = item.photo;
                            const manualEur = (item as any).unitPriceEur || 0;
                            const lineEur = manualEur > 0 ? manualEur * item.quantity : (item.unitPrice * item.quantity * quoteRate);
                            return (
                                <tr key={itemIndex} className="border-b">
                                    <td className="p-1 align-top border text-center">
                                        <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                            {displayImage ? (
                                                <img src={displayImage} alt="Product" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <Package className="h-4 w-4 text-zinc-200" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2 align-top border">
                                        <p className="font-bold leading-tight">{item.description}</p>
                                        {item.sku && <p className="text-[8px] text-zinc-400 font-mono mt-1">{item.sku}</p>}
                                    </td>
                                    <td className="p-2 align-top text-center border">{item.quantity}</td>
                                    <td className="p-2 align-top text-right border">{renderPrice(item.unitPrice, manualEur || (item.unitPrice * quoteRate))}</td>
                                    <td className="p-2 align-top text-right font-bold border">{renderPrice(Number(item.quantity) * Number(item.unitPrice), lineEur)}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    
                    <div className="flex justify-end pt-4">
                        <div className="w-full max-w-[220px] space-y-1 text-[10px]">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Sous-total articles</span>
                                <span className="font-bold">{renderPrice(calculatedSubTotalCny, calculatedSubTotalEur)}</span>
                            </div>
                            {transportCny > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 flex items-center gap-1"><Truck className="h-3 w-3" /> Port</span>
                                    <span className="font-bold">{renderPrice(transportCny, transportEur)}</span>
                                </div>
                            )}
                            {commissionRate > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">Commission ({commissionRate}%)</span>
                                    <span className="font-bold">{renderPrice(commissionCny, commissionEur)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-1 border-t-2 border-zinc-900">
                                <span className="font-black text-zinc-900 uppercase text-[11px]">TOTAL FINAL</span>
                                <div className="text-[12px] font-black text-primary">{renderPrice(totalFinalCny, totalFinalEur, true)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="p-3 bg-zinc-50 rounded border text-[9px] mb-4">
                            <h3 className="font-bold mb-1 uppercase text-zinc-400">COORDONNÉES BANCAIRES</h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p><strong>Banque:</strong> Banking Circle S.A.</p>
                                    <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                    <p><strong>SWIFT:</strong> SXPYDEHH</p>
                                </div>
                                <div className="space-y-1">
                                    <p><strong>Bénéficiaire:</strong> {beneficiaryName}</p>
                                    <p className="mt-1 italic text-primary font-bold text-[10px]">Ref: {quote.quoteNumber}</p>
                                </div>
                            </div>
                        </div>

                        {quote.notes && (
                            <div className="mb-4">
                                <h3 className="font-bold mb-1 text-[9px] text-zinc-400 uppercase">Notes:</h3>
                                <p className="text-[9px] text-zinc-500 whitespace-pre-wrap leading-tight">{quote.notes}</p>
                            </div>
                        )}
                        
                        <div className="pt-2 border-t text-[9px]">
                            <h3 className="font-bold mb-1 uppercase text-zinc-400">Conditions :</h3>
                            {quote.depositRequired ? (
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="text-zinc-500 leading-tight">
                                        <div className="flex items-center gap-1">Acompte ({quote.depositPercentage || 30}%): <strong>{renderPrice(totalFinalCny * ((quote.depositPercentage || 30) / 100), totalFinalEur * ((quote.depositPercentage || 30) / 100))}</strong></div>
                                        <br />Payable sous 3 jours.
                                    </div>
                                    <div className="text-zinc-500 leading-tight">
                                        <div className="flex items-center gap-1">Solde ({100 - (quote.depositPercentage || 30)}%): <strong>{renderPrice(totalFinalCny * ((100 - (quote.depositPercentage || 30)) / 100), totalFinalEur * ((100 - (quote.depositPercentage || 30)) / 100))}</strong></div>
                                        <br />Payable après contrôle qualité (AQL).
                                    </div>
                                </div>
                            ) : (
                                <div className="text-zinc-500 leading-tight">Paiement intégral avant expédition.</div>
                            )}
                        </div>
                    </div>
                </div>
                <PrintFooter />
            </div>
        </main>
    );
}
