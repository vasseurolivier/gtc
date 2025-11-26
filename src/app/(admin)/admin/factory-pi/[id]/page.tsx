
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import type { FactoryPi } from '@/actions/factory-pi';
import { getFactoryPiById } from '@/actions/factory-pi';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FactoryPiPreview } from './factory-pi-preview';

async function getPiData(id: string) {
    try {
        const factoryPi = await getFactoryPiById(id);
        if (!factoryPi) {
            return { factoryPi: null };
        }
        return { factoryPi };
    } catch (e) {
        console.error(e);
        return { factoryPi: null };
    }
}


export default function FactoryPiViewPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [factoryPi, setFactoryPi] = useState<FactoryPi | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logo, setLogo] = useState('');

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
          router.push('/admin/login');
          return;
        }

        const savedInfo = localStorage.getItem('adminCompanyInfo');
        if (savedInfo) {
            try {
                const parsedInfo = JSON.parse(savedInfo);
                setLogo(parsedInfo.logo || '');
            } catch (e) {
                console.error("Failed to parse company info from localStorage", e);
            }
        }

        if (id) {
            getPiData(id)
                .then(data => {
                    setFactoryPi(data.factoryPi);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [id, router]);

    if (isLoading) {
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
                <div className="mb-8 no-print">
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
        <div className="container py-8 printable-area">
            <div className="flex justify-between items-center mb-8 no-print">
                <Button variant="ghost" asChild>
                    <Link href="/admin/factory-pi">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Factory PIs
                    </Link>
                </Button>
            </div>
            
            <FactoryPiPreview factoryPi={factoryPi} logo={logo} />
        </div>
    );
}
