
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getOrders, Order } from '@/actions/orders';
import { getInvoices, Invoice } from '@/actions/invoices';
import { getRegisteredClients, RegisteredClient } from '@/actions/registered-clients';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Euro, CircleAlert, Package, Truck, UserCheck, ArrowRight, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DailyRevenue {
  date: string;
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      try {
        const [ords, invs, clis] = await Promise.all([
            getOrders(),
            getInvoices(),
            getRegisteredClients()
        ]);
        setOrders(ords);
        setInvoices(invs);
        setClients(clis);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated]);
  
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

  const ordersToProcess = orders.filter(o => o.status === 'processing');
  const pendingClients = clients.filter(c => c.status === 'pending');
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
            console.error(`Invalid date format for invoice ${invoice.id}:`, invoice.issueDate);
        }
    });
    
    return Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));
  };
  
  const chartData = getChartData();
  const recentOrders = orders.slice(0, 5);
  const recentClients = clients.slice(0, 5);


  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de Bord</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {format(new Date(), 'HH:mm')}</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Demandes à traiter</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{ordersToProcess.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Commandes en attente de Proforma</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Comptes à valider</CardTitle>
            <UserCheck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-orange-600">{pendingClients.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Nouveaux inscrits en attente d'accès</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Chiffre d'Affaires</CardTitle>
            <Euro className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">¥{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">Basé sur les factures payées</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">En-cours Client</CardTitle>
            <CircleAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">¥{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">Montant total des factures impayées</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Évolution du Revenu</CardTitle>
            <CardDescription>Revenu des factures payées sur les 30 derniers jours.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(value) => `¥${value}`}/>
                <Tooltip 
                  formatter={(value:any) => [`¥${value.toFixed(2)}`, 'Revenu']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* New Clients Activity */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nouveaux Clients</CardTitle>
              <CardDescription>Dernières inscriptions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/registered-clients"><ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {recentClients.length > 0 ? recentClients.map(client => (
                  <TableRow key={client.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/admin/registered-clients/${client.id}`)}>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{client.firstName} {client.lastName}</span>
                        <span className="text-[10px] text-muted-foreground">{client.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {client.status === 'pending' ? (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 text-[10px]">À VALIDER</Badge>
                      ) : (
                        <Badge className="bg-green-500 text-[10px]">ACTIF</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell className="h-24 text-center text-muted-foreground">Aucun client inscrit.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dernières Commandes & Demandes</CardTitle>
            <CardDescription>Suivi des flux de sourcing en temps réel.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">Voir toutes les commandes</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right pr-6">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length > 0 ? recentOrders.map(order => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="pl-6 font-bold">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{format(new Date(order.orderDate), 'dd MMM yyyy', { locale: fr })}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="text-[10px] uppercase">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 font-black">¥{order.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                   <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Aucune commande récente.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
