
'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Separator } from '../ui/separator';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext?.isCompanyInfoLoaded) {
        return null;
    }

    const { companyInfo } = companyInfoContext;

    return (
        <div className="absolute bottom-0 left-8 right-8 text-center text-[8px] text-muted-foreground py-2">
            <Separator className="my-2" />
            <p>Merci de votre confiance</p>
            <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
            <p>{companyInfo?.address}</p>
            <div className="mt-1 text-[6px] opacity-30">© Global Trading China - Document Officiel</div>
        </div>
    );
}
