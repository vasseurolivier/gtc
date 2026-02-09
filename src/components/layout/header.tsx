
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, ChevronDown, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useContext } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CompanyInfoContext } from '@/context/company-info-context';
import { useUser } from '@/firebase';

export function Header() {
  const dictionary = {
    home: 'Accueil',
    about: 'À Propos',
    services: 'Nos Services',
    allServices: 'Tous les services',
    sourcingAndPurchasing: 'Sourcing et Achat',
    tradingAndLogistics: 'Trading et Logistique',
    ecommerceSolutions: 'Solutions E-commerce',
    customServices: 'Services sur Mesure',
    tradeHubs: 'Pôles Commerciaux',
    contact: 'Contact',
    clientSpace: 'Espace Client',
  };

  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);
  const logoUrl = companyInfoContext?.companyInfo.logoCommercial || '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: dictionary.home },
    { href: '/about', label: dictionary.about },
  ];
  
  const servicesItems = [
    { href: '/services', label: dictionary.allServices },
    { href: '/services/sourcing', label: dictionary.sourcingAndPurchasing },
    { href: '/services/trading-logistics', label: dictionary.tradingAndLogistics },
    { href: '/services/ecommerce-solutions', label: dictionary.ecommerceSolutions },
    { href: '/services/custom-services', label: dictionary.customServices },
  ];
  
  const citiesItem = { href: '/trade-cities', label: dictionary.tradeHubs };
  const contactItem = { href: '/contact', label: dictionary.contact };

  const headerClasses = cn(
    "fixed top-0 z-50 w-full transition-all duration-500",
    isScrolled || pathname.startsWith('/client') || pathname.startsWith('/admin')
      ? "border-b bg-zinc-950/95 backdrop-blur-md shadow-lg"
      : "bg-transparent border-transparent"
  );
  
  const linkClasses = (href: string, isServices = false) => {
    let isActive = false;
    if (isServices) {
        isActive = pathname.startsWith('/services');
    } else if (href === '/') {
        isActive = pathname === `/`;
    } else {
        isActive = pathname.startsWith(href);
    }

    return cn(
      "relative transition-all duration-300 font-headline font-bold text-[10px] uppercase tracking-[0.1em] text-white/80 hover:text-white whitespace-nowrap",
      "after:content-[''] after:absolute after:left-0 after:bottom-[-6px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
      isActive ? "text-primary after:w-full" : ""
    );
  };
  
  const dropdownTriggerClasses = cn(
    "relative flex items-center gap-1 transition-all duration-300 focus:outline-none font-headline font-bold text-[10px] uppercase tracking-[0.1em] text-white/80 hover:text-white whitespace-nowrap",
     "after:content-[''] after:absolute after:left-0 after:bottom-[-6px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
    pathname.startsWith('/services')
      ? "text-primary after:w-full"
      : ""
  );

  if (pathname.startsWith('/admin') || (pathname.startsWith('/client') && pathname !== '/client/login')) {
    return null;
  }

  return (
    <header className={headerClasses}>
      <div className="container flex h-20 items-center px-4 md:px-8">
        <div className="flex items-center gap-2">
            <Link href={'/'} className="flex items-center transition-transform duration-300 hover:scale-105 shrink-0 mr-2">
                {logoUrl ? (
                  <div className="relative h-10 md:h-12 w-auto min-w-[40px]">
                    <Image 
                      src={logoUrl} 
                      alt="Logo" 
                      width={120}
                      height={48}
                      priority
                      unoptimized
                      className="h-full w-auto object-contain object-left" 
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-bold text-white shadow-lg">G</div>
                )}
            </Link>

            <nav className="hidden lg:flex items-center gap-4">
                {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={linkClasses(item.href)}
                >
                    {item.label}
                </Link>
                ))}
                <DropdownMenu>
                <DropdownMenuTrigger className={dropdownTriggerClasses}>
                    {dictionary.services} <ChevronDown className="h-3 w-3 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800 text-white min-w-[220px]">
                    {servicesItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild className="focus:bg-primary focus:text-white font-headline text-[10px] uppercase tracking-wider py-3 cursor-pointer">
                        <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
                </DropdownMenu>
                <Link
                    key={citiesItem.href}
                    href={citiesItem.href}
                    className={linkClasses(citiesItem.href)}
                >
                    {citiesItem.label}
                </Link>
                <Link
                    key={contactItem.href}
                    href={contactItem.href}
                    className={linkClasses(contactItem.href)}
                >
                    {contactItem.label}
                </Link>
            </nav>
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-4 shrink-0">
            <Button 
              variant="outline" 
              className={cn(
                "hidden sm:flex items-center gap-2 px-6 h-11 rounded-full transition-all duration-500",
                "font-headline text-[11px] font-black uppercase tracking-widest",
                "border-2 hover:scale-105 active:scale-95",
                mounted && user 
                  ? "border-green-500/50 text-white bg-green-500/10 hover:bg-green-500/20 hover:border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                  : "border-primary text-white bg-primary/5 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              )}
              asChild
            >
              <Link href="/client/login">
                <div className="relative">
                  <UserCircle className="h-5 w-5" />
                  {mounted && user && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border border-zinc-950"></span>
                    </span>
                  )}
                </div>
                <span>
                  {mounted && user ? "Mon Espace" : dictionary.clientSpace}
                </span>
              </Link>
            </Button>

            <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs bg-zinc-950 border-zinc-800 text-white">
                    <SheetHeader>
                      <SheetTitle className="text-white font-headline tracking-widest uppercase text-sm">Navigation</SheetTitle>
                      <SheetDescription className="text-zinc-500">Menu principal Global Trading China</SheetDescription>
                    </SheetHeader>
                    <div className="mt-12 flex flex-col space-y-4">
                    {navItems.map((item) => (
                        <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-sm font-headline font-bold uppercase tracking-widest transition-colors hover:text-primary py-2",
                            pathname === item.href ? "text-primary" : "text-white/80"
                        )}
                        >
                        {item.label}
                        </Link>
                    ))}
                    
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="services" className="border-b-0">
                            <AccordionTrigger className={cn(
                            "text-sm font-headline font-bold uppercase tracking-widest transition-colors hover:text-primary hover:no-underline py-2",
                            pathname.startsWith('/services') ? "text-primary" : "text-white/80"
                            )}>
                            {dictionary.services}
                            </AccordionTrigger>
                            <AccordionContent className="pb-0 pl-4">
                            <nav className="flex flex-col space-y-3 pt-2">
                                {servicesItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                    "text-[10px] font-headline font-medium uppercase tracking-widest transition-colors hover:text-primary py-1",
                                    pathname === item.href ? "text-primary" : "text-zinc-400"
                                    )}
                                >
                                    {item.label}
                                </Link>
                                ))}
                            </nav>
                            </AccordionContent>
                        </AccordionItem>
                        </Accordion>
                        <Link
                        key={citiesItem.href}
                        href={citiesItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-sm font-headline font-bold uppercase tracking-widest transition-colors hover:text-primary py-2",
                            pathname.startsWith(citiesItem.href) ? "text-primary" : "text-white/80"
                        )}
                        >
                        {citiesItem.label}
                        </Link>
                        <Link
                        key={contactItem.href}
                        href={contactItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-sm font-headline font-bold uppercase tracking-widest transition-colors hover:text-primary py-2",
                            pathname.startsWith(contactItem.href) ? "text-primary" : "text-white/80"
                        )}
                        >
                        {contactItem.label}
                        </Link>
                        <hr className="my-6 border-zinc-800" />
                        <Link
                        href="/client/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 text-sm font-headline font-black uppercase tracking-[0.2em] py-4 px-6 rounded-2xl transition-all",
                          mounted && user 
                            ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                            : "bg-primary/10 text-primary border border-primary/20"
                        )}
                        >
                        <div className="relative">
                          <UserCircle className="h-7 w-7" />
                          {mounted && user && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-zinc-950 rounded-full"></span>}
                        </div>
                        {mounted && user ? "Mon Espace" : "Connexion"}
                        </Link>
                    </div>
                </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
