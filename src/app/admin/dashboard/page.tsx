
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSubmissions, Submission } from '@/actions/submissions';
import { getOrders, Order } from '@/actions/orders';
import { getInvoices, Invoice } from '@/actions/invoices';
import { getQuotes, Quote } from '@/actions/quotes';
import { format, subDays, parseISO } from 'date-fns';
import { Loader2, Euro, ShoppingCart, CircleAlert, Package, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DailyRevenue {
  date: string;
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      try {
        const [ords, invs] = await Promise.all([
            getOrders(),
            getInvoices(),
        ]);
        setOrders(ords);
        setInvoices(invs);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [router]);
  
  const getStatusBadgeVariant = (status: any) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'shipped': return 'secondary';
        case 'processing': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'outline';
    }
  }

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const ordersToProcess = orders.filter(o => o.status === 'processing').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  
  const pendingAmount = invoices
    .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + (inv.totalAmount - (inv.amountPaid || 0)), 0);


  const getChartData = (): DailyRevenue[] => {
    const last30Days = Array(30).fill(0).map((_, i) => subDays(new Date(), i)).reverse();
    const dailyTotals: { [key: string]: number } = {};

    last30Days.forEach(day => {
      const formattedDate = format(day, 'MMM dd');
      dailyTotals[formattedDate] = 0;
    });
    
    invoices.filter(inv => inv.status === 'paid' && inv.issueDate).forEach(invoice => {
        try {
            const invoiceDate = format(parseISO(invoice.issueDate), 'MMM dd');
            if (dailyTotals.hasOwnProperty(invoiceDate)) {
                dailyTotals[invoiceDate] += invoice.totalAmount;
            }
        } catch (error) {
            // Ignore invoices with invalid date formats
            console.error(`Invalid date format for invoice ${invoice.id}:`, invoice.issueDate);
        }
    });
    
    return Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));
  };
  
  const chartData = getChartData();
  const recentOrders = orders.slice(0, 5);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders to Process</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersToProcess}</div>
            <p className="text-xs text-muted-foreground">Orders with "processing" status</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedOrders}</div>
            <p className="text-xs text-muted-foreground">Orders currently in transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From unpaid & overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Paid invoices revenue over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(value) => `¥${value}`}/>
                <Tooltip 
                  formatter={(value:any) => [`¥${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>The last 5 orders created.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? recentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href="/admin/orders" className="hover:underline flex items-center gap-2">
                         {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">¥{order.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                     <TableCell colSpan={4} className="h-24 text-center">
                        No recent orders.
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
