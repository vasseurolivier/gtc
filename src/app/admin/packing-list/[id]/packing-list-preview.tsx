
'use client';

import { useContext } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { PackingList } from '@/actions/packing-lists';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { Button } from '@/components/ui/button';

export function PackingListPreview({ packingList, logo }: { packingList: PackingList, logo: string }) {
    const currencyContext = useContext(CurrencyContext);

    if (!currencyContext) {
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
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
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-auto print-document">
            <div className="flex justify-end mb-4 no-print">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            
            <header className="print-header">
                 <div className="flex justify-between items-start pb-4 border-b">
                    <div>
                        {logo && <Image src={logo} alt="Company Logo" width={100} height={40} className="object-contain"/>}
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-primary">PACKING LIST</h1>
                        <p className="text-muted-foreground mt-1"># {packingList.listId}</p>
                    </div>
                </div>
            </header>

            <footer className="print-footer">
                <CompanyInfoFooter />
            </footer>

            <main className="print-body">
                <div className="my-8 text-left">
                    <p className="font-semibold">Date: {format(new Date(packingList.date), 'dd MMM yyyy')}</p>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead className="w-16">Photo</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price (CNY)</TableHead>
                            <TableHead className="text-right">Total (CNY)</TableHead>
                            <TableHead className="text-right">Unit Price ({currency.code})</TableHead>
                            <TableHead className="text-right">Total ({currency.code})</TableHead>
                            <TableHead>Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {packingList.items.map((item, index) => {
                            const totalCny = item.quantity * item.unitPriceCny;
                            const unitPriceConverted = item.unitPriceCny * exchangeRate;
                            const totalConverted = totalCny * exchangeRate;
                            return (
                                <TableRow key={index}>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>
                                        {item.photo && <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                            <Image src={item.photo} alt={item.description} width={64} height={64} className="object-contain" />
                                        </div>}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">¥{item.unitPriceCny.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">¥{totalCny.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{currency.symbol}{unitPriceConverted.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">{currency.symbol}{totalConverted.toFixed(2)}</TableCell>
                                    <TableCell>{item.remarks}</TableCell>
                                </TableRow>
                            );
                        })}
                    </tbody>
                </Table>

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
            </main>
        </div>
    );
}

function CompanyInfoFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);
     if (!companyInfoContext) return null;
    const { companyInfo } = companyInfoContext;
    
    return (
        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
            <p className="font-bold">{companyInfo.name}</p>
            <p>{companyInfo.address}</p>
            <p>Email: {companyInfo.email} | Phone: {companyInfo.phone}</p>
        </div>
    );
}
