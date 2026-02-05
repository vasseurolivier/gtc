'use client';

import type { Invoice } from '@/actions/invoices';
import { getOrderById, Order } from '@/actions/orders';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer, Phone, Mail } from 'lucide-react';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function InvoicePreview({ invoice, customer, products }: { invoice: Invoice, customer: any, products: any[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [order, setOrder] = useState<Order | null>(null);

    const invoiceRate = invoice.exchangeRate || currencyContext?.exchangeRate || 0.13;

    useEffect(() => {
        if (invoice.orderId) {
            getOrderById(invoice.orderId).then(setOrder);
        }
    }, [invoice.orderId]);

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

    if (!currencyContext || !companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    const { companyInfo } = companyInfoContext;
    const displayLogo = companyInfo.publicLogo || companyInfo.logo;
    const productsBySku = new Map(products.map(p => [p.sku, p]));

    const subTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const commissionRate = order?.commissionRate || 0;
    const commissionAmount = subTotal * (commissionRate / 100);
    const transportCost = order?.transportCost || 0;

    const itemChunks = [];
    for (let i = 0; i < invoice.items.length; i += 10) {
      itemChunks.push(invoice.items.slice(i, i + 10));
    }

    // Customer normalization
    const companyName = customer.companyName || customer.company || '';
    const contactName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.name;
    
    return (
        <main className="w-full mx-auto bg-white" id="invoice-preview">
            <div className="p-8 flex justify-end no-print">
                <Button onClick={handleDownloadPdf}><Printer className="mr-2 h-4 w-4" /> Export to PDF</Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-24">
                <div className="flex-grow">
                    <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                        <div>{displayLogo && <img src={displayLogo} alt="Logo" crossOrigin="anonymous" className="h-12 w-auto object-contain block"/>}</div>
                        <div className="text-right">
                            <h1 className="text-base font-bold text-black uppercase">Invoice</h1>
                            <p className="mt-1 text-xs text-muted-foreground">N° {invoice.invoiceNumber}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-4 text-xs">
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">ÉMIS PAR</h3>
                            <p className="font-bold">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap">{companyInfo?.address}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">FACTURÉ À</h3>
                            {companyName && <p className="font-bold uppercase">{companyName}</p>}
                            <p className={companyName ? "text-muted-foreground" : "font-bold"}>{contactName}</p>
                            <p className="whitespace-pre-wrap mt-1">{invoice.shippingAddress || customer?.address}</p>
                            <div className="mt-2 space-y-0.5">
                                {customer?.phone && <p className="flex items-center gap-1 text-[10px]"><Phone className="h-2.5 w-2.5" /> {customer.phone}</p>}
                                {customer?.email && <p className="flex items-center gap-1 text-[10px]"><Mail className="h-2.5 w-2.5" /> {customer.email}</p>}
                            </div>
                        </div>
                    </section>
                    
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left bg-blue-50 text-blue-900">
                                <th className="p-2 font-bold border">Image</th>
                                <th className="w-1/2 p-2 font-bold border">Description</th>
                                <th className="text-right p-2 font-bold border">Quantité</th>
                                <th className="text-right p-2 font-bold border">Prix Unitaire (€)</th>
                                <th className="text-right p-2 font-bold border">Total (€)</th>
                            </tr>
                        </thead>
                        {itemChunks.map((chunk, chunkIndex) => (
                            <tbody key={chunkIndex}>
                                {chunk.map((item, itemIndex) => {
                                    const product = item.sku ? productsBySku.get(item.sku) : undefined;
                                    return (
                                        <tr key={itemIndex} className="border-b">
                                            <td className="p-1 border">{product?.imageUrl && <img src={product.imageUrl} crossOrigin="anonymous" width={40} height={40} className="object-contain mx-auto"/>}</td>
                                            <td className="p-1 border"><p className="font-medium">{item.description}</p></td>
                                            <td className="p-1 text-right border">{item.quantity}</td>
                                            <td className="p-1 text-right border font-bold">€{(item.unitPrice * invoiceRate).toFixed(2)}</td>
                                            <td className="p-1 text-right border font-bold">€{(item.quantity * item.unitPrice * invoiceRate).toFixed(2)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        ))}
                    </table>
                    
                    <div className="flex justify-end pt-4">
                        <div className="w-1/2 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sous-total :</span>
                                <span className="font-bold">€{(subTotal * invoiceRate).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Commission ({commissionRate}%) :</span>
                                <span className="font-bold">€{(commissionAmount * invoiceRate).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Frais de port :</span>
                                <span className="font-bold">€{(transportCost * invoiceRate).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t-2 border-black">
                                <span>TOTAL FINAL :</span>
                                <span className="text-primary">€{(invoice.totalAmount * invoiceRate).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-zinc-50 rounded-lg border text-xs">
                        <h3 className="font-bold mb-2">COORDONNÉES BANCAIRES</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p><strong>Banque:</strong> Banking Circle S.A. - German Branch</p>
                                <p><strong>Adresse Banque:</strong> Maximilianstraße 54, 80538 München, Germany</p>
                                <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                <p><strong>SWIFT:</strong> SXPYDEHH</p>
                            </div>
                            <div className="space-y-1">
                                <p><strong>Bénéficiaire:</strong> Yiwu Huanqiu Trading Co., Ltd.</p>
                                <p><strong>Méthode:</strong> SEPA Instant / SCT</p>
                                <p className="mt-2 italic text-primary">Ref: {invoice.invoiceNumber} - {invoice.customerName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 border-t pt-2 text-[10px] text-muted-foreground italic">
                        * Taux de change appliqué (verrouillé) : 1 CNY = {invoiceRate.toFixed(4)} EUR
                    </div>
                </div>
                <PrintFooter />
            </div>
        </main>
    );
}
