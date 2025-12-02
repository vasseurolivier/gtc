
'use client';

import { useContext, useState, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { FactoryPi } from '@/actions/factory-pi';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';

export function FactoryPiPreview({ factoryPi }: { factoryPi: FactoryPi }) {
    const companyInfoContext = useContext(CompanyInfoContext);

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

    const ITEMS_PER_PAGE = 10;
    const chunkedItems: FactoryPi['items'][] = [];
    for (let i = 0; i < factoryPi.items.length; i += ITEMS_PER_PAGE) {
        chunkedItems.push(factoryPi.items.slice(i, i + ITEMS_PER_PAGE));
    }

    return (
        <>
            <main className="w-full mx-auto">
                 <div className="p-8 no-print flex justify-end">
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Export to PDF
                    </Button>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg border print-document">
                    <div className="px-8 py-10">
                        <header className="flex justify-between items-start pb-8 mb-8 border-b">
                            <div>
                                {companyInfo.logo && 
                                    <Image src={companyInfo.logo} alt="Company Logo" width={26} height={6} style={{objectFit: 'contain'}}/>
                                }
                            </div>
                            <div className="text-right w-2/3">
                                <h1 className="text-2xl font-bold text-black">PROFORMA INVOICE</h1>
                                <p className="mt-1 text-xs text-muted-foreground">N° {factoryPi.piNumber}</p>
                            </div>
                        </header>
                        
                        <section>
                            <div className="grid grid-cols-2 gap-8 my-8 text-xs">
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">DATE</h3>
                                    <p>{format(new Date(factoryPi.date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-muted-foreground mb-1">NUMÉRO DE RÉFÉRENCE</h3>
                                    <p>{factoryPi.piNumber}</p>
                                </div>
                            </div>

                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-muted-foreground border-b-2 border-t-2">
                                        <th className="p-1 font-semibold">Image</th>
                                        <th className="w-1/2 p-1 font-semibold">Description</th>
                                        <th className="p-1 text-right font-semibold">SKU</th>
                                        <th className="p-1 text-right font-semibold">Quantity</th>
                                        <th className="p-1 text-right font-semibold">Unit Price (CNY)</th>
                                        <th className="p-1 text-right font-semibold">Total (CNY)</th>
                                    </tr>
                                </thead>
                                
                                {chunkedItems.map((chunk, chunkIndex) => (
                                    <tbody key={chunkIndex} className={chunkIndex > 0 ? 'break-before-page' : ''}>
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
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 border-t pt-4">
                                <h4 className="font-semibold mb-1 text-xs">Notes:</h4>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-tight">{factoryPi.notes}</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <div className="print-footer-container no-print">
                 <PrintFooter />
            </div>
        </>
    );
}
