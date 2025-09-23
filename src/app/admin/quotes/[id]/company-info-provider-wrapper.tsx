
'use client';

import { useContext } from 'react';
import { CompanyInfoContext, CompanyInfo } from '@/context/company-info-context';
import { Loader2 } from 'lucide-react';

export function CompanyInfoProviderWrapper({ children }: { children: (companyInfo: CompanyInfo) => React.ReactNode }) {
    const companyInfoContext = useContext(CompanyInfoContext);

    if (!companyInfoContext) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-4">Loading company info...</p>
            </div>
        );
    }

    return <>{children(companyInfoContext.companyInfo)}</>;
}
