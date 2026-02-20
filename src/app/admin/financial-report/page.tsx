'use client';

import { useEffect, useState, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { getInvoices, Invoice } from '@/actions/invoices';
import { getOrders, Order } from '@/actions/orders';
import { getProducts, Product } from '@/actions/products';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, ArrowDownUp, TrendingUp, TrendingDown, Package, Banknote, Warehouse, Scale, Receipt, FileSpreadsheet, Wallet } from 'lucide-react';
import { CurrencyContext } from '@/context/currency-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Period = 'last_30_days' | 'this_month' | 'last_quarter' | 'this_year' | 'all_time';

export default function FinancialReportPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');

  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate: globalRate } = currencyContext;

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated') || localStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      try {
        const [invs, ords] = await Promise.all([
            getInvoices(),
            getOrders(),
        ]);
        setInvoices(invs);
        setOrders(ords);
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
  
  // Use a map for fast O(1) order lookup
  const ordersById = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);

  // Filter invoices for the period based on Issue Date (Accrual basis)
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.status === 'cancelled') return false;
      try {
        const issueDate = parseISO(inv.issueDate);
        return isWithinInterval(issueDate, { start, end });
      } catch (e) {
        return false;
      }
    });
  }, [invoices, start, end]);

  // Financial Calculations
  const metrics = useMemo(() => {
    let revenue = 0; // Total Invoiced (Accrual)
    let cashCollected = 0; // Total actually paid
    let costOfGoodsSold = 0;
    let transportExpenses = 0;
    let commissionExpenses = 0;

    filteredInvoices.forEach(inv => {
      revenue += (inv.totalAmount || 0);
      cashCollected += (inv.amountPaid || 0);
      
      // Calculate COGS if linked to an order
      if (inv.orderId) {
        const order = ordersById.get(inv.orderId);
        if (order) {
          const orderCost = order.items.reduce((sum, item) => sum + ((item.purchasePrice || 0) * item.quantity), 0);
          costOfGoodsSold += orderCost;
          
          transportExpenses += (order.transportCost || 0);
          
          // Commission calculation
          const subTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          if (order.commissionBasis === 'total') {
            commissionExpenses += (subTotal + (order.transportCost || 0)) * ((order.commissionRate || 0) / 100);
          } else {
            commissionExpenses += subTotal * ((order.commissionRate || 0) / 100);
          }
        }
      } else {
        // Handle manual invoices (best effort)
        costOfGoodsSold += (inv.supplierCostTotal || 0);
        transportExpenses += (inv.transportCost || 0);
        // Note: commission logic for manual invoices is simplified to total - cost - profit
      }
    });

    const grossProfit = revenue - costOfGoodsSold;
    const netProfit = grossProfit - transportExpenses - commissionExpenses;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      cashCollected,
      costOfGoodsSold,
      transportExpenses,
      commissionExpenses,
      grossProfit,
      netProfit,
      margin
    };
  }, [filteredInvoices, ordersById]);

  // Balance Sheet Metrics (Current status, regardless of period)
  const accountsReceivable = useMemo(() => {
    return invoices
      .filter(inv => ['unpaid', 'partially_paid', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.totalAmount - (inv.amountPaid || 0)), 0);
  }, [invoices]);

  const [inventoryValue, setInventoryValue] = useState(0);
  useEffect(() => {
    async function calculateInventory() {
        const products = await getProducts();
        const totalValue = products.reduce((sum, p) => sum + (p.stock * (p.purchasePrice || 0)), 0);
        setInventoryValue(totalValue);
    }
    calculateInventory();
  }, []);

  const formatCurrency = (amount: number) => {
    return (
        <div className="text-right">
            <div className="font-bold">¥{amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] text-muted-foreground">{currency.symbol}{(amount * globalRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
        </div>
    );
  };
  
  const handleExport = () => {
    const data = [
        { Metrique: 'Période', Valeur: period },
        { Metrique: `Taux de change (1 CNY vers ${currency.code})`, Valeur: globalRate },
        {},
        { Metrique: '--- SYNTHÈSE ---' },
        { Metrique: 'Chiffre d\'Affaires (CNY)', Valeur: metrics.revenue },
        { Metrique: 'Trésorerie Encaissée (CNY)', Valeur: metrics.cashCollected },
        { Metrique: 'Bénéfice Net Estimé (CNY)', Valeur: metrics.netProfit },
        { Metrique: 'Marge Brute (%)', Valeur: metrics.margin },
        {},
        { Metrique: '--- COMPTE DE RÉSULTAT (P&L) ---' },
        { Metrique: 'Revenus (Invoiced)', Valeur: metrics.revenue },
        { Metrique: 'Coût des Marchandises (COGS)', Valeur: metrics.costOfGoodsSold },
        { Metrique: 'Frais de Transport', Valeur: metrics.transportExpenses },
        { Metrique: 'Commissions Agents', Valeur: metrics.commissionExpenses },
        {},
        { Metrique: '--- BILAN ---' },
        { Metrique: 'Créances Clients (Encours)', Valeur: accountsReceivable },
        { Metrique: 'Valeur du Stock Global', Valeur: inventoryValue },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport Financier");
    XLSX.writeFile(workbook, `gtc_finance_${period}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Rapport Financier</h1>
          <p className="text-muted-foreground text-sm">Analyse de la performance et de la rentabilité.</p>
        </div>
        <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                <SelectTrigger className="w-[200px] h-11 font-bold">
                    <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="last_30_days">30 derniers jours</SelectItem>
                    <SelectItem value="this_month">Ce mois-ci</SelectItem>
                    <SelectItem value="last_quarter">Trimestre dernier</SelectItem>
                    <SelectItem value="this_year">Cette année</SelectItem>
                    <SelectItem value="all_time">Depuis le début</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="h-11 px-6 font-bold" onClick={handleExport}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exporter Excel
            </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-zinc-400">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">¥{metrics.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{filteredInvoices.length} factures émises</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-zinc-400">Trésorerie Encaissée</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600">¥{metrics.cashCollected.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Montants réellement reçus</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-zinc-400">Bénéfice Net</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-black", metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                ¥{metrics.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Après COGS, Transport et Comms</p>
          </CardContent>
        </Card>

         <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-zinc-400">Marge Brute</CardTitle>
            <Scale className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{metrics.margin.toFixed(1)}%</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Rentabilité sur produits</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-md border-none">
          <CardHeader className="bg-zinc-50 border-b">
            <CardTitle className="text-lg">Compte de Résultat (P&L)</CardTitle>
            <CardDescription>Flux financiers basés sur les factures émises.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><TrendingUp className="h-4 w-4"/></div>
                      <span className="font-bold">Chiffre d'Affaires</span>
                    </div>
                    {formatCurrency(metrics.revenue)}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600"><TrendingDown className="h-4 w-4"/></div>
                      <span className="font-medium text-zinc-600 text-sm">Coût des Marchandises (COGS)</span>
                    </div>
                    {formatCurrency(metrics.costOfGoodsSold)}
                </div>
                <Separator />
                 <div className="flex justify-between items-center">
                    <span className="font-black uppercase text-[10px] text-zinc-400">Résultat Brut</span>
                    <span className="font-black text-lg">¥{metrics.grossProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                </div>
                 <Separator />
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"><Truck className="h-4 w-4"/></div>
                      <span className="text-sm">Frais de Transport</span>
                    </div>
                    {formatCurrency(metrics.transportExpenses)}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"><Receipt className="h-4 w-4"/></div>
                      <span className="text-sm">Commissions</span>
                    </div>
                    {formatCurrency(metrics.commissionExpenses)}
                </div>
                 <Separator className="h-1 bg-zinc-900" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-zinc-900 uppercase">Bénéfice Net Estimé</span>
                    <div className={cn("text-right", metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                        <div className="text-3xl font-black">¥{metrics.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                        <div className="text-sm font-bold opacity-70">{currency.symbol}{(metrics.netProfit * globalRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none">
          <CardHeader className="bg-zinc-50 border-b">
            <CardTitle className="text-lg">État du Bilan & Encours</CardTitle>
            <CardDescription>Vue instantanée de vos actifs et créances.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-black text-[10px] uppercase text-primary tracking-widest">Actifs Circulants</h4>
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Receipt className="h-5 w-5"/></div>
                        <div>
                          <p className="font-bold">Créances Clients</p>
                          <p className="text-[10px] text-zinc-400 uppercase">Factures non réglées</p>
                        </div>
                      </div>
                      {formatCurrency(accountsReceivable)}
                  </div>
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><Warehouse className="h-5 w-5"/></div>
                        <div>
                          <p className="font-bold">Valeur du Stock</p>
                          <p className="text-[10px] text-zinc-400 uppercase">Basé sur prix d'achat</p>
                        </div>
                      </div>
                      {formatCurrency(inventoryValue)}
                  </div>
                </div>
                
                <Separator />
                
                <div className="p-6 bg-zinc-950 text-white rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500">Total Actif Estimé</p>
                      <p className="text-xs text-zinc-400 mt-1 italic">Trésorerie + Stock + Créances</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary">¥{(accountsReceivable + inventoryValue).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                      <div className="text-sm font-bold text-zinc-400">{currency.symbol}{((accountsReceivable + inventoryValue) * globalRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
