'use client';

import { useContext } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
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
                    console.error("PDF Image conversion failed", originalSrc, e);
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

        pdf.save(`packing-list-${packingList.listId}.pdf`);
    };

    if (!currencyContext || !companyInfoContext?.isCompanyInfoLoaded) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    const { companyInfo } = companyInfoContext;

    const totals = packingList.items.reduce((acc, item) => {
        const totalCny = item.quantity * item.unitPriceCny;
        acc.totalQuantity += item.quantity;
        acc.totalAmountCny += totalCny;
        return acc;
    }, { totalQuantity: 0, totalAmountCny: 0 });

    return (
        <main className="w-full mx-auto bg-white" id="invoice-preview">
             <div className="p-4 flex justify-end no-print">
                <Button size="sm" onClick={handleDownloadPdf}>
                    <Printer className="mr-2 h-4 w-4" /> Export PDF
                </Button>
            </div>
            
            <div id="pdf-content" className="relative p-8 bg-white min-h-[297mm] pb-12">
              <div className="flex-grow">
                <header className="w-full flex justify-between items-start pb-2 border-b">
                    <div>
                        {companyInfo.logoDocument && 
                            <img src={companyInfo.logoDocument} alt="Logo" className="h-10 w-auto object-contain" />
                        }
                    </div>
                    <div className="text-right">
                        <h1 className="text-[12px] font-bold text-black uppercase">PACKING LIST</h1>
                        <p className="text-[10px] text-muted-foreground leading-tight">N° {packingList.listId}</p>
                    </div>
                </header>
              
                  <section className="my-4 grid grid-cols-2 gap-8 text-[10px]">
                      <div>
                          <h3 className="font-bold text-zinc-400 mb-1 uppercase">ÉMIS PAR</h3>
                          <p className="font-bold">{companyInfo?.name}</p>
                          <p className="whitespace-pre-wrap leading-tight text-zinc-500">{companyInfo?.address}</p>
                      </div>
                      <div className="text-right">
                          <p><span className="font-bold text-zinc-400">DATE:</span> {format(new Date(packingList.date), 'dd/MM/yyyy')}</p>
                          <p><span className="font-bold text-zinc-400">REF:</span> {packingList.listId}</p>
                      </div>
                  </section>
                  
                  <table className="w-full text-[10px] border-collapse">
                      <thead>
                          <tr className="text-left bg-zinc-900 text-white">
                              <th className="p-2 font-bold border-none w-14">Photo</th>
                              <th className="p-2 font-bold border-none">Description</th>
                              <th className="p-2 text-right font-bold border-none w-16">SKU</th>
                              <th className="p-2 text-right font-bold border-none w-10">Qté</th>
                              <th className="p-2 text-right font-bold border-none w-24">Unit. (CNY)</th>
                              <th className="p-2 text-right font-bold border-none w-28">Dim/Poids</th>
                              <th className="p-2 text-right font-bold border-none w-28">Total (CNY)</th>
                              <th className="p-2 font-bold border-none">Remarques</th>
                          </tr>
                      </thead>
                      <tbody>
                          {packingList.items.map((item, index) => {
                              const totalCny = item.quantity * item.unitPriceCny;
                              return (
                                  <tr key={index} className="border-b hover:bg-zinc-50">
                                      <td className="p-1 align-top border text-center">
                                          {item.photo && 
                                              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                                                  <img src={item.photo} alt="p" className="max-w-full max-h-full object-contain" />
                                              </div>
                                          }
                                      </td>
                                      <td className="p-2 align-top font-medium leading-tight border">{item.description}</td>
                                      <td className="p-2 align-top text-right leading-tight border">{item.sku}</td>
                                      <td className="p-2 align-top text-right leading-tight border font-bold">{item.quantity}</td>
                                      <td className="p-2 align-top text-right leading-tight border">¥{item.unitPriceCny.toFixed(2)}</td>
                                      <td className="p-2 align-top text-right whitespace-nowrap leading-tight border">
                                        {item.weight || item.length || item.width || item.height ? (
                                            <>
                                                {item.weight > 0 && <div>{item.weight} kg</div>}
                                                {(item.length || item.width || item.height) && <div>{item.length}x{item.width}x{item.height} cm</div>}
                                            </>
                                        ) : '-'}
                                      </td>
                                      <td className="p-2 align-top text-right font-bold leading-tight border">¥{totalCny.toFixed(2)}</td>
                                      <td className="p-2 align-top leading-tight border text-zinc-400 text-[9px]">{item.remarks}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>

                  <div className="flex justify-end pt-4">
                      <div className="w-full max-w-[220px] space-y-1 text-[10px]">
                          <div className="flex justify-between">
                              <span className="text-zinc-500 font-medium">Qté Totale:</span>
                              <span className="font-bold">{totals.totalQuantity}</span>
                          </div>
                          <div className="flex justify-between font-black text-[12px] mt-2 pt-1 border-t-2 border-zinc-900">
                              <span>TOTAL (CNY):</span>
                              <span className="text-primary font-black">¥{totals.totalAmountCny.toFixed(2)}</span>
                          </div>
                      </div>
                  </div>
              </div>
               <PrintFooter />
            </div>
        </main>
    );
}