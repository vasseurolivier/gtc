
'use client';

import { useContext } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { PackingList } from '@/actions/packing-lists';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Button } from '@/components/ui/button';
import { PrintFooter } from '@/components/layout/print-footer';

export function PackingListPreview({ packingList, logo }: { packingList: PackingList, logo: string }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);


    if (!currencyContext || !companyInfoContext) {
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

    const handlePrint = () => {
        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
    };

    return (
        <main className="w-full mx-auto">
             <div className="p-8 no-print flex justify-end">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <div className="print-document bg-white rounded-lg shadow-lg">
                <header className="print-header">
                     <div className="print-header-content pt-8 pb-4 border-b flex justify-between items-start">
                        <div className="w-1/3 flex justify-start">
                            {logo && <Image src={logo} alt="Company Logo" width={120} height={50} className="object-contain"/>}
                        </div>
                        
                        <div className="w-1/3 text-right">
                            <h1 className="text-3xl font-bold text-black">PACKING LIST</h1>
                            <p className="mt-1 text-muted-foreground">N° {packingList.listId}</p>
                        </div>
                    </div>
                </header>
                
                <section className="print-body">
                    <div className="print-body-content">
                        <div className="grid grid-cols-2 gap-8 my-8">
                           <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">ÉMIS PAR</h3>
                                <p className="font-bold">{companyInfo?.name}</p>
                                <p className="whitespace-pre-wrap text-sm">{companyInfo?.address}</p>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-8 my-8">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">DATE</h3>
                                <p>{format(new Date(packingList.date), 'dd/MM/yyyy')}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
                                <p>{packingList.listId}</p>
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
                                    <th className="p-2 font-semibold">Remarks</th>
                                </tr>
                            </thead>
                            
                            <tbody>
                                {packingList.items.map((item, index) => {
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
                                            <td className="p-2 align-top font-medium">{item.description}</td>
                                            <td className="p-2 align-top text-right">{item.sku}</td>
                                            <td className="p-2 align-top text-right">{item.quantity}</td>
                                            <td className="p-2 align-top text-right">¥{item.unitPriceCny.toFixed(2)}</td>
                                            <td className="p-2 align-top text-right font-semibold">¥{totalCny.toFixed(2)}</td>
                                            <td className="p-2 align-top">{item.remarks}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                         <div className="flex justify-end pt-8">
                            <div className="w-full md:w-2/3 lg:w-1/2 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Quantity :</span>
                                    <span className="font-medium text-right">{totals.totalQuantity}</span>
                                </div>
                               
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                    <span>TOTAL (CNY) :</span>
                                    <span className="text-right">
                                        <div>¥{totals.totalAmountCny.toFixed(2)}</div>
                                        <div className="text-sm font-normal text-muted-foreground">{currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)}</div>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="print-footer">
                    <PrintFooter />
                </footer>
            </div>
        </main>
    );
}
