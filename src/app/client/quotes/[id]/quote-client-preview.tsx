'use client';

import type { Quote } from '@/actions/quotes';
import { updateQuoteStatus } from '@/actions/quotes';
import { useContext, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft, Phone, Mail, Package, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function QuoteClientPreview({ quote, products = [] }: { quote: Quote, products?: any[] }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const { user } = useUser();
    const db = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

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

    const handleAcceptQuote = async () => {
        if (!isTermsAccepted) return;
        setIsAccepting(true);
        try {
            const result = await updateQuoteStatus(quote.id, 'accepted');
            if (result.success) {
                toast({ 
                    title: "Proforma Acceptée !", 
                    description: "Votre commande est désormais validée. Nous allons préparer votre facture." 
                });
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Erreur", description: result.message });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur système", description: "Impossible de valider le devis." });
        } finally {
            setIsAccepting(false);
        }
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
        <div className="space-y-6">
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
            
            {/* Validation Module for Client (Placed above for visibility if sent) */}
            <div className="no-print">
                {quote.status === 'sent' ? (
                    <Card className="border-2 border-primary bg-primary/5 shadow-2xl overflow-hidden mb-8">
                        <CardContent className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center gap-3 text-primary">
                                <ShieldCheck className="h-8 w-8" />
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Validation du Devis</h3>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl border border-primary/10 text-xs text-zinc-600 leading-relaxed space-y-3 shadow-inner">
                                <p className="font-bold text-zinc-900">En validant cette Proforma Invoice (PI), vous reconnaissez et acceptez :</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>L'exactitude des spécifications techniques et quantités listées ci-dessus.</li>
                                    <li>L'engagement de paiement de l'acompte de {(quote.depositPercentage || 30)}% sous 3 jours ouvrés.</li>
                                    <li>Que les délais de production débutent à réception du paiement de l'acompte.</li>
                                    <li>Les conditions de transport et d'incoterms spécifiés sur ce document.</li>
                                </ul>
                            </div>

                            <div className="flex items-start gap-3 p-2">
                                <Checkbox 
                                    id="terms" 
                                    checked={isTermsAccepted} 
                                    onCheckedChange={(checked) => setIsTermsAccepted(checked as boolean)}
                                    className="mt-1 border-primary h-5 w-5 data-[state=checked]:bg-primary"
                                />
                                <label 
                                    htmlFor="terms" 
                                    className="text-sm font-bold text-zinc-800 cursor-pointer leading-tight"
                                >
                                    Je confirme avoir relu le devis et j'accepte les conditions de vente de Global Trading China pour cette commande.
                                </label>
                            </div>

                            <Button 
                                onClick={handleAcceptQuote}
                                disabled={!isTermsAccepted || isAccepting}
                                className="w-full h-16 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                {isAccepting ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>ACCEPTER ET VALIDER LA COMMANDE</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (quote.status === 'accepted' || quote.status === 'paid') && (
                    <div className="p-6 bg-green-50 border-2 border-green-100 rounded-2xl flex items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3 text-green-700">
                            <CheckCircle2 className="h-8 w-8" />
                            <div>
                                <p className="font-black uppercase text-sm">Devis Validé</p>
                                <p className="text-xs opacity-80 font-medium">Ce document a été signé électroniquement et votre commande est en cours.</p>
                            </div>
                        </div>
                        <Badge className="bg-green-500 h-8 px-4 font-black">STATUT: {quote.status.toUpperCase()}</Badge>
                    </div>
                )}
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
                                <h1 className="text-xl font-black text-zinc-900 tracking-tighter uppercase">Proforma</h1>
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
