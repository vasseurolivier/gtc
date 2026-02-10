
'use client';

import type { Invoice } from '@/actions/invoices';
import { getOrderById, Order } from '@/actions/orders';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Loader2, Printer, Phone, Mail, Package, Truck } from 'lucide-react';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from "@/lib/utils";

export function InvoicePreview({ invoice, customer, products }: { invoice: Invoice, customer: any, products: any[] }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [order, setOrder] = useState<Order | null>(null);

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

        // Force convert images to Base64 to ensure they are captured by canvas
        const imgs = element.getElementsByTagName('img');
        const fetchPromises = Array.from(imgs).map(async (img) => {
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
    const productsBySku = new Map(products.map(p => [p.sku, p]));

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

    const companyName = customer.companyName || customer.company || '';
    const contactName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : (customer.name || 'Client');
    
    return (
        <main className="w-full mx-auto bg-white" id="invoice-preview">
            <div className="p-4 flex justify-end no-print">
                <Button size="sm" onClick={handleDownloadPdf}><Printer className="mr-2 h-4 w-4" /> Exporter en PDF</Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-20">
                <div className="flex-grow">
                    <header className="w-full flex justify-between items-start pt-2 pb-4 border-b">
                        <div>
                            {displayLogo && <img src={displayLogo} alt="Logo" className="h-14 w-auto object-contain block" />}
                        </div>
                        <div className="text-right">
                            <h1 className="text-lg font-black text-black uppercase">FACTURE</h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">N° {invoice.invoiceNumber}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-6 text-xs">
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">ÉMIS PAR</h3>
                            <p className="font-bold">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap text-[10px]">{companyInfo?.address}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">FACTURÉ À</h3>
                            {companyName && <p className="font-bold uppercase">{companyName}</p>}
                            <p className={companyName ? "text-muted-foreground" : "font-bold"}>{contactName}</p>
                            <p className="whitespace-pre-wrap mt-1 text-[10px]">{invoice.shippingAddress || customer?.address}</p>
                            <div className="mt-2 space-y-0.5 text-[10px]">
                                {customer?.phone && <p className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {customer.phone}</p>}
                                {customer?.email && <p className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {customer.email}</p>}
                            </div>
                        </div>
                    </section>
                    
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left bg-zinc-100 text-zinc-900">
                                <th className="p-2 font-bold border">Image</th>
                                <th className="w-1/2 p-2 font-bold border">Description</th>
                                <th className="text-right p-2 font-bold border">Qté</th>
                                <th className="text-right p-2 font-bold border">Prix Unit. ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                                <th className="text-right p-2 font-bold border">Total ({currencyPref === 'CNY' ? '¥' : '€'})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => {
                                const catalogProduct = item.sku ? productsBySku.get(item.sku) : undefined;
                                const displayImage = item.photo || catalogProduct?.imageUrl;
                                
                                return (
                                    <tr key={index} className="border-b">
                                        <td className="p-1 border text-center">
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
                                        <td className="p-1 border"><p className="font-bold text-[11px]">{item.description}</p></td>
                                        <td className="p-1 text-center border">{item.quantity}</td>
                                        <td className="p-1 text-right border">{renderPrice(item.unitPrice)}</td>
                                        <td className="p-1 text-right border font-bold">{renderPrice(Number(item.quantity) * Number(item.unitPrice))}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
                    <div className="flex justify-end pt-6">
                        <div className="w-full max-w-[250px] space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Sous-total articles :</span>
                                <span className="font-bold">{renderPrice(subTotalCny)}</span>
                            </div>
                            {commissionCny > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Commission ({commissionRate}%) :</span>
                                    <span className="font-bold">{renderPrice(commissionCny)}</span>
                                </div>
                            )}
                            {transportCny > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium flex items-center gap-1"><Truck className="h-3 w-3" /> Frais de port :</span>
                                    <span className="font-bold">{renderPrice(transportCny)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-sm pt-2 mt-2 border-t-2 border-black">
                                <span>TOTAL FINAL :</span>
                                <span className="text-primary">{renderPrice(totalFinalCny, true)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-zinc-50 rounded-lg border text-[10px]">
                        <h3 className="font-bold mb-2 uppercase">COORDONNÉES BANCAIRES</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                                <p><strong>Banque:</strong> Banking Circle S.A. - German Branch</p>
                                <p><strong>Adresse:</strong> Maximilianstraße 54, 80538 München, Germany</p>
                                <p><strong>IBAN:</strong> DE24 2022 0800 0056 1684 61</p>
                                <p><strong>SWIFT:</strong> SXPYDEHH</p>
                            </div>
                            <div className="space-y-0.5">
                                <p><strong>Bénéficiaire:</strong> Yiwu Huanqiu Trading Co., Ltd.</p>
                                <p><strong>Méthode:</strong> SEPA Instant / SCT</p>
                                <p className="mt-2 italic text-primary font-bold">Ref: {invoice.invoiceNumber} - {invoice.customerName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 border-t pt-2 text-[9px] text-muted-foreground italic">
                        * Taux de change appliqué : 1 CNY = {invoiceRate.toFixed(4)} EUR
                    </div>
                </div>
                <PrintFooter />
            </div>
        </main>
    );
}
