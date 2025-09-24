
'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { getInvoices, Invoice } from '@/actions/invoices';
import { getOrders, Order } from '@/actions/orders';
import { getQuotes, Quote } from '@/actions/quotes';
import { getProducts, Product } from '@/actions/products';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO } from 'date-fns';
import { Loader2, ArrowDownUp, TrendingUp, TrendingDown, Package, Banknote, Warehouse, Scale, Receipt, FileSpreadsheet } from 'lucide-react';
import { CurrencyContext } from '@/context/currency-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

type Period = 'last_30_days' | 'this_month' | 'last_quarter' | 'this_year' | 'all_time';

export default function FinancialReportPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');

  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      try {
        const [invs, ords, qts, prods] = await Promise.all([
            getInvoices(),
            getOrders(),
            getQuotes(),
            getProducts(),
        ]);
        setInvoices(invs);
        setOrders(ords);
        setQuotes(qts);
        setProducts(prods);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [router]);
  
  const getPeriodDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'last_30_days':
        return { start: subDays(now, 30), end: now };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_quarter':
        const lastQuarterStart = startOfQuarter(subDays(startOfQuarter(now), 1));
        return { start: lastQuarterStart, end: endOfQuarter(lastQuarterStart) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'all_time':
      default:
        return { start: new Date(0), end: now };
    }
  };

  const { start, end } = getPeriodDateRange();

  const paidInvoices = invoices.filter(inv => {
    if (inv.status !== 'paid' || !inv.paymentDate) return false;
    try {
        const paymentDate = parseISO(inv.paymentDate);
        return paymentDate >= start && paymentDate <= end;
    } catch (e) {
        return false;
    }
  });

  const revenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const productsBySku = new Map(products.map(p => [p.sku, p]));
  const ordersById = new Map(orders.map(o => [o.id, o]));
  const quotesById = new Map(quotes.map(q => [q.id, q]));

  const costOfGoodsSold = paidInvoices.reduce((totalCost, inv) => {
    const invoiceCost = inv.items.reduce((itemSum, item) => {
      const product = item.sku ? productsBySku.get(item.sku) : undefined;
      const purchasePrice = product?.purchasePrice || 0;
      return itemSum + (purchasePrice * item.quantity);
    }, 0);
    return totalCost + invoiceCost;
  }, 0);
  
  const operatingExpenses = paidInvoices.reduce((totalExpense, inv) => {
    if (!inv.orderId) return totalExpense;

    const order = ordersById.get(inv.orderId);
    if (!order || !order.quoteId) return totalExpense;

    const quote = quotesById.get(order.quoteId);
    if (!quote) return totalExpense;
    
    const transport = quote.transportCost || 0;
    const commission = (quote.subTotal + transport) * ((quote.commissionRate || 0) / 100);
    return totalExpense + transport + commission;
  }, 0);

  const grossProfit = revenue - costOfGoodsSold;
  const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netProfit = grossProfit - operatingExpenses;

  const accountsReceivable = invoices
    .filter(inv => ['unpaid', 'partially_paid', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.totalAmount - (inv.amountPaid || 0)), 0);
  
  const inventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.purchasePrice || 0)), 0);

  const formatCurrency = (amount: number) => {
    return (
        <div className="text-right">
            <div>¥{amount.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{currency.symbol}{(amount * exchangeRate).toFixed(2)}</div>
        </div>
    );
  };
  
  const handleExport = () => {
    const periodText = document.querySelector('.lucide-file-spreadsheet')?.parentElement?.parentElement?.querySelector('span')?.textContent || 'Selected Period';
    
    const data = [
        { Metric: 'Period', Value: periodText },
        { Metric: `Exchange Rate (1 CNY to ${currency.code})`, Value: exchangeRate },
        {},
        { Metric: '--- SUMMARY ---' },
        { Metric: 'Total Revenue (CNY)', Value: revenue },
        { Metric: 'Net Profit (CNY)', Value: netProfit },
        { Metric: 'Gross Profit Margin (%)', Value: grossProfitMargin },
        {},
        { Metric: '--- INCOME STATEMENT ---' },
        { Metric: 'Revenue (CNY)', Value: revenue },
        { Metric: 'Cost of Goods Sold (COGS) (CNY)', Value: costOfGoodsSold },
        { Metric: 'Gross Profit (CNY)', Value: grossProfit },
        { Metric: 'Operating Expenses (CNY)', Value: operatingExpenses },
        { Metric: 'Net Profit (CNY)', Value: netProfit },
        {},
        { Metric: '--- BALANCE SHEET OVERVIEW ---' },
        { Metric: 'Accounts Receivable (CNY)', Value: accountsReceivable },
        { Metric: 'Inventory Value (CNY)', Value: inventoryValue },
        { Metric: 'Total Current Assets (CNY)', Value: accountsReceivable + inventoryValue },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
    XLSX.writeFile(workbook, `financial_report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Financial Report</h1>
        <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {paidInvoices.length} paid invoices in the period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ¥{netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Gross Profit - Operating Expenses</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit Margin</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grossProfitMargin.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Profitability on products sold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income Statement (P&L)</CardTitle>
            <CardDescription>Profit and loss for the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500"/><span>Revenue</span></div>
                    {formatCurrency(revenue)}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-red-500"><TrendingDown className="h-5 w-5"/><span>Cost of Goods Sold (COGS)</span></div>
                    {formatCurrency(costOfGoodsSold)}
                </div>
                <Separator />
                 <div className="flex justify-between items-center font-semibold">
                    <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-muted-foreground"/><span>Gross Profit</span></div>
                    {formatCurrency(grossProfit)}
                </div>
                 <Separator />
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-red-500"><TrendingDown className="h-5 w-5"/><span>Operating Expenses</span></div>
                    {formatCurrency(operatingExpenses)}
                </div>
                 <Separator />
                  <div className="flex justify-between items-center font-bold text-xl">
                    <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/><span>Net Profit</span></div>
                    <div className={`text-right ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div>¥{netProfit.toFixed(2)}</div>
                        <div className="text-sm font-normal">{currency.symbol}{(netProfit * exchangeRate).toFixed(2)}</div>
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet Overview</CardTitle>
            <CardDescription>Key assets and liabilities snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="font-semibold text-lg">Assets</div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-blue-500"/><span>Accounts Receivable</span></div>
                    {formatCurrency(accountsReceivable)}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><Warehouse className="h-5 w-5 text-orange-500"/><span>Inventory Value</span></div>
                    {formatCurrency(inventoryValue)}
                </div>
                 <Separator />
                 <div className="flex justify-between items-center font-semibold">
                    <span>Total Current Assets</span>
                    {formatCurrency(accountsReceivable + inventoryValue)}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
