

'use client';

import { useContext } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { PackingList } from '@/actions/packing-lists';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';

export function PackingListPreview({ packingList }: { packingList: PackingList }) {
    const currencyContext = useContext(CurrencyContext);
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

        pdf.save(`packing-list-${packingList.listId}.pdf`);
    };

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

    const itemChunks = [];
    for (let i = 0; i < packingList.items.length; i += 10) {
      itemChunks.push(packingList.items.slice(i, i + 10));
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
                      <div className="text-right w-1/3">
                          <h1 className="text-base font-bold text-black leading-tight">PACKING LIST</h1>
                          <p className="mt-1 text-xs text-muted-foreground leading-tight">N° {packingList.listId}</p>
                      </div>
                  </header>
                
                    <section>
                        <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                        <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">ÉMIS PAR</h3>
                                <p className="font-bold leading-tight">{companyInfo?.name}</p>
                                <p className="whitespace-pre-wrap leading-tight">{companyInfo?.address}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 my-2 text-xs">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">DATE</h3>
                                <p className="leading-tight">{format(new Date(packingList.date), 'dd/MM/yyyy')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-1 leading-tight">NUMÉRO DE RÉFÉRENCE</h3>
                                <p className="leading-tight">{packingList.listId}</p>
                            </div>
                        </div>
                    </section>
                    
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
                         {itemChunks.map((chunk, chunkIndex) => (
                            <tbody key={chunkIndex} className={chunkIndex > 0 ? 'break-before-page' : ''}>
                                {chunk.map((item, index) => {
                                    const totalCny = item.quantity * item.unitPriceCny;
                                    return (
                                        <tr key={index} className="border-b">
                                            <td className="p-1 align-top">
                                                {item.photo && 
                                                    <div className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        <img src={item.photo} alt={item.description} crossOrigin="anonymous" width={48} height={48} className="object-contain" />
                                                    </div>
                                                }
                                            </td>
                                            <td className="p-1 align-top font-medium leading-tight">{item.description}</td>
                                            <td className="p-1 align-top text-right leading-tight">{item.sku}</td>
                                            <td className="p-1 align-top text-right leading-tight">{item.quantity}</td>
                                            <td className="p-1 align-top text-right leading-tight"><span className="font-bold">¥{item.unitPriceCny.toFixed(2)}</span></td>
                                            <td className="p-1 align-top text-right font-semibold leading-tight"><span className="font-bold">¥{totalCny.toFixed(2)}</span></td>
                                            <td className="p-1 align-top leading-tight">{item.remarks}</td>
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
                        
                             <div className="border-t-2 border-black my-2" />

                            <div className="flex justify-between font-bold text-sm leading-tight">
                                <span>TOTAL (CNY) :</span>
                                <span className="text-right">
                                    <span className="font-bold">¥{totals.totalAmountCny.toFixed(2)}</span>
                                    <span className="text-muted-foreground"> ({currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)})</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
              <PrintFooter />
            </div>
        </main>
    );
}
