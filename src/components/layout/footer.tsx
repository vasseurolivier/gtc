import { Mail, MapPin, Phone, Globe } from 'lucide-react';
import Link from 'next/link';

export function Footer({ dictionary }: { dictionary: any }) {
  return (
    <footer className="bg-secondary">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-secondary-foreground">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Globe className="h-7 w-7 text-primary" />
                <h3 className="text-xl font-headline font-semibold">Global Trading China</h3>
            </div>
            <div className="text-sm text-muted-foreground">{dictionary.tagline}</div>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold">{dictionary.navigation}</h3>
            <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.home}</Link></li>
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.about}</Link></li>
                <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.services}</Link></li>
                 <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.contact}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold">{dictionary.legal}</h3>
            <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/legal-notice" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.legalNotice}</Link></li>
                <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.privacyPolicy}</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">{dictionary.termsOfService}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold">{dictionary.contactUs}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-1 shrink-0 text-primary"/>
                <span className="text-muted-foreground">上海市浦东新区456弄123号2号楼501室</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 shrink-0 text-primary"/>
                <span className="text-muted-foreground">+86 135 6477 0717 (téléphone et Whatsapp)</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 shrink-0 text-primary"/>
                <span className="text-muted-foreground">info@globaltradingchina.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <div>© 2023 Global Trading China. {dictionary.rightsReserved}</div>
        </div>
      </div>
    </footer>
  );
}

    