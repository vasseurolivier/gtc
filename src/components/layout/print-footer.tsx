
'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2 } from 'lucide-react';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext) {
        return <div className="print-footer fixed bottom-0 left-0 right-0 p-8 text-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
    }

    const { companyInfo } = companyInfoContext;

    return (
        <footer className="print-footer fixed bottom-0 left-0 right-0 p-8 text-center bg-white">
            <div className="pt-8 mt-8 border-t text-center text-xs text-muted-foreground">
                <p>Merci de votre confiance</p>
                <p>{companyInfo?.address}</p>
                <p>Email: {companyInfo?.email} | WhatsApp: {companyInfo?.phone}</p>
            </div>
        </footer>
    );
}
