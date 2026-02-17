'use client';

import type { Quote } from '@/actions/quotes';
import { updateQuoteStatus } from '@/actions/quotes';
import { useContext, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft, Phone, Mail, Package, CheckCircle2, ShieldCheck, FileCheck, Clock, Truck, XCircle } from 'lucide-react';
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

const WAREHOUSE_3PL_ADDRESS = "Entrepot GTC china";

export function QuoteClientPreview({ quote, products = [] }: { quote: Quote, products?: any[] }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const { user } = useUser();
    const db = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(quote.status);

    const is3PL = quote.shippingAddress === WAREHOUSE_3PL_ADDRESS;

    const clientRef = useMemoFirebase(() => {
        if (!db || !user) return null;
        return doc(db, 'clients', user.uid);
    }, [db, user]);
    const { data: profile } = useDoc(clientRef);

    const quoteRate = quote.exchangeRate || 0.13;
    const currencyPref = profile?.currencyPreference || 'EUR';

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

    const handleAcceptQuote = async () => {
        if (!isTermsAccepted || isAccepting) return;
        setIsAccepting(true);
        try {
            const result = await updateQuoteStatus(quote.id, 'accepted');
            if (result.success) {
                toast({ 
                    title: "Proforma Acceptée !", 
                    description: "Votre commande est désormais validée. Nous allons préparer votre facture." 
                });
                setCurrentStatus('accepted');
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

    const handleRejectQuote = async () => {
        if (isRejecting) return;
        setIsRejecting(true);
        try {
            const result = await updateQuoteStatus(quote.id, 'rejected');
            if (result.success) {
                toast({ 
                    title: "Devis Refusé", 
                    description: "Nous avons bien pris en compte votre refus. Un agent reviendra vers vous." 
                });
                setCurrentStatus('rejected');
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Erreur", description: result.message });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur système", description: "Impossible de refuser le devis." });
        } finally {
            setIsRejecting(false);
        }
    };

    if (!companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.logoDocument; 

    const calculatedSubTotalCny = quote.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    
    // Calcul EUR précis respectant les prix manuels EUR
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

    const cleanCompanyAddress = is3PL 
        ? companyInfo.address.replace(/Yiwu/gi, '').replace(/义乌/g, '').replace(/,,/g, ',').trim()
        : companyInfo.address;

    const beneficiaryName = "Yiwu Huanqiu Trading Co., Ltd.";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/client/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Link>
                </Button>
                <Button size="sm" onClick={handleDownloadPdf} className="bg-primary hover:bg-primary/90 text-white font-bold">
                    <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                </Button>
            </div>
            
            <div className="no-print">
                {currentStatus === 'sent' ? (
                    <Card className="border-4 border-primary bg-primary/5 shadow-2xl overflow-hidden mb-8">
                        <CardContent className="p-6 md:p-10 space-y-6">
                            <div className="flex items-center gap-4 text-primary">
                                <div className="h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center">
                                    <FileCheck className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Validation du Devis</h3>
                                    <p className="text-xs font-bold text-primary/70 mt-1 uppercase tracking-widest">Action requise pour lancer la production</p>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl border border-primary/10 text-sm text-zinc-600 leading-relaxed space-y-4 shadow-inner">
                                <div className="font-black text-zinc-900 text-base">En validant cette Proforma Invoice (PI), vous acceptez :</div>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>L'exactitude des spécifications techniques et des quantités listées.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>L'engagement de paiement de l'acompte de <strong>{quote.depositPercentage || 30}%</strong> sous 3 jours.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Les conditions de transport et d'incoterms spécifiés ci-dessous.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/50 rounded-xl border border-primary/5">
                                <Checkbox 
                                    id="terms-checkbox" 
                                    checked={isTermsAccepted} 
                                    onCheckedChange={(checked) => setIsTermsAccepted(checked as boolean)}
                                    className="mt-1 border-primary h-6 w-6 data-[state=checked]:bg-primary"
                                />
                                <label 
                                    htmlFor="terms-checkbox" 
                                    className="text-sm font-black text-zinc-800 cursor-pointer leading-snug select-none"
                                >
                                    Je confirme avoir relu le devis et j'accepte les conditions de vente de Global Trading China pour cette commande.
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    onClick={handleAcceptQuote}
                                    disabled={!isTermsAccepted || isAccepting || isRejecting}
                                    className={cn(
                                        "flex-grow h-16 text-xl font-black rounded-2xl shadow-xl transition-all active:scale-95",
                                        isTermsAccepted 
                                            ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" 
                                            : "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {isAccepting ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>ACCEPTER LE DEVIS</>
                                    )}
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={handleRejectQuote}
                                    disabled={isAccepting || isRejecting}
                                    className="h-16 px-8 text-sm font-bold rounded-2xl text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    {isRejecting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>REFUSER</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (currentStatus === 'accepted' || currentStatus === 'paid') ? (
                    <div className="p-8 bg-green-50 border-2 border-green-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-4 text-green-700 text-center md:text-left">
                            <div className="h-14 w-14 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="font-black uppercase text-xl leading-none">Devis Validé</p>
                                <p className="text-sm font-medium opacity-80 mt-1">Ce document a été signé électroniquement. Votre commande est en cours de traitement.</p>
                            </div>
                        </div>
                        <Badge className="bg-green-500 h-12 px-8 text-lg font-black rounded-xl">STATUT: {currentStatus.toUpperCase()}</Badge>
                    </div>
                ) : currentStatus === 'rejected' ? (
                    <div className="p-8 bg-red-50 border-2 border-green-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-4 text-red-700">
                            <div className="h-14 w-14 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0">
                                <XCircle className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="font-black uppercase text-xl leading-none">Devis Refusé</p>
                                <p className="text-sm font-medium opacity-80 mt-1">Vous avez refusé ce devis. Notre équipe vous recontactera prochainement.</p>
                            </div>
                        </div>
                        <Badge variant="destructive" className="h-12 px-8 text-lg font-black rounded-xl">REFUSÉ</Badge>
                    </div>
                ) : (
                    <div className="p-6 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center gap-4 mb-8 text-zinc-500">
                        <Clock className="h-6 w-6" />
                        <div className="text-sm font-bold">
                            Ce devis est en cours de préparation (Brouillon). Il ne peut pas encore être validé.
                        </div>
                    </div>
                )}
            </div>

            <main className="w-full mx-auto bg-white border shadow-xl rounded-xl overflow-hidden" id="invoice-preview">
                <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-12 text-[10px]">
                    <div className="flex-grow relative z-10">
                        <header className="w-full flex justify-between items-start pb-2 border-b">
                            <div>
                                {displayLogo && (
                                    <img src={displayLogo} alt="Logo" className="h-10 w-auto object-contain block" />
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-[14px] font-black text-zinc-900 tracking-tighter uppercase leading-tight">Proforma</h1>
                                <p className="text-[10px] font-bold text-primary leading-tight">N° {quote.quoteNumber}</p>
                                <p className="text-[8px] text-muted-foreground mt-1 leading-tight">Date: {format(new Date(quote.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-8 my-4 text-[10px]">
                            <div>
                                <h3 className="font-bold text-zinc-400 mb-1 uppercase tracking-wider">ÉMIS PAR</h3>
                                <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                                <p className="text-zinc-500 leading-tight whitespace-pre-wrap">{cleanCompanyAddress}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-400 mb-1 uppercase tracking-wider">DESTINATAIRE</h3>
                                {profile?.companyName && <p className="font-bold text-zinc-900 uppercase">{profile.companyName}</p>}
                                <div className={cn("text-zinc-900 leading-tight", profile?.companyName ? "text-zinc-500 font-medium" : "font-bold")}>
                                    {profile?.firstName} {profile?.lastName}
                                </div>
                                <p className="text-zinc-500 leading-tight whitespace-pre-wrap mt-1">{quote.shippingAddress || profile?.address || "Adresse de livraison standard"}</p>
                                <div className="mt-2 space-y-1 flex flex-col text-[9px]">
                                    {profile?.phone && <div className="text-zinc-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</div>}
                                    {profile?.email && <div className="text-zinc-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {profile.email}</div>}
                                </div>
                            </div>
                        </section>
                        
                        <table className="w-full text-[10px] border-collapse">
                            <thead>
                                <tr className="text-left bg-zinc-100 text-zinc-900">
                                    <th className="p-2 font-bold border-none first:rounded-l-md w-12">Image</th>
                                    <th className="p-2 font-bold border-none">Description des articles</th>
                                    <th className="p-2 text-center font-bold border-none w-10">Qté</th>
                                    <th className="p-2 text-right font-bold border-none w-24">Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                    <th className="p-2 text-right font-bold border-none last:rounded-r-md w-28">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {quote.items.map((item, idx) => {
                                    const displayImage = item.photo;
                                    const manualEur = (item as any).unitPriceEur || 0;
                                    const lineEur = manualEur > 0 ? manualEur * item.quantity : (item.unitPrice * item.quantity * quoteRate);
                                    return (
                                        <tr key={idx}>
                                            <td className="p-2 text-center">
                                                <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                                    {displayImage ? (
                                                        <img src={displayImage} alt="Product" className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <Package className="h-4 w-4 text-zinc-200" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 font-medium text-zinc-900">
                                                <p className="font-bold leading-tight">{item.description}</p>
                                                {item.sku && <p className="text-[8px] text-zinc-400 font-mono mt-1">{item.sku}</p>}
                                            </td>
                                            <td className="p-2 text-center font-medium">{item.quantity}</td>
                                            <td className="p-2 text-right font-medium">{renderPrice(item.unitPrice, manualEur || (item.unitPrice * quoteRate))}</td>
                                            <td className="p-2 text-right font-bold text-zinc-900">{renderPrice(Number(item.quantity) * Number(item.unitPrice), lineEur)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end pt-4">
                            <div className="w-full max-w-[220px] space-y-1 text-[10px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 font-medium">Sous-total articles</span>
                                    <span className="font-bold">{renderPrice(calculatedSubTotalCny, calculatedSubTotalEur)}</span>
                                </div>
                                {transportCny > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500 font-medium flex items-center gap-1"><Truck className="h-3 w-3" /> Port</span>
                                        <span className="font-bold">{renderPrice(transportCny, transportEur)}</span>
                                    </div>
                                )}
                                {commissionRate > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500 font-medium">Commission ({commissionRate}%)</span>
                                        <span className="font-bold">{renderPrice(commissionCny, commissionEur)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-1 border-t-2 border-zinc-900">
                                    <span className="font-black text-zinc-900 uppercase text-[11px]">TOTAL FINAL</span>
                                    <div className="text-[12px] font-black text-primary">{renderPrice(totalFinalCny, totalFinalEur, true)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-[10px] uppercase text-zinc-400 mb-2 tracking-widest">Conditions de Règlement</h3>
                            <div className="text-[10px] text-zinc-600 space-y-2">
                                {quote.depositRequired ? (
                                    <div className="p-3 bg-primary/5 rounded border border-primary/10">
                                        <div className="font-bold text-primary mb-1 uppercase">
                                            <div className="flex items-center gap-1">Acompte à la commande ({quote.depositPercentage || 30}%): {renderPrice(totalFinalCny * (quote.depositPercentage || 30) / 100, totalFinalEur * (quote.depositPercentage || 30) / 100)}</div>
                                        </div>
                                        <p>Le solde restant est payable après le contrôle qualité (AQL) et avant l'expédition.</p>
                                    </div>
                                ) : (
                                    <div className="font-bold text-primary flex items-center gap-1">Paiement intégral de {renderPrice(totalFinalCny, totalFinalEur)} à réception de la proforma.</div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-8 p-3 bg-zinc-50 rounded border border-zinc-100 mt-4">
                                    <div className="space-y-1">
                                        <p className="font-bold text-zinc-900 text-[9px] uppercase block mb-1 tracking-wider">Banque</p>
                                        <p>Banking Circle S.A.</p>
                                        <p><span className="font-semibold">IBAN:</span> DE24 2022 0800 0056 1684 61</p>
                                        <p><span className="font-semibold">SWIFT:</span> SXPYDEHH</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-zinc-900 text-[9px] uppercase block mb-1 tracking-wider">Bénéficiaire</p>
                                        <p>{beneficiaryName}</p>
                                        <p className="mt-1 italic text-primary font-bold text-[10px]">Ref: {quote.quoteNumber}</p>
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
