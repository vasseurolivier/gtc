"use client";

import { CompanyInfoProvider } from "@/context/company-info-context";

export function PublicProviders({ children }: { children: React.ReactNode }) {
    return (
        <CompanyInfoProvider>
            {children}
        </CompanyInfoProvider>
    );
}
