
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Mail,
  LogOut,
  Cog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppProviders } from '@/components/app-providers';
import '../globals.css';
import { CurrencyProvider, CurrencyContext } from '@/context/currency-context';
import { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function CurrencySettings() {
    const currencyContext = useContext(CurrencyContext);
    const { toast } = useToast();
    if (!currencyContext) {
        return null;
    }

    const { currency, exchangeRate, setCurrency, setExchangeRate } = currencyContext;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [localSymbol, setLocalSymbol] = useState(currency.symbol);
    const [localCode, setLocalCode] = useState(currency.code);
    const [localRate, setLocalRate] = useState(exchangeRate.toString());

    const handleSave = () => {
        const newRate = parseFloat(localRate);
        if (isNaN(newRate) || newRate <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid exchange rate.'});
            return;
        }
        setCurrency({ symbol: localSymbol, code: localCode });
        setExchangeRate(newRate);
        toast({ title: 'Success', description: 'Currency settings updated.'});
        setIsDialogOpen(false);
    };
    
    return (
        <>
            <Button variant="ghost" onClick={() => setIsDialogOpen(true)} className="justify-start w-full">
                <Cog className="mr-2 h-4 w-4" />
                Settings
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Currency Settings</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="currency-symbol" className="text-right">Symbol</Label>
                            <Input id="currency-symbol" value={localSymbol} onChange={(e) => setLocalSymbol(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="currency-code" className="text-right">Code</Label>
                            <Input id="currency-code" value={localCode} onChange={(e) => setLocalCode(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="exchange-rate" className="text-right">Exchange Rate (vs EUR)</Label>
                            <Input id="exchange-rate" type="number" value={localRate} onChange={(e) => setLocalRate(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSave}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages' },
    { href: '/admin/customers', icon: <Users />, label: 'Customers' },
    { href: '/admin/quotes', icon: <FileText />, label: 'Proforma Invoices' },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Orders' },
    { href: '/admin/products', icon: <Package />, label: 'Products' },
  ];
  
  const activePath = pathname;

  // Login page should not have the sidebar
  if (activePath.startsWith('/admin/login')) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body bg-background text-foreground antialiased">
                <AppProviders>
                    {children}
                </AppProviders>
            </body>
        </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
        <head>
            <title>Admin Dashboard</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body bg-background text-foreground antialiased">
            <AppProviders>
              <CurrencyProvider>
                <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                    <SidebarHeader>
                        <h2 className="text-lg font-semibold">TradeBridge Admin</h2>
                    </SidebarHeader>
                    <SidebarMenu>
                        {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                            <SidebarMenuButton asChild isActive={activePath === item.href || activePath.startsWith(`${item.href}/`)}>
                                <span>
                                {item.icon}
                                <span>{item.label}</span>
                                </span>
                            </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    <SidebarFooter>
                        <CurrencySettings />
                        <Button variant="ghost" onClick={handleLogout} className="justify-start w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                    </SidebarFooter>
                    </SidebarContent>
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
                </SidebarProvider>
              </CurrencyProvider>
            </AppProviders>
        </body>
    </html>
  );
}
