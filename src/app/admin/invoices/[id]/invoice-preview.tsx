
'use client';

import type { Invoice } from '@/actions/invoices';
import { getOrderById, Order } from '@/actions/orders';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer, Phone, Mail, Package, Truck } from 'lucide-react';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from "@/lib/utils";

const WAREHOUSE_3PL_ADDRESS = "Entrepot GTC china";

export function InvoicePreview({ invoice, customer, products }: { invoice: Invoice, customer: any, products: any[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [order, setOrder] = useState<Order | null>(null);

    const is3PL = invoice.shippingAddress === WAREHOUSE_3PL_ADDRESS;
    const invoiceRate = invoice.exchangeRate || currencyContext?.exchangeRate || 0.13;
    const currencyPref = customer?.currencyPreference || 'BOTH';

    useEffect(() => {
        if (invoice.orderId) {
            getOrderById(invoice.orderId).then(setOrder);
        }
    }, [invoice.orderId]);

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
        pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    };

    if (!currencyContext || !companyInfoContext || !companyInfoContext.isCompanyInfoLoaded) {
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
            <span className="inline-flex flex-col items-end align-middle">
                <span className={cn(isMain ? "font-black" : "")}>€${eurValue.toFixed(2)}</span>
                <span className="text-[7px] text-zinc-400 font-normal leading-none">¥${cnyValue.toFixed(2)}</span>
            </span>
        );
    };

    const companyName = customer.companyName || customer.company || '';
    const contactName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : (customer.name || 'Client');
    
    const cleanCompanyAddress = is3PL 
        ? companyInfo.address.replace(/Yiwu/gi, '').replace(/义乌/g, '').replace(/,,/g, ',').trim()
        : companyInfo.address;

    const beneficiaryName = "Yiwu Huanqiu Trading Co., Ltd.";

    return (
        <main className="w-full mx-auto bg-white" id="invoice-preview">
            <div className="p-4 flex justify-end no-print">
                <Button size="sm" onClick={handleDownloadPdf}><Printer className="mr-2 h-4 w-4" /> Export PDF</Button>
            </div>
            
            <div id="pdf-content" className="relative p-6 bg-white min-h-[297mm] pb-16">
                <div className="flex-grow">
                    <header className="w-full flex justify-between items-start pb-2 border-b">
                        <div>
                            {displayLogo && <img src={displayLogo} alt="Logo" className="h-10 w-auto object-contain block" />}
                        </div>
                        <div className="text-right">
                            <h1 className="text-sm font-black text-black uppercase leading-tight">FACTURE</h1>
                            <p className="text-[8px] text-muted-foreground leading-tight">N° {invoice.invoiceNumber}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-4 my-4 text-[8px]">
                        <div>
                            <h3 className="font-bold text-zinc-400 mb-0.5 uppercase tracking-wider">ÉMIS PAR</h3>
                            <p className="font-bold text-zinc-900">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap text-zinc-500 leading-tight">{cleanCompanyAddress}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-400 mb-0.5 uppercase tracking-wider">FACTURÉ À</h3>
                            {companyName && <p className="font-bold uppercase text-zinc-900">{companyName}</p>}
                            <p className={companyName ? "text-zinc-500" : "font-bold text-zinc-900"}>{contactName}</p>
                            <p className="whitespace-pre-wrap mt-0.5 text-zinc-500 leading-tight">{invoice.shippingAddress || customer?.address}</p>
                            <div className="mt-1 space-y-0.5 flex flex-col">
                                {customer?.phone && <span className="flex items-center gap-1"><Phone className="h-2 w-2" /> {customer.phone}</span>}
                                {customer?.email && <span className="flex items-center gap-1"><Mail className="h-2 w-2" /> {customer.email}</span>}
                            </div>
                        </div>
                    </section>
                    
                    <table className="w-full text-[8px] border-collapse">
                        <thead>
                            <tr className="text-left bg-zinc-100 text-zinc-900">
                                <th className="p-1 font-bold border w-10">Image</th>
                                <th className="p-1 font-bold border">Description</th>
                                <th className="p-1 text-center font-bold border w-8">Qté</th>
                                <th className="p-1 text-right font-bold border w-16">Prix Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                <th className="p-1 text-right font-bold border w-20">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => {
                                const displayImage = item.photo;
                                return (
                                    <tr key={index} className="border-b">
                                        <td className="p-0.5 border text-center">
                                            <div className="w-8 h-8 mx-auto flex items-center justify-center">
                                                {displayImage ? (
                                                    <img src={displayImage} alt="Product" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <Package className="h-3 w-3 text-zinc-200" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-1 border"><p className="font-bold text-[9px] leading-tight">{item.description}</p></td>
                                        <td className="p-1 text-center border">{item.quantity}</td>
                                        <td className="p-1 text-right border">{renderPrice(item.unitPrice)}</td>
                                        <td className="p-1 text-right border font-bold">{renderPrice(Number(item.quantity) * Number(item.unitPrice))}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
                    <div className="flex justify-end pt-4">
                        <div className="w-full max-w-[180px] space-y-1 text-[8px]">
                            <div className="flex justify-between">
                                <span className="text-zinc-500 font-medium">Sous-total:</span>
                                <span className="font-bold">{renderPrice(subTotalCny)}</span>
                            </div>
                            {commissionCny > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 font-medium">Commission ({commissionRate}%):</span>
                                    <span className="font-bold">{renderPrice(commissionCny)}</span>
                                </div>
                            )}
                            {transportCny > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 font-medium flex items-center gap-1"><Truck className="h-2 w-2" /> Port:</span>
                                    <span className="font-bold">{renderPrice(transportCny)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-[10px] mt-1 pt-1 border-t-2 border-zinc-900">
                                <span>TOTAL FINAL:</span>
                                <span className="text-primary">{renderPrice(totalFinalCny, true)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-2 bg-zinc-50 rounded border text-[7px]">
                        <h3 className="font-bold mb-1 uppercase text-zinc-400">COORDONNÉES BANCAIRES</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                                <p><strong>Banque:</strong> Banking Circle S.A. - German Branch</p>
                                <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                <p><strong>SWIFT:</strong> SXPYDEHH</p>
                            </div>
                            <div className="space-y-0.5">
                                <p><strong>Bénéficiaire:</strong> {beneficiaryName}</p>
                                <p className="mt-1 italic text-primary font-bold">Ref: {invoice.invoiceNumber} - {invoice.customerName}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <PrintFooter />
            </div>
        </main>
    );
}
