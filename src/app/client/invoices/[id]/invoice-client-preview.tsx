
'use client';

import type { Invoice } from '@/actions/invoices';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft, CheckCircle2, Phone, Mail, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { getOrderById, type Order } from '@/actions/orders';

const WAREHOUSE_3PL_ADDRESS = "Entrepot GTC china";

export function InvoiceClientPreview({ invoice }: { invoice: Invoice }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const { user } = useUser();
    const db = useFirestore();
    const [order, setOrder] = useState<Order | null>(null);

    const is3PL = invoice.shippingAddress === WAREHOUSE_3PL_ADDRESS;

    const clientRef = useMemoFirebase(() => {
        if (!db || !user) return null;
        return doc(db, 'clients', user.uid);
    }, [db, user]);
    const { data: profile } = useDoc(clientRef);

    useEffect(() => {
        if (invoice.orderId) {
            getOrderById(invoice.orderId).then(setOrder);
        }
    }, [invoice.orderId]);

    const invoiceRate = invoice.exchangeRate || 0.13;
    const currencyPref = profile?.currencyPreference || 'EUR';

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;
        
        // FORCE BASE64 CONVERSION OF ALL IMAGES BEFORE CAPTURE
        const imgs = Array.from(element.getElementsByTagName('img'));
        const fetchPromises = imgs.map(async (img) => {
            if (img.src && !img.src.startsWith('data:')) {
                try {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            img.src = reader.result as string;
                            resolve(true);
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.error("PDF Image Convert Error:", e);
                }
            }
        });

        await Promise.all(fetchPromises);

        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
        const data = canvas.toDataURL('image/png');
        const pdf = new jspdf('p', 'mm', 'a4');
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
        pdf.save(`invoice-acquittee-${invoice.invoiceNumber}.pdf`);
    };

    if (!companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.logoDocument; 

    const subTotalCny = invoice.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const commissionRate = Number(invoice.commissionRate || order?.commissionRate || 0);
    const commissionCny = subTotalCny * (commissionRate / 100);
    const transportCny = Number(invoice.transportCost || order?.transportCost || 0);
    const totalFinalCny = subTotalCny + commissionCny + transportCny;

    const renderPrice = (cnyValue: number, isMain = false) => {
        const eurValue = cnyValue * invoiceRate;
        if (currencyPref === 'EUR') return `€${eurValue.toFixed(2)}`;
        if (currencyPref === 'CNY') return `¥${cnyValue.toFixed(2)}`;
        return (
            <div className="flex flex-col items-end">
                <span className={cn(isMain ? "font-black" : "")}>€${eurValue.toFixed(2)}</span>
                <span className="text-[9px] text-zinc-400 font-normal">¥${cnyValue.toFixed(2)}</span>
            </div>
        );
    };

    // CONFIDENTIALITY RULE: REMOVE YIWU IF 3PL SELECTED
    const cleanCompanyAddress = is3PL 
        ? companyInfo.address.replace(/Yiwu/gi, '').replace(/义乌/g, '').replace(/,,/g, ',').trim()
        : companyInfo.address;

    const beneficiaryName = is3PL ? "Huanqiu Trading Co., Ltd." : "Yiwu Huanqiu Trading Co., Ltd.";
    
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
                    <div className="absolute top-32 right-16 border-4 border-green-500 rounded-xl px-6 py-2 rotate-[-15deg] opacity-30 z-0">
                        <span className="text-4xl font-black text-green-500 uppercase">PAYÉ</span>
                    </div>

                    <div className="flex-grow relative z-10">
                        <header className="w-full flex justify-between items-start pt-2 pb-4 border-b-2 border-zinc-100">
                            <div>
                                {displayLogo && (
                                    <img src={displayLogo} alt="Logo" className="h-14 w-auto object-contain block" />
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-xl font-black text-zinc-900 tracking-tighter uppercase">Facture Acquittée</h1>
                                <p className="mt-0.5 text-xs font-bold text-primary">N° {invoice.invoiceNumber}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Date: {format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-8 my-6 text-xs">
                            <div>
                                <h3 className="font-black text-[9px] uppercase text-muted-foreground mb-2 tracking-widest">ÉMIS PAR</h3>
                                <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-0.5 text-[10px]">{cleanCompanyAddress}</p>
                            </div>
                            <div>
                                <h3 className="font-black text-[9px] uppercase text-muted-foreground mb-2 tracking-widest">DESTINATAIRE</h3>
                                {profile?.companyName && <p className="font-bold text-zinc-900 uppercase">{profile.companyName}</p>}
                                <p className={cn("text-zinc-900", profile?.companyName ? "text-zinc-600 font-medium" : "font-bold")}>
                                    {profile?.firstName} {profile?.lastName}
                                </p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-0.5 text-[10px]">
                                    {invoice.shippingAddress || profile?.address || "Adresse de livraison habituelle"}
                                </p>
                                <div className="mt-2 space-y-0.5">
                                    {profile?.phone && <p className="text-zinc-500 text-[10px] flex items-center gap-1.5"><Phone className="h-2.5 w-2.5" /> {profile.phone}</p>}
                                    {profile?.email && <p className="text-zinc-500 text-[10px] flex items-center gap-1.5"><Mail className="h-2.5 w-2.5" /> {profile.email}</p>}
                                </div>
                            </div>
                        </section>
                        
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Cette facture est acquittée. Le montant total a été perçu par nos services.</span>
                        </div>

                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="text-left bg-zinc-900 text-white">
                                    <th className="p-2 font-bold border-none first:rounded-l-md">Image</th>
                                    <th className="p-2 font-bold border-none">Description</th>
                                    <th className="p-2 text-center font-bold border-none">Qté</th>
                                    <th className="p-2 text-right font-bold border-none">Prix Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                    <th className="p-2 text-right font-bold border-none last:rounded-r-md">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {invoice.items.map((item, idx) => {
                                    const displayImage = item.photo;
                                    return (
                                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="p-2 text-center">
                                                <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                                    {displayImage ? (
                                                        <img src={displayImage} alt="Product" className="max-w-full max-h-full object-contain rounded border shadow-sm" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded border bg-zinc-50 flex items-center justify-center text-zinc-300">
                                                            <Package className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <p className="font-bold text-zinc-900 text-[11px]">{item.description}</p>
                                                {item.sku && <p className="text-[9px] font-mono text-muted-foreground">{item.sku}</p>}
                                            </td>
                                            <td className="p-2 text-center font-medium">{item.quantity}</td>
                                            <td className="p-2 text-right font-medium">{renderPrice(item.unitPrice)}</td>
                                            <td className="p-2 text-right font-bold text-zinc-900">{renderPrice(Number(item.quantity) * Number(item.unitPrice))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end pt-6">
                            <div className="w-full max-w-[250px] space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-muted-foreground font-medium">Sous-total articles</span>
                                    <span className="font-bold">{renderPrice(subTotalCny)}</span>
                                </div>
                                {commissionRate > 0 && (
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Commission ({commissionRate}%)</span>
                                        <span className="font-bold">{renderPrice(commissionCny)}</span>
                                    </div>
                                )}
                                {transportCny > 0 && (
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium flex items-center gap-1"><Truck className="h-3 w-3"/> Frais de port</span>
                                        <span className="font-bold">{renderPrice(transportCny)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t-2 border-zinc-900">
                                    <span className="font-black text-zinc-900 uppercase text-[11px]">Montant Total Réglé</span>
                                    <span className="text-lg font-black text-green-600">{renderPrice(totalFinalCny, true)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <h3 className="font-black text-[9px] uppercase text-zinc-400 mb-2 tracking-widest text-center">Coordonnées Bancaires</h3>
                            <div className="grid grid-cols-2 gap-6 text-[10px] text-zinc-600">
                                <div>
                                    <p><strong>Banque:</strong> Banking Circle S.A.</p>
                                    <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                    <p><strong>SWIFT:</strong> SXPYDEHH</p>
                                </div>
                                <div>
                                    <p><strong>Bénéficiaire:</strong> {beneficiaryName}</p>
                                    <p className="mt-2 italic text-primary font-bold">Réf: {invoice.invoiceNumber}</p>
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
