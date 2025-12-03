
'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2 } from 'lucide-react';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext?.isCompanyInfoLoaded) {
        return <div className="text-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
    }

    const { companyInfo } = companyInfoContext;

    return (
        <footer className="mt-auto border-t pt-2 text-center text-[8px] text-gray-500 bg-white" style={{ fontFamily: 'sans-serif' }}>
            <p>Merci de votre confiance</p>
            <div className="leading-tight">
                <p>{companyInfo?.address}</p>
                <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
            </div>
        </footer>
    );
}
