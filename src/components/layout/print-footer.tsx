
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
                <div className="font-bold">{companyInfo.name}</div>
                <div>{companyInfo.address}</div>
                <div>Email: {companyInfo.email} | Phone: {companyInfo.phone}</div>
            </div>
        </footer>
    );
}

