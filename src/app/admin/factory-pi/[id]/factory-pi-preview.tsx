

'use client';

import { useContext } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { FactoryPi } from '@/actions/factory-pi';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';

export function FactoryPiPreview({ factoryPi }: { factoryPi: FactoryPi }) {
    const companyInfoContext = useContext(CompanyInfoContext);

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

        pdf.save(`factory-pi-${factoryPi.piNumber}.pdf`);
    };

    if (!companyInfoContext?.isCompanyInfoLoaded) {
        return <Loader2 className="h-16 w-16 animate-spin" />;
    }

    const { companyInfo } = companyInfoContext;

    const totals = factoryPi.items.reduce((acc, item) => {
        const totalCny = item.quantity * item.unitPriceCny;
        acc.totalQuantity += item.quantity;
        acc.totalAmountCny += totalCny;
        return acc;
    }, { totalQuantity: 0, totalAmountCny: 0 });

    const itemChunks = [];
    for (let i = 0; i < factoryPi.items.length; i += 10) {
      itemChunks.push(factoryPi.items.slice(i, i + 10));
    }

    return (
        <main className="w-full mx-auto bg-white">
             <div className="p-8 flex justify-end no-print">
                <Button onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            <div className="relative">
                <div id="pdf-content" className="p-8 bg-white min-h-[297mm]">
                    <div className="flex-grow">
                        <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                            <div>
                                {companyInfo.logo && 
                                    <img src={companyInfo.logo} alt="Company Logo" crossOrigin="anonymous" className="h-12 w-auto object-contain"/>
                                }
                            </div>
                            <div className="text-right w-2/3">
                                <h1 className="text-base font-bold text-black leading-tight">PROFORMA INVOICE</h1>
                                <p className="mt-1 text-xs text-muted-foreground leading-tight">N° {factoryPi.piNumber}</p>
                            </div>
                        </header>
                          
                        <section>
                            <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">DATE</h3>
                                    <p className="leading-tight">{format(new Date(factoryPi.date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">NUMÉRO DE RÉFÉRENCE</h3>
                                    <p className="leading-tight">{factoryPi.piNumber}</p>
                                </div>
                            </div>
                        </section>
                          
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left bg-blue-100 text-blue-800">
                                    <th className="p-2 font-bold border">Image</th>
                                    <th className="w-1/2 p-2 font-bold border">Description</th>
                                    <th className="p-2 text-right font-bold border">SKU</th>
                                    <th className="p-2 text-right font-bold border">Quantity</th>
                                    <th className="p-2 text-right font-bold border">Unit Price (CNY)</th>
                                    <th className="p-2 text-right font-bold border">Total (CNY)</th>
                                </tr>
                            </thead>
                             {itemChunks.map((chunk, chunkIndex) => (
                                <tbody key={chunkIndex} className={chunkIndex > 0 ? 'break-before-page' : ''}>
                                    {chunk.map((item, index) => {
                                        const totalCny = item.quantity * item.unitPriceCny;
                                        return (
                                            <tr key={index} className="border-b">
                                                <td className="p-1 align-top border">
                                                    {item.photo && 
                                                        <div className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <img src={item.photo} alt={item.description} crossOrigin="anonymous" width={48} height={48} className="object-contain" />
                                                        </div>
                                                    }
                                                </td>
                                                <td className="p-1 align-top font-medium leading-tight border">{item.description}</td>
                                                <td className="p-1 align-top text-right leading-tight border">{item.sku}</td>
                                                <td className="p-1 align-top text-right leading-tight border">{item.quantity}</td>
                                                <td className="p-1 align-top text-right leading-tight border"><span className="font-bold">¥{item.unitPriceCny.toFixed(2)}</span></td>
                                                <td className="p-1 align-top text-right font-semibold leading-tight border"><span className="font-bold">¥{totalCny.toFixed(2)}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            ))}
                        </table>
                          
                        <div className="flex justify-end pt-4">
                            <div className="w-full md:w-2/3 lg:w-1/2 space-y-1 text-xs">
                                <div className="flex justify-between leading-tight">
                                    <span className="text-muted-foreground">Total Quantity :</span>
                                    <span className="text-right">
                                      <span className="font-bold">{totals.totalQuantity}</span>
                                    </span>
                                </div>
                            
                                <div className="flex justify-between font-bold text-sm leading-tight border-t-2 border-black pt-2 mt-2">
                                    <span>TOTAL (CNY) :</span>
                                    <span className="text-right">
                                        <span className="font-bold">¥{totals.totalAmountCny.toFixed(2)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {factoryPi.notes && (
                            <div className="mt-8 border-t pt-4">
                                <h4 className="font-semibold mb-1 text-xs leading-tight">Notes:</h4>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-tight">{factoryPi.notes}</p>
                            </div>
                        )}
                    </div>
                     <PrintFooter />
                </div>
            </div>
        </main>
    );
}
