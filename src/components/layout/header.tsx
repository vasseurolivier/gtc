
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Globe, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useContext, useRef } from 'react';
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
  };

  const pathname = usePathname();
  const [activePath, setActivePath] = useState(pathname);
  const [isScrolled, setIsScrolled] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);
  const publicLogo = companyInfoContext?.companyInfo.publicLogo || '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial render
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  
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

  const isHomePage = activePath === '/';

  const headerClasses = cn(
    "fixed top-0 z-50 w-full transition-all duration-300",
    isScrolled || !isHomePage
      ? "border-b bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80"
      : "bg-transparent border-transparent"
  );
  
  const linkClasses = (href: string, isServices = false) => {
    let isActive = false;
    if (isServices) {
        isActive = activePath.startsWith('/services');
    } else if (href === '/') {
        isActive = activePath === `/`;
    } else {
        isActive = activePath.startsWith(href);
    }

    return cn(
      "relative transition-colors font-semibold text-lg text-white",
      "after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
      isActive ? "text-white after:w-full" : "hover:text-white/90"
    );
  };
  
  const dropdownTriggerClasses = cn(
    "relative flex items-center gap-1 transition-colors focus:outline-none font-semibold text-lg text-white",
     "after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
    activePath.startsWith('/services')
      ? "text-white after:w-full"
      : "hover:text-white/90"
  );


  return (
    <header className={headerClasses}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={'/'} className="flex items-center space-x-2">
            {publicLogo ? (
              <Image src={publicLogo} alt="Company Logo" width={50} height={50} className="object-contain invert brightness-0" />
            ) : (
              <div style={{width: '50px', height: '12px'}} />
            )}
            <span className={cn("font-bold sm:inline-block font-headline text-lg text-white hidden")}>
              Global <span className="text-red-500">Trading</span> China
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center space-x-6">
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
            <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("text-white hover:text-white hover:bg-white/10")}>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs">
                    <Link href={'/'} className="mb-8 flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                     {publicLogo ? (
                        <Image src={publicLogo} alt="Company Logo" width={50} height={12} className="object-contain" />
                     ) : (
                        <div style={{width: '50px', height: '12px'}} />
                     )}
                    <span className="font-bold font-headline text-lg hidden">Global Trading China</span>
                    </Link>
                    <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                        <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "text-lg font-medium transition-colors hover:text-primary py-2",
                            (activePath === item.href) ? "text-primary font-bold" : "text-foreground"
                        )}
                        >
                        {item.label}
                        </Link>
                    ))}
                    
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="services" className="border-b-0">
                            <AccordionTrigger className={cn(
                            "text-lg font-medium transition-colors hover:text-primary hover:no-underline py-2",
                            activePath.startsWith('/services') ? "text-primary font-bold" : "text-foreground"
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
                                    activePath === item.href ? "text-primary font-bold" : "text-muted-foreground"
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
                            activePath.startsWith(citiesItem.href) ? "text-primary font-bold" : "text-foreground"
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
                            activePath.startsWith(contactItem.href) ? "text-primary font-bold" : "text-foreground"
                        )}
                        >
                        {contactItem.label}
                        </Link>
                    </nav>
                </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
