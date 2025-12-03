
'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2 } from 'lucide-react';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext) {
        return <div className="text-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
    }

    const { companyInfo } = companyInfoContext;

    return (
        <footer className="w-full pt-2 border-t text-center text-[8px] text-gray-500" style={{ fontFamily: 'sans-serif' }}>
            <p>Merci de votre confiance</p>
            <p>{companyInfo?.address}</p>
            <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
        </footer>
    );
}
