
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
        <div id="print-footer-template" className="pt-4 border-t text-center text-sm text-gray-500 bg-white" style={{ fontFamily: 'sans-serif' }}>
            <p>Merci de votre confiance</p>
            <p>{companyInfo?.address}</p>
            <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
        </div>
    );
}
