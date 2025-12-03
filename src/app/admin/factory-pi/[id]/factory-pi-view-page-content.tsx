'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';

import type { FactoryPi } from '@/actions/factory-pi';
import { getFactoryPiById } from '@/actions/factory-pi';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FactoryPiPreview } from './factory-pi-preview';
import { CompanyInfoContext } from '@/context/company-info-context';

export default function FactoryPiViewPageContent() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [factoryPi, setFactoryPi] = useState<FactoryPi | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const companyInfoContext = useContext(CompanyInfoContext);

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
          router.push('/admin/login');
          return;
        }

        if (id) {
            getFactoryPiById(id)
                .then(data => {
                    setFactoryPi(data);
                })
                .catch(err => {
                    console.error("Failed to fetch factory PI", err);
                    setFactoryPi(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [id, router]);

    if (isLoading || !companyInfoContext?.isCompanyInfoLoaded) {
        return (
            <div className="container py-8">
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!factoryPi) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/factory-pi">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Factory PIs
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Factory PI not found.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/factory-pi">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Factory PIs
                    </Link>
                </Button>
            </div>
            
            <FactoryPiPreview factoryPi={factoryPi} />
        </div>
    );
}
