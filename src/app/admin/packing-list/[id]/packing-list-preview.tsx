
'use client';

import { useContext, useState, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { PackingList } from '@/actions/packing-lists';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function PackingListPreview({ packingList }: { packingList: PackingList }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const [isPrinting, setIsPrinting] = useState(false);
    const printContentRef = useRef<HTMLDivElement>(null);

    if (!currencyContext || !companyInfoContext?.isCompanyInfoLoaded) {
        return <Loader2 className="h-16 w-16 animate-spin" />;
    }

    const { currency, exchangeRate } = currencyContext;
    const { companyInfo } = companyInfoContext;

    const totals = packingList.items.reduce((acc, item) => {
        const totalCny = item.quantity * item.unitPriceCny;
        acc.totalQuantity += item.quantity;
        acc.totalAmountCny += totalCny;
        return acc;
    }, { totalQuantity: 0, totalAmountCny: 0 });

    const handlePrint = async () => {
        setIsPrinting(true);
        const content = printContentRef.current;
        const footer = document.getElementById('print-footer-template');

        if (content && footer) {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10; // 10mm margin
                const contentWidth = pdfWidth - (margin * 2);
                
                const footerCanvas = await html2canvas(footer, { scale: 2 });
                const footerImgData = footerCanvas.toDataURL('image/png');
                const footerHeightMM = (footerCanvas.height * contentWidth / footerCanvas.width) * 0.264583;

                const contentCanvas = await html2canvas(content, { scale: 2, windowWidth: content.scrollWidth, windowHeight: content.scrollHeight });
                const contentImgData = contentCanvas.toDataURL('image/png');
                const contentImgHeight = contentCanvas.height * contentWidth / contentCanvas.width;
                
                const pageContentHeight = pdfHeight - (margin * 2) - footerHeightMM - 5; // 5mm extra space before footer
                
                let heightLeft = contentImgHeight;
                let position = 0;
                let pageCount = 0;

                while (heightLeft > 0) {
                    if (pageCount > 0) {
                        pdf.addPage();
                    }
                    // The position `y` is negative because we are slicing the image from the top.
                    pdf.addImage(contentImgData, 'PNG', margin, position, contentWidth, contentImgHeight);
                    pdf.addImage(footerImgData, 'PNG', margin, pdfHeight - footerHeightMM - margin, contentWidth, footerHeightMM);
                    
                    heightLeft -= pageContentHeight;
                    position -= pdfHeight - (margin * 2); // Move the image up for the next page.
                    pageCount++;
                }

                pdf.save(`packing-list-${packingList.listId}.pdf`);

            } catch (error) {
                console.error("Error generating PDF:", error);
            }
        }
        setIsPrinting(false);
    };

    return (
        <>
            <main className="w-full mx-auto">
                 <div className="p-8 no-print flex justify-end">
                    <Button onClick={handlePrint} disabled={isPrinting}>
                        {isPrinting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="mr-2 h-4 w-4" />
                        )}
                        Export to PDF
                    </Button>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg border print-document">
                    <div ref={printContentRef} className="px-8 py-10 pb-48">
                        <header className="flex justify-between items-start pb-8 mb-8 border-b">
                            <div>
                                {companyInfo.logo && 
                                    <Image src={companyInfo.logo} alt="Company Logo" width={160} height={40} style={{objectFit: 'contain'}}/>
                                }
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-bold text-black">PACKING LIST</h1>
                                <p className="mt-1 text-xs text-muted-foreground">N° {packingList.listId}</p>
                            </div>
                        </header>
                        
                        <section>
                            <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                            <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">ÉMIS PAR</h3>
                                    <p className="font-bold">{companyInfo?.name}</p>
                                    <p className="whitespace-pre-wrap">{companyInfo?.address}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">DATE</h3>
                                    <p>{format(new Date(packingList.date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">NUMÉRO DE RÉFÉRENCE</h3>
                                    <p>{packingList.listId}</p>
                                </div>
                            </div>

                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-muted-foreground border-b-2 border-t-2">
                                        <th className="p-1 font-semibold w-[8%]">Photo</th>
                                        <th className="w-2/5 p-1 font-semibold">Description</th>
                                        <th className="p-1 text-right font-semibold w-[12%]">SKU</th>
                                        <th className="p-1 text-right font-semibold">Quantity</th>
                                        <th className="p-1 text-right font-semibold">Unit Price (CNY)</th>
                                        <th className="p-1 text-right font-semibold">Total (CNY)</th>
                                        <th className="p-1 font-semibold">Remarks</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    {packingList.items.map((item, index) => {
                                        const totalCny = item.quantity * item.unitPriceCny;
                                        return (
                                            <tr key={index} className="border-b">
                                                <td className="p-1 align-top">
                                                    {item.photo && 
                                                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <img src={item.photo} alt={item.description} width={48} height={48} className="object-contain" />
                                                        </div>
                                                    }
                                                </td>
                                                <td className="p-1 align-top font-medium leading-tight">{item.description}</td>
                                                <td className="p-1 align-top text-right">{item.sku}</td>
                                                <td className="p-1 align-top text-right">{item.quantity}</td>
                                                <td className="p-1 align-top text-right">¥{item.unitPriceCny.toFixed(2)}</td>
                                                <td className="p-1 align-top text-right font-semibold">¥{totalCny.toFixed(2)}</td>
                                                <td className="p-1 align-top leading-tight">{item.remarks}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="flex justify-end pt-4">
                                <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Quantity :</span>
                                        <span className="font-medium text-right">{totals.totalQuantity}</span>
                                    </div>
                                
                                    <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
                                        <span>TOTAL (CNY) :</span>
                                        <span className="text-right">
                                            <div>¥{totals.totalAmountCny.toFixed(2)}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)}</div>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <div className="hidden">
                 <PrintFooter />
            </div>
        </>
    );
}
