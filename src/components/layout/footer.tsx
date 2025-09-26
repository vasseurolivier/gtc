
"use client";

import { Mail, MapPin, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import { useContext } from 'react';
import Image from 'next/image';
import { CompanyInfoContext } from '@/context/company-info-context';


export function Footer({ dictionary }: { dictionary: any }) {
  const companyInfoContext = useContext(CompanyInfoContext);
  const publicLogo = companyInfoContext?.companyInfo?.publicLogo;

  return (
    <footer className="bg-secondary">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-secondary-foreground">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
                {publicLogo ? (
                  <Image src={publicLogo} alt="Company Logo" width={40} height={15} className="object-contain" />
                ) : (
                  <Globe className="h-7 w-7 text-primary" />
                )}
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
                <span className="text-muted-foreground">浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 shrink-0 text-primary"/>
                <span className="text-muted-foreground">+86 135 6477 0717</span>
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
