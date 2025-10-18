

'use client';

import { useContext, useState, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { FactoryPi } from '@/actions/factory-pi';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function FactoryPiPreview({ factoryPi, logo }: { factoryPi: FactoryPi, logo: string }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);


    if (!companyInfoContext) {
        return <Loader2 className="h-16 w-16 animate-spin" />;
    }

    const { companyInfo } = companyInfoContext;

    const totals = factoryPi.items.reduce((acc, item) => {
        const totalCny = item.quantity * item.unitPriceCny;
        acc.totalQuantity += item.quantity;
        acc.totalAmountCny += totalCny;
        return acc;
    }, { totalQuantity: 0, totalAmountCny: 0 });

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        const mainContent = printRef.current;
        const footerContent = footerRef.current;

        if (mainContent && footerContent) {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                // --- Process Main Content ---
                const mainCanvas = await html2canvas(mainContent, { scale: 2 });
                const mainImgData = mainCanvas.toDataURL('image/png');
                const mainImgProps = pdf.getImageProperties(mainImgData);
                const mainRatio = mainImgProps.height / mainImgProps.width;
                let mainImgHeight = pdfWidth * mainRatio;
                let mainHeightLeft = mainImgHeight;
                let mainPosition = 0;
                
                // --- Process Footer ---
                const footerCanvas = await html2canvas(footerContent, { scale: 2 });
                const footerImgData = footerCanvas.toDataURL('image/png');
                const footerImgProps = pdf.getImageProperties(footerImgData);
                const footerRatio = footerImgProps.height / footerImgProps.width;
                const footerHeight = pdfWidth * footerRatio;
                const footerY = pdfHeight - footerHeight - 5; 

                // Add main content pages
                let pageCount = 0;
                while (mainHeightLeft > 0) {
                    if (pageCount > 0) {
                        pdf.addPage();
                    }
                    pdf.addImage(mainImgData, 'PNG', 0, mainPosition, pdfWidth, mainImgHeight);
                    mainHeightLeft -= pdfHeight;
                    mainPosition -= pdfHeight;
                    pageCount++;
                }

                // Add footer to each page
                for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
                    pdf.setPage(i);
                    pdf.addImage(footerImgData, 'PNG', 0, footerY, pdfWidth, footerHeight);
                }
                
                pdf.save(`FactoryPI_${factoryPi.piNumber}.pdf`);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("An error occurred while generating the PDF.");
            }
        }
        setIsGeneratingPdf(false);
    };

    return (
        <main className="w-full mx-auto print-document">
             <div className="p-8 no-print flex justify-end">
                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Printer className="mr-2 h-4 w-4" />
                    )}
                    Export to PDF
                </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg border">
                <div ref={printRef} className="px-12 py-8 pb-24">
                    <header className="pb-8 mb-8 border-b">
                        <div className="flex justify-between items-start h-24">
                            <div className="w-1/3 h-full flex justify-start items-center">
                                {logo && <Image src={logo} alt="Company Logo" width={120} height={60} className="object-contain h-full w-auto"/>}
                            </div>
                            
                            <div className="w-1/3 text-right">
                                <h1 className="text-3xl font-bold text-black">PROFORMA INVOICE</h1>
                                <p className="mt-1 text-muted-foreground">N° {factoryPi.piNumber}</p>
                            </div>
                        </div>
                    </header>
                    
                    <section>
                        <div>
                             <div className="grid grid-cols-2 gap-8 my-8">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-2 text-sm">DATE</h3>
                                    <p>{format(new Date(factoryPi.date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
                                    <p>{factoryPi.piNumber}</p>
                                </div>
                            </div>

                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-muted-foreground border-b-2 border-t-2 text-sm">
                                        <th className="p-2 font-semibold">Image</th>
                                        <th className="w-1/2 p-2 font-semibold">Description</th>
                                        <th className="p-2 text-right font-semibold">SKU</th>
                                        <th className="p-2 text-right font-semibold">Quantity</th>
                                        <th className="p-2 text-right font-semibold">Unit Price (CNY)</th>
                                        <th className="p-2 text-right font-semibold">Total (CNY)</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    {factoryPi.items.map((item, index) => {
                                        const totalCny = item.quantity * item.unitPriceCny;
                                        return (
                                            <tr key={index} className="border-b" style={{ height: '80px' }}>
                                                <td className="p-2 align-top">
                                                    {item.photo && 
                                                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <Image src={item.photo} alt={item.description} width={64} height={64} className="object-contain" />
                                                        </div>
                                                    }
                                                </td>
                                                <td className="p-2 align-top font-medium">${item.description}</td>
                                                <td className="p-2 align-top text-right">{item.sku}</td>
                                                <td className="p-2 align-top text-right">{item.quantity}</td>
                                                <td className="p-2 align-top text-right">¥${item.unitPriceCny.toFixed(2)}</td>
                                                <td className="p-2 align-top text-right font-semibold">¥${totalCny.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                             <div className="flex justify-end pt-8">
                                <div className="w-full md:w-2/3 lg:w-1/2 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Quantity :</span>
                                        <span className="font-medium text-right">${totals.totalQuantity}</span>
                                    </div>
                                   
                                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                        <span>TOTAL (CNY) :</span>
                                        <span className="text-right">
                                            <div>¥${totals.totalAmountCny.toFixed(2)}</div>
                                        </span>
                                    </div>
                                </div>
                            </div>

                             <div className="mt-8 border-t pt-4">
                                <h4 className="font-semibold mb-2">Notes:</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">${factoryPi.notes}</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer element, visually hidden but present for capture */}
            <div className="absolute -left-[9999px] top-auto">
                <div ref={footerRef} className="px-12 py-4 w-[210mm]">
                    <div className="pt-4 border-t text-center text-xs text-gray-500">
                        <p>Merci de votre confiance</p>
                        <p>{companyInfo?.address}</p>
                        <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
