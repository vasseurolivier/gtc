
'use client';

import { useContext } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import type { PackingList } from '@/actions/packing-lists';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer } from 'lucide-react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { CurrencyContext } from '@/context/currency-context';
import { PrintFooter } from '@/components/layout/print-footer';
import { Button } from '@/components/ui/button';

export function PackingListPreview({ packingList }: { packingList: PackingList }) {
    const companyInfoContext = useContext(CompanyInfoContext);
    const currencyContext = useContext(CurrencyContext);

    if (!companyInfoContext || !currencyContext) {
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
    }

    const { companyInfo } = companyInfoContext;
    const { currency, exchangeRate } = currencyContext;

    const totals = packingList.items.reduce((acc, item) => {
        const totalCny = item.quantity * item.unitPriceCny;
        acc.totalQuantity += item.quantity;
        acc.totalAmountCny += totalCny;
        return acc;
    }, { totalQuantity: 0, totalAmountCny: 0 });

    return (
        <>
            <div className="flex justify-end mb-4 no-print">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export to PDF
                </Button>
            </div>
            <Card className="w-full max-w-4xl mx-auto shadow-lg print-card" id="packinglist-content">
                <CardContent className="p-8">
                    <table className="w-full print-table">
                        <thead>
                            <tr>
                                <td>
                                    <div className="print-header-spacer"></div>
                                    <header className="print-header">
                                        <div className="flex justify-between items-start mb-8 border-b pb-8">
                                            <div>
                                                {companyInfo.logo && <Image src={companyInfo.logo} alt="Company Logo" width={120} height={120} className="object-contain" />}
                                            </div>
                                            <div className="text-right">
                                                <h1 className="text-3xl font-bold text-primary">PACKING LIST</h1>
                                                <p className="text-muted-foreground mt-2"># {packingList.listId}</p>
                                                <p className="text-muted-foreground mt-1">Date: {format(new Date(packingList.date), 'dd MMM yyyy')}</p>
                                            </div>
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
                                        </Table>
                                    </header>
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <main className="print-content">
                                        <Table>
                                            <TableBody>
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
                                            </TableBody>
                                        </Table>
                                        <Separator className="my-4" />
                                        <div className="flex justify-end">
                                            <div className="w-full md:w-1/2">
                                                <Table>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-bold">TOTAL QUANTITY</TableCell>
                                                            <TableCell className="text-right font-bold">{totals.totalQuantity}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-bold">TOTAL AMOUNT (CNY)</TableCell>
                                                            <TableCell className="text-right font-bold">¥{totals.totalAmountCny.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-bold">TOTAL AMOUNT ({currency.code})</TableCell>
                                                            <TableCell className="text-right font-bold">{currency.symbol}{(totals.totalAmountCny * exchangeRate).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </main>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>
                                    <div className="print-footer-spacer"></div>
                                    <PrintFooter />
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}
