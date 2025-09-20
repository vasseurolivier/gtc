"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Globe, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
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


export function Header() {
  const pathname = usePathname();
  const [activePath, setActivePath] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setActivePath(pathname);
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Accueil' },
    { href: '/about', label: 'À propos' },
  ];
  
  const servicesItems = [
    { href: '/services', label: 'Tous les services' },
    { href: '/services/sourcing', label: 'Sourcing et Achat' },
    { href: '/services/trading-logistics', label: 'Trading et Logistique' },
    { href: '/services/ecommerce-solutions', label: 'Solutions E-commerce' },
    { href: '/services/custom-services', label: 'Services sur Mesure' },
  ]
  
  const citiesItem = { href: '/trade-cities', label: 'Pôles Commerciaux' };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline text-lg">
              TradeBridge Global
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  isClient && activePath === item.href ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                  "flex items-center gap-1 transition-colors hover:text-primary focus:outline-none",
                  isClient && activePath.startsWith('/services') ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                Services <ChevronDown className="h-4 w-4" />
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
                className={cn(
                  "transition-colors hover:text-primary",
                  isClient && activePath === citiesItem.href ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {citiesItem.label}
              </Link>
          </nav>
        </div>

        <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs">
                <Link href="/" className="mb-8 flex items-center space-x-2">
                  <Globe className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline text-lg">TradeBridge Global</span>
                </Link>
                <nav className="flex flex-col space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary py-2",
                        isClient && activePath === item.href ? "text-primary font-bold" : "text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                   <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="services" className="border-b-0">
                        <AccordionTrigger className={cn(
                          "text-lg font-medium transition-colors hover:text-primary hover:no-underline py-2",
                          isClient && activePath.startsWith('/services') ? "text-primary font-bold" : "text-foreground"
                        )}>
                          Services
                        </AccordionTrigger>
                        <AccordionContent className="pb-0 pl-4">
                          <nav className="flex flex-col space-y-2">
                            {servicesItems.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                  "text-base font-medium transition-colors hover:text-primary py-2",
                                  isClient && activePath === item.href ? "text-primary font-bold" : "text-muted-foreground"
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
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary py-2",
                        isClient && activePath === citiesItem.href ? "text-primary font-bold" : "text-foreground"
                      )}
                    >
                      {citiesItem.label}
                    </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        
        <div className="flex flex-1 items-center justify-end">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
