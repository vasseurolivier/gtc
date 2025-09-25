
'use client';

import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Loader2 } from 'lucide-react';

export function PrintFooter() {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext) {
        return <div className="print-footer"><Loader2 className="h-4 w-4 animate-spin" /></div>;
    }

    const { companyInfo } = companyInfoContext;

    return (
        <footer className="print-footer hidden">
            <div className="text-xs">
                <span>{companyInfo.name}</span> | 
                <span> {companyInfo.address}</span> | 
                <span> Email: {companyInfo.email}</span> | 
                <span> Phone: {companyInfo.phone}</span>
            </div>
        </footer>
    );
}
