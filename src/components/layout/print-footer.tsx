'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Separator } from '../ui/separator';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext?.isCompanyInfoLoaded) {
        return null; // Don't render anything if info isn't loaded
    }

    const { companyInfo } = companyInfoContext;

    return (
        <div className="text-center text-xs text-muted-foreground pt-2">
            <Separator className="my-2" />
            <p>Merci de votre confiance</p>
            <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
            <p>{companyInfo?.address}</p>
        </div>
    );
}
