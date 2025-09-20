import { Mail, MapPin, Phone, Globe } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-secondary-foreground">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Globe className="h-7 w-7 text-primary" />
                <h3 className="text-xl font-headline font-semibold">TradeBridge Global</h3>
            </div>
            <p className="text-sm text-muted-foreground">Your partner in global sourcing and trading from China.</p>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold">Contact Us</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-1 shrink-0 text-primary"/>
                <span className="text-muted-foreground">123 Trading Hub, Guangzhou, China 510000</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 shrink-0 text-primary"/>
                <span className="text-muted-foreground">+86 123 4567 8900</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 shrink-0 text-primary"/>
                <span className="text-muted-foreground">contact@tradebridge.global</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold">Services</h3>
            <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/#services" className="text-muted-foreground hover:text-primary transition-colors">Trading</Link></li>
                <li><Link href="/#services" className="text-muted-foreground hover:text-primary transition-colors">Sourcing</Link></li>
                <li><Link href="/#services" className="text-muted-foreground hover:text-primary transition-colors">E-commerce Solutions</Link></li>
                <li><Link href="/#services" className="text-muted-foreground hover:text-primary transition-colors">Bespoke Services</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TradeBridge Global. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
