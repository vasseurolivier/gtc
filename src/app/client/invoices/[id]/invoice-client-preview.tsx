'use client';

import type { Invoice } from '@/actions/invoices';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft, CheckCircle2, Phone, Mail, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
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
            <div className="flex flex-col items-end leading-none">
                <span className={cn(isMain ? "font-black text-[8px]" : "font-bold text-[7px]")}>€${eurValue.toFixed(2)}</span>
                <span className="text-[6px] text-zinc-400 font-normal">¥${cnyValue.toFixed(2)}</span>
            </div>
        );
    };

    const cleanCompanyAddress = is3PL 
        ? companyInfo.address.replace(/Yiwu/gi, '').replace(/义乌/g, '').replace(/,,/g, ',').trim()
        : companyInfo.address;

    const beneficiaryName = "Yiwu Huanqiu Trading Co., Ltd.";
    
    return (
        <div className="space-y-4">
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
            
            <main className="w-full mx-auto bg-white border shadow-xl rounded-xl overflow-hidden" id="invoice-preview">
                <div id="pdf-content" className="relative p-4 bg-white min-h-[297mm] pb-12">
                    <div className="absolute top-24 right-12 border-2 border-green-500 rounded-lg px-4 py-1 rotate-[-15deg] opacity-20 z-0">
                        <span className="text-xl font-black text-green-500 uppercase">PAYÉ</span>
                    </div>

                    <div className="flex-grow relative z-10">
                        <header className="w-full flex justify-between items-start pb-1 border-b">
                            <div>
                                {displayLogo && (
                                    <img src={displayLogo} alt="Logo" className="h-8 w-auto object-contain block" />
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-[10px] font-black text-zinc-900 tracking-tighter uppercase leading-tight">Facture Acquittée</h1>
                                <p className="text-[7px] font-bold text-primary">N° {invoice.invoiceNumber}</p>
                                <p className="text-[6px] text-muted-foreground mt-0.5">Date: {format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-4 my-2 text-[7px]">
                            <div>
                                <h3 className="font-bold text-zinc-400 mb-0.5 uppercase tracking-wider">ÉMIS PAR</h3>
                                <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                                <p className="text-zinc-500 leading-tight whitespace-pre-wrap mt-0.5 text-[6.5px]">{cleanCompanyAddress}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-400 mb-0.5 uppercase tracking-wider">DESTINATAIRE</h3>
                                {profile?.companyName && <p className="font-bold text-zinc-900 uppercase">{profile.companyName}</p>}
                                <p className={cn("text-zinc-900", profile?.companyName ? "text-zinc-500 font-medium" : "font-bold")}>
                                    {profile?.firstName} {profile?.lastName}
                                </p>
                                <p className="text-zinc-500 leading-tight whitespace-pre-wrap mt-0.5 text-[6.5px]">
                                    {invoice.shippingAddress || profile?.address || "Adresse standard"}
                                </p>
                                <div className="mt-1 space-y-0.5 text-[6.5px]">
                                    {profile?.phone && <div className="text-zinc-500 flex items-center gap-1"><Phone className="h-2 w-2" /> {profile.phone}</div>}
                                    {profile?.email && <div className="text-zinc-500 flex items-center gap-1"><Mail className="h-2 w-2" /> {profile.email}</div>}
                                </div>
                            </div>
                        </section>
                        
                        <div className="mb-1 p-1 bg-green-50 rounded border border-green-100 flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[6.5px] font-bold uppercase tracking-wide">Document officiel de confirmation de paiement.</span>
                        </div>

                        <table className="w-full text-[7px] border-collapse">
                            <thead>
                                <tr className="text-left bg-zinc-900 text-white">
                                    <th className="p-1 font-bold border-none first:rounded-l-md w-10">Image</th>
                                    <th className="p-1 font-bold border-none">Description</th>
                                    <th className="p-1 text-center font-bold border-none w-8">Qté</th>
                                    <th className="p-1 text-right font-bold border-none w-16">Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                    <th className="p-1 text-right font-bold border-none last:rounded-r-md w-20">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {invoice.items.map((item, idx) => {
                                    const displayImage = item.photo;
                                    return (
                                        <tr key={idx}>
                                            <td className="p-1 text-center">
                                                <div className="w-7 h-7 mx-auto flex items-center justify-center">
                                                    {displayImage ? (
                                                        <img src={displayImage} alt="Product" className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <Package className="h-3 w-3 text-zinc-200" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-1 font-medium text-zinc-900">
                                                <p className="font-bold text-[7.5px] leading-tight">{item.description}</p>
                                                {item.sku && <p className="text-[6px] text-zinc-400 font-mono">{item.sku}</p>}
                                            </td>
                                            <td className="p-1 text-center font-medium">{item.quantity}</td>
                                            <td className="p-1 text-right font-medium">{renderPrice(item.unitPrice)}</td>
                                            <td className="p-1 text-right font-bold text-zinc-900">{renderPrice(Number(item.quantity) * Number(item.unitPrice))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end pt-2">
                            <div className="w-full max-w-[160px] space-y-0.5 text-[7px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 font-medium">Articles</span>
                                    <span className="font-bold">{renderPrice(subTotalCny)}</span>
                                </div>
                                {commissionCny > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500 font-medium">Commission ({commissionRate}%)</span>
                                        <span className="font-bold">{renderPrice(commissionCny)}</span>
                                    </div>
                                )}
                                {transportCny > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-500 font-medium flex items-center gap-1"><Truck className="h-2 w-2"/> Port</span>
                                        <span className="font-bold">{renderPrice(transportCny)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-0.5 border-t-2 border-zinc-900">
                                    <span className="font-black text-zinc-900 uppercase text-[8px]">TOTAL RÉGLÉ</span>
                                    <span className="text-[9px] font-black text-green-600">{renderPrice(totalFinalCny, true)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-1.5 bg-zinc-50 rounded border border-zinc-100">
                            <h3 className="font-black text-[6.5px] uppercase text-zinc-400 mb-1 tracking-widest text-center">Coord. Bancaires</h3>
                            <div className="grid grid-cols-2 gap-4 text-[6.5px] text-zinc-600">
                                <div>
                                    <p><span className="font-bold">IBAN:</span> DE24 2022 0800 0056 1684 61</p>
                                    <p><span className="font-bold">SWIFT:</span> SXPYDEHH</p>
                                </div>
                                <div>
                                    <p><span className="font-bold">Bénéficiaire:</span> {beneficiaryName}</p>
                                    <p className="mt-0.5 italic text-primary font-bold">Réf: {invoice.invoiceNumber}</p>
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