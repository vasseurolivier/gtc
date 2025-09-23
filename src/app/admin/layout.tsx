
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
  Cog,
  Receipt,
  UploadCloud,
  Landmark
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppProviders } from '@/components/app-providers';
import '../globals.css';
import { CurrencyProvider, CurrencyContext } from '@/context/currency-context';
import { CompanyInfoProvider, CompanyInfoContext, CompanyInfo } from '@/context/company-info-context';
import { useContext, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function AdminSettings() {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Currency state
    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [localRate, setLocalRate] = useState('');
    
    // Company Info state
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyLogo, setCompanyLogo] = useState('');

    useEffect(() => {
        if (isDialogOpen) {
            if (currencyContext) {
                setSelectedCurrency(currencyContext.currency.code);
                setLocalRate(currencyContext.exchangeRate.toString());
            }
            if (companyInfoContext) {
                setCompanyName(companyInfoContext.companyInfo.name);
                setCompanyAddress(companyInfoContext.companyInfo.address);
                setCompanyEmail(companyInfoContext.companyInfo.email);
                setCompanyPhone(companyInfoContext.companyInfo.phone);
                setCompanyLogo(companyInfoContext.companyInfo.logo);
            }
        }
    }, [isDialogOpen, currencyContext, companyInfoContext]);

    if (!currencyContext || !companyInfoContext) {
        return null;
    }

    const { setCurrency, setExchangeRate } = currencyContext;
    const { setCompanyInfo } = companyInfoContext;
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    variant: 'destructive',
                    title: 'File too large',
                    description: 'Please upload a logo smaller than 2MB.',
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSave = () => {
        const newRate = parseFloat(localRate);
        if (isNaN(newRate) || newRate <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid exchange rate.'});
            return;
        }

        if (selectedCurrency === 'EUR') {
            setCurrency({ symbol: '€', code: 'EUR' });
        } else if (selectedCurrency === 'USD') {
            setCurrency({ symbol: '$', code: 'USD' });
        }
        
        setExchangeRate(newRate);
        
        setCompanyInfo({
            name: companyName,
            address: companyAddress,
            email: companyEmail,
            phone: companyPhone,
            logo: companyLogo
        });

        toast({ title: 'Success', description: 'Settings updated.'});
        setIsDialogOpen(false);
    };
    
    return (
        <>
            <Button variant="ghost" onClick={() => setIsDialogOpen(true)} className="justify-start w-full">
                <Cog className="mr-2 h-4 w-4" />
                Settings
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Admin Settings</DialogTitle>
                        <DialogDescription>Manage global settings for the admin dashboard.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div>
                            <h3 className="text-lg font-medium mb-4">Company Information</h3>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-name" className="text-right">Company Name</Label>
                                    <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="company-logo" className="text-right pt-2">Logo</Label>
                                    <div className="col-span-3 flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                            {companyLogo ? (
                                                <Image src={companyLogo} alt="Company Logo" width={96} height={96} className="object-contain rounded-md" />
                                            ) : (
                                                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <Input id="company-logo" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} className="w-auto" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="company-address" className="text-right pt-2">Address</Label>
                                    <Textarea id="company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="col-span-3" rows={3} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-email" className="text-right">Email</Label>
                                    <Input id="company-email" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-phone" className="text-right">Phone</Label>
                                    <Input id="company-phone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium mb-4">Currency Settings</h3>
                            <div className="grid gap-4">
                               <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="currency-select" className="text-right">Display Currency</Label>
                                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                        <SelectTrigger className="col-span-3" id="currency-select">
                                            <SelectValue placeholder="Select a currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EUR">Euro (€)</SelectItem>
                                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="exchange-rate" className="text-right">Rate (vs CNY)</Label>
                                    <Input id="exchange-rate" type="number" value={localRate} onChange={(e) => setLocalRate(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
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
    { href: '/admin/financial-report', icon: <Landmark />, label: 'Financial Report' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages' },
    { href: '/admin/customers', icon: <Users />, label: 'Customers' },
    { href: '/admin/quotes', icon: <FileText />, label: 'Proforma Invoices' },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Orders' },
    { href: '/admin/invoices', icon: <Receipt />, label: 'Invoices' },
    { href: '/admin/products', icon: <Package />, label: 'Products' },
  ];
  
  const activePath = pathname;

  return (
    <AppProviders>
      <CurrencyProvider>
        <CompanyInfoProvider>
          <SidebarProvider>
            <Sidebar className="no-print bg-muted/20">
              <SidebarContent>
                <SidebarHeader>
                  <h2 className="text-lg font-semibold">Global Trading China</h2>
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
                  <AdminSettings />
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
        </CompanyInfoProvider>
      </CurrencyProvider>
    </AppProviders>
  );
}
