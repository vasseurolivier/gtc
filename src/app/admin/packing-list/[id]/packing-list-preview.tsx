
'use client';

import { useContext } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { PackingList } from '@/actions/packing-lists';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Button } from '@/components/ui/button';

export function PackingListPreview({ packingList, logo }: { packingList: PackingList, logo: string }) {
    const currencyContext = useContext(CurrencyContext);

    if (!currencyContext) {
        return <Loader2 className="h-16 w-16 animate-spin" />;
    }

    const { currency, exchangeRate } = currencyContext;

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
        <main className="w-full max-w-4xl mx-auto">
             <div className="p-8 no-print flex justify-end">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <div className="print-document bg-white rounded-lg shadow-lg p-8">
                <header className="print-header">
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div className="w-1/3 flex justify-center">
                            {logo && <Image src={logo} alt="Company Logo" width={100} height={40} className="object-contain"/>}
                        </div>
                        <div className="w-1/3 text-center">
                           
                        </div>
                        <div className="w-1/3 text-right">
                            <h1 className="text-2xl font-bold text-red-500">PACKING LIST</h1>
                            <p className="mt-1"># {packingList.listId}</p>
                        </div>
                    </div>
                </header>

                <footer className="print-footer">
                    <CompanyInfoFooter />
                </footer>
                
                <div>
                    <div className="my-8 text-left">
                        <p className="font-semibold">Date: {format(new Date(packingList.date), 'dd MMM yyyy')}</p>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b-2 border-t-2">
                                <th className="p-2">SKU</th>
                                <th className="p-2 w-16">Photo</th>
                                <th className="p-2">Description</th>
                                <th className="p-2 text-right">Quantity</th>
                                <th className="p-2 text-right">Unit Price (CNY)</th>
                                <th className="p-2 text-right">Total (CNY)</th>
                                <th className="p-2 text-right">Unit Price ({currency.code})</th>
                                <th className="p-2 text-right">Total ({currency.code})</th>
                                <th className="p-2">Remarks</th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {packingList.items.map((item, index) => {
                                const totalCny = item.quantity * item.unitPriceCny;
                                const unitPriceConverted = item.unitPriceCny * exchangeRate;
                                const totalConverted = totalCny * exchangeRate;
                                return (
                                    <tr key={index} className="border-b" style={{ height: '80px' }}>
                                        <td className="p-2 align-top">{item.sku}</td>
                                        <td className="p-2 align-top">
                                            {item.photo && <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                                <Image src={item.photo} alt={item.description} width={64} height={64} className="object-contain" />
                                            </div>}
                                        </td>
                                        <td className="p-2 align-top font-medium">{item.description}</td>
                                        <td className="p-2 align-top text-right">{item.quantity}</td>
                                        <td className="p-2 align-top text-right">¥{item.unitPriceCny.toFixed(2)}</td>
                                        <td className="p-2 align-top text-right font-semibold">¥{totalCny.toFixed(2)}</td>
                                        <td className="p-2 align-top text-right">{currency.symbol}{unitPriceConverted.toFixed(2)}</td>
                                        <td className="p-2 align-top text-right font-semibold">{currency.symbol}{totalConverted.toFixed(2)}</td>
                                        <td className="p-2 align-top">{item.remarks}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                     <div className="flex justify-end pt-4">
                        <div className="w-full md:w-1/2">
                            <table className="w-full">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="font-bold py-2">TOTAL QUANTITY</td>
                                        <td className="text-right font-bold py-2">{totals.totalQuantity}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="font-bold py-2">TOTAL AMOUNT (CNY)</td>
                                        <td className="text-right font-bold py-2">¥{totals.totalAmountCny.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold py-2">TOTAL AMOUNT ({currency.code})</td>
                                        <td className="text-right font-bold py-2">{currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function CompanyInfoFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);
     if (!companyInfoContext) return null;
    const { companyInfo } = companyInfoContext;
    
    return (
        <div className="pt-4 border-t text-center text-xs">
            <p className="font-bold">{companyInfo.name}</p>
            <p>{companyInfo.address}</p>
            <p>Email: {companyInfo.email} | Phone: {companyInfo.phone}</p>
        </div>
    );
}
