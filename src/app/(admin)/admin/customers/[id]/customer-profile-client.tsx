
'use client';

import { useContext } from 'react';
import { Customer } from '@/actions/customers';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatInTimeZone } from 'date-fns-tz';
import * as XLSX from 'xlsx';
import { CurrencyContext } from '@/context/currency-context';
import { FileSpreadsheet } from 'lucide-react';

export function CustomerProfileClient({ customer, children }: { customer: Customer, children: React.ReactNode }) {
    const currencyContext = useContext(CurrencyContext);

    if (!currencyContext) {
        throw new Error("CurrencyContext must be used within a CurrencyProvider");
    }
    const { currency, exchangeRate } = currencyContext;

    const handleExport = () => {
        if (!customer || !customer.financials) return;

        const financials = customer.financials;

        const customerInfoData = [
            { 'Field': 'Name', 'Value': customer.name },
            { 'Field': 'Email', 'Value': customer.email },
            { 'Field': 'Phone', 'Value': customer.phone || 'N/A' },
            { 'Field': 'Company', 'Value': customer.company || 'N/A' },
            { 'Field': 'Address', 'Value': customer.address || 'N/A' },
            { 'Field': 'Country', 'Value': customer.country || 'N/A' },
            { 'Field': 'Status', 'Value': customer.status || 'N/A' },
            { 'Field': 'Source', 'Value': customer.source || 'N/A' },
            { 'Field': 'Customer Since', 'Value': customer.createdAt ? formatInTimeZone(new Date(customer.createdAt), 'UTC', 'dd MMM yyyy') : 'N/A' },
            { 'Field': 'Notes', 'Value': customer.notes || 'N/A' },
        ];
        const customerInfoWs = XLSX.utils.json_to_sheet(customerInfoData, { skipHeader: true });
        customerInfoWs['!cols'] = [{ wch: 20 }, { wch: 50 }];

        const financialSummaryData = [
            { 'Metric': 'Total Revenue (CNY)', 'Value': financials.totalRevenue.toFixed(2) },
            { 'Metric': 'Cost of Goods Sold (CNY)', 'Value': financials.cogs.toFixed(2) },
            { 'Metric': 'Gross Profit (CNY)', 'Value': financials.grossProfit.toFixed(2) },
            { 'Metric': 'Gross Profit Margin (%)', 'Value': financials.grossProfitMargin.toFixed(2) },
            { 'Metric': 'Operating Expenses (CNY)', 'Value': financials.operatingExpenses.toFixed(2) },
            { 'Metric': 'Net Profit (CNY)', 'Value': financials.netProfit.toFixed(2) },
        ];
        const financialWs = XLSX.utils.json_to_sheet(financialSummaryData);

        const orderHistoryData = (customer.orders || []).map(order => ({
            'Order #': order.orderNumber,
            'Date': formatInTimeZone(new Date(order.orderDate), 'UTC', 'dd MMM yyyy'),
            'Status': order.status,
            'Total (CNY)': order.totalAmount.toFixed(2)
        }));
        const orderHistoryWs = XLSX.utils.json_to_sheet(orderHistoryData);

        const invoiceHistoryData = (customer.invoices || []).map(invoice => ({
            'Invoice #': invoice.invoiceNumber,
            'Date': formatInTimeZone(new Date(invoice.issueDate), 'UTC', 'dd MMM yyyy'),
            'Status': invoice.status,
            'Total (CNY)': invoice.totalAmount.toFixed(2)
        }));
        const invoiceHistoryWs = XLSX.utils.json_to_sheet(invoiceHistoryData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, customerInfoWs, "Customer Info");
        XLSX.utils.book_append_sheet(wb, financialWs, "Financial Summary");
        XLSX.utils.book_append_sheet(wb, orderHistoryWs, "Order History");
        XLSX.utils.book_append_sheet(wb, invoiceHistoryWs, "Invoice History");

        XLSX.writeFile(wb, `${customer.name}_profile.xlsx`);
    };

    const formatCurrency = (amount: number) => {
        return (
            <div className="text-right">
                <div className="font-semibold">¥{amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{currency.symbol}{(amount * exchangeRate).toFixed(2)}</div>
            </div>
        );
    };

    const financials = customer.financials;

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                 {/* This space is for the back button from the parent */}
                 {children}
                 <Button onClick={handleExport} variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* First Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* The content is rendered by the server component */}
                </div>

                {/* Second Column */}
                <div className="lg:col-span-2 space-y-8">
                    {financials && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Revenue</span>{formatCurrency(financials.totalRevenue)}</div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>{formatCurrency(financials.cogs)}</div>
                            <Separator/>
                            <div className="flex justify-between items-center font-semibold"><span className="text-muted-foreground">Gross Profit</span>{formatCurrency(financials.grossProfit)}</div>
                            <Separator/>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Operating Expenses (commission, transport)</span>{formatCurrency(financials.operatingExpenses)}</div>
                            <Separator/>
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Net Profit</span>
                                <div className={`${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(financials.netProfit)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             {/* The rest of the content is rendered by the server component */}
        </div>
    );
}

// Wrapper component to combine server and client logic
const PageWrapper = ({ customer, children }: { customer: Customer, children: React.ReactNode }) => {
    return (
        <CustomerProfileClient customer={customer}>
            {children}
        </CustomerProfileClient>
    );
};

export default PageWrapper;
