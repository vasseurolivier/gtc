'use client';

import type { Quote } from '@/actions/quotes';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function QuoteClientPreview({ quote }: { quote: Quote }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const { user } = useUser();
    const db = useFirestore();

    const clientRef = useMemoFirebase(() => {
        if (!db || !user) return null;
        return doc(db, 'clients', user.uid);
    }, [db, user]);
    const { data: profile } = useDoc(clientRef);

    const quoteRate = quote.exchangeRate || 0.13;

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
    const displayLogo = companyInfo.publicLogo || companyInfo.logo;
    const subTotalEuro = quote.subTotal * quoteRate;
    const commissionEuro = (quote.subTotal * (quote.commissionRate || 0) / 100) * quoteRate;
    const transportEuro = (quote.transportCost || 0) * quoteRate;
    const totalEuro = quote.totalAmount * quoteRate;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <Button variant="ghost" asChild>
                    <Link href="/client/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Link>
                </Button>
                <Button onClick={handleDownloadPdf} className="bg-primary hover:bg-primary/90 text-white font-bold">
                    <Download className="mr-2 h-4 w-4" /> Télécharger en PDF
                </Button>
            </div>
            
            <main className="w-full mx-auto bg-white border shadow-xl rounded-xl overflow-hidden" id="invoice-preview">
                <div id="pdf-content" className="relative p-12 bg-white min-h-[297mm] pb-24">
                    <div className="flex-grow">
                        <header className="w-full flex justify-between items-start pt-2 pb-6 border-b-2 border-zinc-100">
                            <div>
                                {displayLogo && (
                                    <img 
                                        src={displayLogo} 
                                        alt="Logo" 
                                        crossOrigin="anonymous" 
                                        className="h-20 w-auto object-contain block"
                                    />
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">PROFORMA</h1>
                                <p className="mt-1 text-sm font-bold text-primary">N° {quote.quoteNumber}</p>
                                <p className="text-xs text-muted-foreground mt-1">Date: {format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-12 my-10 text-sm">
                            <div>
                                <h3 className="font-black text-[10px] uppercase text-muted-foreground mb-3 tracking-widest">ÉMIS PAR</h3>
                                <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-1 text-xs">{companyInfo?.address}</p>
                            </div>
                            <div>
                                <h3 className="font-black text-[10px] uppercase text-muted-foreground mb-3 tracking-widest">DESTINATAIRE</h3>
                                {profile?.companyName && <p className="font-bold text-zinc-900 uppercase">{profile.companyName}</p>}
                                <p className={cn("text-zinc-900", profile?.companyName ? "text-zinc-600 font-medium" : "font-bold")}>
                                    {profile?.firstName} {profile?.lastName}
                                </p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-1 text-xs">{quote.shippingAddress || profile?.address || "Adresse de livraison standard"}</p>
                                <div className="mt-3 space-y-1">
                                    {profile?.phone && <p className="text-zinc-500 text-[11px] flex items-center gap-1.5"><Phone className="h-3 w-3" /> {profile.phone}</p>}
                                    {profile?.email && <p className="text-zinc-500 text-[11px] flex items-center gap-1.5"><Mail className="h-3 w-3" /> {profile.email}</p>}
                                </div>
                            </div>
                        </section>
                        
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left bg-zinc-100 text-zinc-900">
                                    <th className="p-4 font-bold border-none first:rounded-l-lg">Description des articles</th>
                                    <th className="p-4 text-center font-bold border-none">Qté</th>
                                    <th className="p-4 text-right font-bold border-none">Prix Unit. (€)</th>
                                    <th className="p-4 text-right font-bold border-none last:rounded-r-lg">Total (€)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {quote.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-4 font-medium text-zinc-900">{item.description}</td>
                                        <td className="p-4 text-center font-medium">{item.quantity}</td>
                                        <td className="p-4 text-right font-medium">€{(item.unitPrice * quoteRate).toFixed(2)}</td>
                                        <td className="p-4 text-right font-bold text-zinc-900">€{(item.total * quoteRate).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end pt-10">
                            <div className="w-full max-w-[300px] space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Sous-total</span>
                                    <span className="font-bold">€{subTotalEuro.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Commission ({quote.commissionRate}%)</span>
                                    <span className="font-bold">€{commissionEuro.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Frais de port</span>
                                    <span className="font-bold">€{transportEuro.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t-2 border-zinc-900">
                                    <span className="font-black text-zinc-900">TOTAL ESTIMÉ</span>
                                    <span className="text-2xl font-black text-primary">€{totalEuro.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 border-t pt-8">
                            <h3 className="font-black text-[10px] uppercase text-zinc-400 mb-4 tracking-widest">Conditions de Règlement & Coordonnées Bancaires</h3>
                            <div className="text-xs text-zinc-600 space-y-6">
                                {quote.depositRequired ? (
                                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                        <p className="font-bold text-primary mb-1">Acompte à la commande ({quote.depositPercentage}%): €{(totalEuro * (quote.depositPercentage || 30) / 100).toFixed(2)}</p>
                                        <p>Le solde restant est payable après le contrôle qualité (AQL) et avant l'expédition.</p>
                                    </div>
                                ) : (
                                    <p className="font-bold text-primary">Paiement intégral de {totalEuro.toFixed(2)}€ à réception de la proforma.</p>
                                )}
                                
                                <div className="grid grid-cols-2 gap-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className="space-y-1">
                                        <p><span className="font-bold text-zinc-900 text-[10px] uppercase block mb-1">Détails de la Banque</span></p>
                                        <p><span className="font-semibold text-zinc-900">Banque:</span> Banking Circle S.A. - German Branch</p>
                                        <p><span className="font-semibold text-zinc-900">Adresse:</span> Maximilianstraße 54, 80538 München, Germany</p>
                                        <p><span className="font-semibold text-zinc-900">IBAN:</span> DE24 2022 0800 0056 1684 61</p>
                                        <p><span className="font-semibold text-zinc-900">SWIFT:</span> SXPYDEHH</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p><span className="font-bold text-zinc-900 text-[10px] uppercase block mb-1">Bénéficiaire</span></p>
                                        <p><span className="font-semibold text-zinc-900">Nom:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
                                        <p><span className="font-semibold text-zinc-900">Méthode:</span> SEPA Instant / SCT</p>
                                        <p className="mt-4 italic text-primary font-black text-[12px]">Référence à inclure: {quote.quoteNumber} - {quote.customerName}</p>
                                    </div>
                                </div>
                                
                                <p className="italic text-[10px] text-zinc-400">Proforma valable jusqu'au {format(new Date(quote.validUntil), 'dd/MM/yyyy')}. Les prix sont fixés en Euro selon le taux de change verrouillé le jour de l'émission.</p>
                            </div>
                        </div>
                    </div>
                    <PrintFooter />
                </div>
            </main>
        </div>
    );
}
