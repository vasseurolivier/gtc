
'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2 } from 'lucide-react';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext?.isCompanyInfoLoaded) {
        return null; // Don't render anything if info isn't loaded
    }

    const { companyInfo } = companyInfoContext;

    return (
        <footer className="print-footer">
            <div className="print-footer-content">
                <p>Merci de votre confiance</p>
                <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
                <p>{companyInfo?.address}</p>
            </div>
        </footer>
    );
}
