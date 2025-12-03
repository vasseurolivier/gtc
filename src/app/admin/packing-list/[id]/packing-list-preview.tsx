
'use client';

import { useContext } from 'react';
import { format } from 'date-fns';

import type { PackingList } from '@/actions/packing-lists';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';

export function PackingListPreview({ packingList }: { packingList: PackingList }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);

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
    
    const ITEMS_PER_PAGE = 10;
    const chunkedItems: PackingList['items'][] = [];
    for (let i = 0; i < packingList.items.length; i += ITEMS_PER_PAGE) {
        chunkedItems.push(packingList.items.slice(i, i + ITEMS_PER_PAGE));
    }


    return (
        <main className="w-full mx-auto">
             <div className="p-8 no-print flex justify-end">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <div className="print-header">
              <header className="w-full flex justify-between items-start pt-2 pb-2 border-b">
                  <div>
                      {companyInfo.logo && 
                          <img src={companyInfo.logo} alt="Company Logo" width={20} height={20} style={{objectFit: 'contain'}}/>
                      }
                  </div>
                  <div className="text-right w-1/3">
                      <h1 className="text-base font-bold text-black">PACKING LIST</h1>
                      <p className="mt-1 text-xs text-muted-foreground">N° {packingList.listId}</p>
                  </div>
              </header>
            </div>
            
            <div className="print-document">
                <div className="header-spacer"></div>
                <section>
                    <div className="grid grid-cols-2 gap-8 my-4 text-xs">
                    <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">ÉMIS PAR</h3>
                            <p className="font-bold">{companyInfo?.name}</p>
                            <p className="whitespace-pre-wrap">{companyInfo?.address}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 my-4 text-xs">
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">DATE</h3>
                            <p>{format(new Date(packingList.date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-muted-foreground mb-1">NUMÉRO DE RÉFÉRENCE</h3>
                            <p>{packingList.listId}</p>
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
                    {chunkedItems.map((chunk, chunkIndex) => (
                        <tbody key={chunkIndex}>
                            {chunkIndex > 0 && <tr className="break-before-page"><td colSpan={7}></td></tr>}
                            {chunk.map((item, index) => {
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
                    ))}
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
                <div className="footer-spacer"></div>
            </div>
            <div className="print-footer">
              <PrintFooter />
            </div>
        </main>
    );
}
