
"use client";

import Link from 'next/link';
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
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Image from 'next/image';
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
  const publicLogo = companyInfoContext?.companyInfo.publicLogo || '';
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
  ]
  
  const citiesItem = { href: '/trade-cities', label: dictionary.tradeHubs };
  const contactItem = { href: '/contact', label: dictionary.contact };

  const headerClasses = cn(
    "fixed top-0 z-50 w-full transition-all duration-300",
    isScrolled || pathname.startsWith('/client') || pathname.startsWith('/admin')
      ? "border-b bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80"
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
      "relative transition-colors font-semibold text-lg text-white",
      "after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full",
      isActive ? "text-red-500 after:w-full" : "hover:text-white/90"
    );
  };
  
  const dropdownTriggerClasses = cn(
    "relative flex items-center gap-1 transition-colors focus:outline-none font-semibold text-lg text-white",
     "after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full",
    pathname.startsWith('/services')
      ? "text-red-500 after:w-full"
      : "hover:text-white/90"
  );

  if (pathname.startsWith('/admin') || (pathname.startsWith('/client') && pathname !== '/client/login')) {
    return null;
  }

  return (
    <header className={headerClasses}>
      <div className="container flex h-16 items-center">
        <div className="flex flex-1 items-center gap-6">
            <Link href={'/'} className="flex items-center space-x-2">
                {mounted && publicLogo ? (
                <Image src={publicLogo} alt="Company Logo" width={45} height={45} className="object-contain invert brightness-0" />
                ) : (
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-white">G</div>
                )}
            </Link>
             <nav className="hidden lg:flex items-center space-x-6">
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
                    {dictionary.services} <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {servicesItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
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
        
        <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden sm:flex border-white text-primary hover:bg-white hover:text-black font-bold" asChild>
              <Link href="/client/login">
                <UserCircle className="mr-2 h-5 w-5" />
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
                <SheetContent side="left" className="w-full max-w-xs">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                      <SheetDescription>Navigation principale</SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 flex flex-col space-y-2">
                    {navItems.map((item) => (
                        <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-lg font-medium transition-colors hover:text-primary py-2",
                            pathname === item.href ? "text-primary font-bold" : "text-foreground"
                        )}
                        >
                        {item.label}
                        </Link>
                    ))}
                    
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="services" className="border-b-0">
                            <AccordionTrigger className={cn(
                            "text-lg font-medium transition-colors hover:text-primary hover:no-underline py-2",
                            pathname.startsWith('/services') ? "text-primary font-bold" : "text-foreground"
                            )}>
                            {dictionary.services}
                            </AccordionTrigger>
                            <AccordionContent className="pb-0 pl-4">
                            <nav className="flex flex-col space-y-2">
                                {servicesItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                    "text-base font-medium transition-colors hover:text-primary py-2",
                                    pathname === item.href ? "text-primary font-bold" : "text-muted-foreground"
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
                            "text-lg font-medium transition-colors hover:text-primary py-2",
                            pathname.startsWith(citiesItem.href) ? "text-primary font-bold" : "text-foreground"
                        )}
                        >
                        {citiesItem.label}
                        </Link>
                        <Link
                        key={contactItem.href}
                        href={contactItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-lg font-medium transition-colors hover:text-primary py-2",
                            pathname.startsWith(contactItem.href) ? "text-primary font-bold" : "text-foreground"
                        )}
                        >
                        {contactItem.label}
                        </Link>
                        <hr className="my-4" />
                        <Link
                        href="/client/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-bold text-primary py-2"
                        >
                        <UserCircle className="h-6 w-6" />
                        {mounted && user ? "Mon Espace Client" : "Connexion Client"}
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
