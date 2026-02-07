'use client';

import type { Quote } from '@/actions/quotes';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft, Phone, Mail, Package } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function QuoteClientPreview({ quote, products = [] }: { quote: Quote, products?: any[] }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const { user } = useUser();
    const db = useFirestore();

    const clientRef = useMemoFirebase(() => {
        if (!db || !user) return null;
        return doc(db, 'clients', user.uid);
    }, [db, user]);
    const { data: profile } = useDoc(clientRef);

    const quoteRate = quote.exchangeRate || 0.13;
    const currencyPref = profile?.currencyPreference || 'EUR';
    const productsBySku = new Map(products.map(p => [p.sku, p]));

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

    if (!companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.logo;

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

    const commissionCny = quote.subTotal * (quote.commissionRate || 0) / 100;
    const transportCny = quote.transportCost || 0;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/client/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Link>
                </Button>
                <Button size="sm" onClick={handleDownloadPdf} className="bg-primary hover:bg-primary/90 text-white font-bold">
                    <Download className="mr-2 h-4 w-4" /> Télécharger en PDF
                </Button>
            </div>
            
            <main className="w-full mx-auto bg-white border shadow-xl rounded-xl overflow-hidden" id="invoice-preview">
                <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-20">
                    <div className="flex-grow">
                        <header className="w-full flex justify-between items-start pt-2 pb-4 border-b-2 border-zinc-100">
                            <div>
                                {displayLogo && (
                                    <img src={displayLogo} alt="Logo" crossOrigin="anonymous" className="h-14 w-auto object-contain block" />
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-xl font-black text-zinc-900 tracking-tighter">PROFORMA</h1>
                                <p className="mt-0.5 text-xs font-bold text-primary">N° {quote.quoteNumber}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Date: {format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-8 my-6 text-xs">
                            <div>
                                <h3 className="font-black text-[9px] uppercase text-muted-foreground mb-2 tracking-widest">ÉMIS PAR</h3>
                                <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-0.5 text-[10px]">{companyInfo?.address}</p>
                            </div>
                            <div>
                                <h3 className="font-black text-[9px] uppercase text-muted-foreground mb-2 tracking-widest">DESTINATAIRE</h3>
                                {profile?.companyName && <p className="font-bold text-zinc-900 uppercase">{profile.companyName}</p>}
                                <p className={cn("text-zinc-900", profile?.companyName ? "text-zinc-600 font-medium" : "font-bold")}>
                                    {profile?.firstName} {profile?.lastName}
                                </p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-0.5 text-[10px]">{quote.shippingAddress || profile?.address || "Adresse de livraison standard"}</p>
                                <div className="mt-2 space-y-0.5">
                                    {profile?.phone && <p className="text-zinc-500 text-[10px] flex items-center gap-1.5"><Phone className="h-2.5 w-2.5" /> {profile.phone}</p>}
                                    {profile?.email && <p className="text-zinc-500 text-[10px] flex items-center gap-1.5"><Mail className="h-2.5 w-2.5" /> {profile.email}</p>}
                                </div>
                            </div>
                        </section>
                        
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="text-left bg-zinc-100 text-zinc-900">
                                    <th className="p-2 font-bold border-none first:rounded-l-md">Image</th>
                                    <th className="p-2 font-bold border-none">Description des articles</th>
                                    <th className="p-2 text-center font-bold border-none">Qté</th>
                                    <th className="p-2 text-right font-bold border-none">Prix Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                    <th className="p-2 text-right font-bold border-none last:rounded-r-md">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {quote.items.map((item, idx) => {
                                    const catalogProduct = item.sku ? productsBySku.get(item.sku) : undefined;
                                    const displayImage = item.photo || catalogProduct?.imageUrl;

                                    return (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                {displayImage ? (
                                                    <div className="relative w-8 h-8 rounded border bg-white overflow-hidden shadow-sm">
                                                        <img src={displayImage} alt={item.description} crossOrigin="anonymous" className="object-contain w-full h-full" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded border bg-zinc-50 flex items-center justify-center text-zinc-300">
                                                        <Package className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 font-medium text-zinc-900">
                                                <p className="font-bold text-[11px]">{catalogProduct?.name || item.description}</p>
                                                <p className="text-[9px] text-muted-foreground mt-0.5">{item.description}</p>
                                                {item.sku && <p className="text-[9px] font-mono text-zinc-400">{item.sku}</p>}
                                            </td>
                                            <td className="p-2 text-center font-medium">{item.quantity}</td>
                                            <td className="p-2 text-right font-medium">{renderPrice(item.unitPrice)}</td>
                                            <td className="p-2 text-right font-bold text-zinc-900">{renderPrice(item.total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end pt-6">
                            <div className="w-full max-w-[250px] space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-muted-foreground font-medium">Sous-total</span>
                                    <span className="font-bold">{renderPrice(quote.subTotal)}</span>
                                </div>
                                {(quote.commissionRate || 0) > 0 && (
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Commission ({quote.commissionRate}%)</span>
                                        <span className="font-bold">{renderPrice(commissionCny)}</span>
                                    </div>
                                )}
                                {transportCny > 0 && (
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Frais de port</span>
                                        <span className="font-bold">{renderPrice(transportCny)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t-2 border-zinc-900">
                                    <span className="font-black text-zinc-900 uppercase text-[11px]">Total Estimé</span>
                                    <span className="text-lg font-black text-primary">{renderPrice(quote.totalAmount, true)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 border-t pt-6">
                            <h3 className="font-black text-[9px] uppercase text-zinc-400 mb-3 tracking-widest">Conditions de Règlement</h3>
                            <div className="text-[10px] text-zinc-600 space-y-4">
                                {quote.depositRequired ? (
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="font-bold text-primary mb-0.5">
                                            Acompte à la commande ({quote.depositPercentage}%): {renderPrice(quote.totalAmount * (quote.depositPercentage || 30) / 100)}
                                        </p>
                                        <p>Le solde restant est payable après le contrôle qualité (AQL) et avant l'expédition.</p>
                                    </div>
                                ) : (
                                    <p className="font-bold text-primary">Paiement intégral de {renderPrice(quote.totalAmount)} à réception de la proforma.</p>
                                )}
                                
                                <div className="grid grid-cols-2 gap-6 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <div className="space-y-0.5">
                                        <p><span className="font-bold text-zinc-900 text-[9px] uppercase block mb-1">Détails de la Banque</span></p>
                                        <p><span className="font-semibold text-zinc-900">Banque:</span> Banking Circle S.A.</p>
                                        <p><span className="font-semibold text-zinc-900">IBAN:</span> DE24 2022 0800 0056 1684 61</p>
                                        <p><span className="font-semibold text-zinc-900">SWIFT:</span> SXPYDEHH</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p><span className="font-bold text-zinc-900 text-[9px] uppercase block mb-1">Bénéficiaire</span></p>
                                        <p><span className="font-semibold text-zinc-900">Nom:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
                                        <p className="mt-2 italic text-primary font-black text-[11px]">Ref: {quote.quoteNumber} - {quote.customerName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <PrintFooter />
                </div>
            </main>
        </div>
    );
}
