
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Globe, ChevronDown } from 'lucide-react';
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
import { i18n } from '@/i18n-config';
import Image from 'next/image';
import { CompanyInfoContext } from '@/context/company-info-context';


export function Header({ dictionary }: { dictionary: any }) {
  const pathname = usePathname();
  const [activePath, setActivePath] = useState(pathname);
  const [isClient, setIsClient] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const companyInfoContext = useContext(CompanyInfoContext);
  const publicLogo = companyInfoContext?.companyInfo?.publicLogo;

  useEffect(() => {
    setIsClient(true);
    
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

  const getCurrentLocale = () => {
    if (!pathname) return i18n.defaultLocale;
    const segments = pathname.split('/');
    if (segments.length > 1 && i18n.locales.includes(segments[1] as any)) {
      return segments[1];
    }
    return i18n.defaultLocale;
  }
  const locale = getCurrentLocale();

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

  const redirectedPathName = (newLocale: string) => {
    if (!pathname) return `/${newLocale}`
    const segments = pathname.split('/')
    segments[1] = newLocale
    return segments.join('/')
  }
  
  const localePrefixed = (path: string) => `/${locale}${path}`;

  const headerClasses = cn(
    "sticky top-0 z-50 w-full transition-all duration-300",
    isScrolled 
      ? "border-b bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80"
      : "bg-transparent border-transparent"
  );
  
  const linkClasses = (href: string, isServices = false) => {
    const fullPath = `/${locale}${href}`.replace(/\/$/, '');
    const currentBasePath = `/${locale}`;
    
    let isActive = false;
    if (isServices) {
        isActive = activePath.startsWith(`/${locale}/services`);
    } else if (href === '/') {
        isActive = activePath === `/${locale}` || activePath === `/${locale}/`;
    } else {
        isActive = activePath.startsWith(fullPath);
    }
     if (!isClient) return "relative transition-colors font-semibold text-lg text-white after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full hover:text-white/90";


    return cn(
      "relative transition-colors font-semibold text-lg text-white",
      "after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
      isActive ? "text-white after:w-full" : "hover:text-white/90"
    );
  };
  
  const dropdownTriggerClasses = cn(
    "relative flex items-center gap-1 transition-colors focus:outline-none font-semibold text-lg text-white",
     "after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
    isClient && activePath.startsWith(`/${locale}/services`)
      ? "text-white after:w-full"
      : "hover:text-white/90"
  );


  return (
    <header className={headerClasses}>
      <div className="container flex h-16 items-center justify-between">
        <Link href={localePrefixed('/')} className="flex items-center space-x-2">
          {publicLogo ? (
            <Image src={publicLogo} alt="Company Logo" width={40} height={15} className="object-contain" />
          ) : (
            <Globe className={cn("h-6 w-6", isScrolled ? "text-white" : "text-white")} />
          )}
          <span className={cn("font-bold sm:inline-block font-headline text-lg", isScrolled ? "text-white" : "text-white")}>
            Global Trading China
          </span>
        </Link>
        <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={localePrefixed(item.href)}
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
                        <Link href={localePrefixed(item.href)}>{item.label}</Link>
                    </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
                </DropdownMenu>
                <Link
                    key={citiesItem.href}
                    href={localePrefixed(citiesItem.href)}
                    className={linkClasses(citiesItem.href)}
                >
                    {citiesItem.label}
                </Link>
                <Link
                    key={contactItem.href}
                    href={localePrefixed(contactItem.href)}
                    className={linkClasses(contactItem.href)}
                >
                    {contactItem.label}
                </Link>
            </nav>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("text-white hover:text-white/90 hover:bg-white/10")}>
                        <Globe className="h-5 w-5" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    {i18n.locales.map(l => (
                        <DropdownMenuItem key={l} asChild>
                        <Link href={redirectedPathName(l)}>
                            {l === 'en' ? 'English' : 'Français'}
                        </Link>
                        </DropdownMenuItem>
                    ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="md:hidden">
                    <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("text-white hover:text-white hover:bg-white/10")}>
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-xs">
                        <Link href={localePrefixed('/')} className="mb-8 flex items-center space-x-2">
                        {publicLogo ? (
                            <Image src={publicLogo} alt="Company Logo" width={40} height={15} className="object-contain" />
                        ) : (
                            <>
                            <Globe className="h-6 w-6 text-primary" />
                            </>
                        )}
                        <span className="font-bold font-headline text-lg">Global Trading China</span>
                        </Link>
                        <nav className="flex flex-col space-y-2">
                        {navItems.map((item) => (
                            <Link
                            key={item.href}
                            href={localePrefixed(item.href)}
                            className={cn(
                                "text-lg font-medium transition-colors hover:text-primary py-2",
                                isClient && (activePath === localePrefixed(item.href) || (item.href === '/' && activePath === `/${locale}`)) ? "text-primary font-bold" : "text-foreground"
                            )}
                            >
                            {item.label}
                            </Link>
                        ))}
                        
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="services" className="border-b-0">
                                <AccordionTrigger className={cn(
                                "text-lg font-medium transition-colors hover:text-primary hover:no-underline py-2",
                                isClient && activePath.startsWith(`/${locale}/services`) ? "text-primary font-bold" : "text-foreground"
                                )}>
                                {dictionary.services}
                                </AccordionTrigger>
                                <AccordionContent className="pb-0 pl-4">
                                <nav className="flex flex-col space-y-2">
                                    {servicesItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={localePrefixed(item.href)}
                                        className={cn(
                                        "text-base font-medium transition-colors hover:text-primary py-2",
                                        isClient && activePath === localePrefixed(item.href) ? "text-primary font-bold" : "text-muted-foreground"
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
                            href={localePrefixed(citiesItem.href)}
                            className={cn(
                                "text-lg font-medium transition-colors hover:text-primary py-2",
                                isClient && activePath.startsWith(localePrefixed(citiesItem.href)) ? "text-primary font-bold" : "text-foreground"
                            )}
                            >
                            {citiesItem.label}
                            </Link>
                            <Link
                            key={contactItem.href}
                            href={localePrefixed(contactItem.href)}
                            className={cn(
                                "text-lg font-medium transition-colors hover:text-primary py-2",
                                isClient && activePath.startsWith(localePrefixed(contactItem.href)) ? "text-primary font-bold" : "text-foreground"
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
      </div>
    </header>
  );
}
