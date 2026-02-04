
'use client';

import type { Invoice } from '@/actions/invoices';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';

export function InvoiceClientPreview({ invoice }: { invoice: Invoice }) {
    const companyInfoContext = useContext(CompanyInfoContext);

    // Clients only see the Euro price frozen at creation
    const invoiceRate = invoice.exchangeRate || 0.13;

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
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
        pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    };

    if (!companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    const { companyInfo } = companyInfoContext;

    const subTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    
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
                                {companyInfo.logo && <img src={companyInfo.logo} alt="Logo" crossOrigin="anonymous" className="h-20 w-auto object-contain"/>}
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">FACTURE</h1>
                                <p className="mt-1 text-sm font-bold text-primary">N° {invoice.invoiceNumber}</p>
                                <p className="text-xs text-muted-foreground mt-1">Date: {format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</p>
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
                                <p className="font-bold text-zinc-900">{invoice.customerName}</p>
                                <p className="text-zinc-500 leading-relaxed whitespace-pre-wrap mt-1 text-xs">{invoice.shippingAddress || "Adresse de livraison habituelle"}</p>
                            </div>
                        </section>
                        
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left bg-zinc-900 text-white">
                                    <th className="p-4 font-bold border-none first:rounded-l-lg">Description</th>
                                    <th className="p-4 text-center font-bold border-none">Quantité</th>
                                    <th className="p-4 text-right font-bold border-none">Prix Unitaire (€)</th>
                                    <th className="p-4 text-right font-bold border-none last:rounded-r-lg">Total (€)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-zinc-900">{item.description}</p>
                                            {item.sku && <p className="text-[10px] font-mono text-muted-foreground mt-1">{item.sku}</p>}
                                        </td>
                                        <td className="p-4 text-center font-medium">{item.quantity}</td>
                                        <td className="p-4 text-right font-medium">€{(item.unitPrice * invoiceRate).toFixed(2)}</td>
                                        <td className="p-4 text-right font-bold text-zinc-900">€{(item.total * invoiceRate).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end pt-10">
                            <div className="w-full max-w-[300px] space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Sous-total</span>
                                    <span className="font-bold">€{(subTotal * invoiceRate).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t-2 border-zinc-900">
                                    <span className="font-black text-zinc-900">TOTAL À PAYER</span>
                                    <span className="text-2xl font-black text-primary">€{(invoice.totalAmount * invoiceRate).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <h3 className="font-black text-[10px] uppercase text-zinc-400 mb-4 tracking-widest">Informations de Paiement & Coordonnées Bancaires</h3>
                            <div className="grid grid-cols-2 gap-8 text-[11px] text-zinc-600 leading-relaxed">
                                <div className="space-y-1">
                                    <p><span className="font-bold text-zinc-900">Banque:</span> Banking Circle S.A. - German Branch</p>
                                    <p><span className="font-bold text-zinc-900">Adresse Banque:</span> Maximilianstraße 54, 80538 München, Germany</p>
                                    <p><span className="font-bold text-zinc-900">IBAN:</span> DE24 2022 0800 0056 1684 61</p>
                                    <p><span className="font-bold text-zinc-900">SWIFT Code:</span> SXPYDEHH</p>
                                </div>
                                <div className="space-y-1">
                                    <p><span className="font-bold text-zinc-900">Bénéficiaire:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
                                    <p><span className="font-bold text-zinc-900">Méthode:</span> SEPA Instant / SCT</p>
                                    <p className="mt-4 italic text-primary font-black text-[12px]">Référence à inclure obligatoirement: {invoice.invoiceNumber} - {invoice.customerName}</p>
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
