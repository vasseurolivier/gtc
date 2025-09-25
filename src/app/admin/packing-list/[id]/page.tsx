
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import type { PackingList } from '@/actions/packing-lists';
import { getPackingListById } from '@/actions/packing-lists';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PackingListPreview } from './packing-list-preview';
import { CompanyInfoProvider } from '@/context/company-info-context';
import { CurrencyProvider } from '@/context/currency-context';


export default function PackingListViewPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [packingList, setPackingList] = useState<PackingList | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logo, setLogo] = useState('');

    useEffect(() => {
        try {
            const savedInfo = localStorage.getItem('adminCompanyInfo');
            if (savedInfo) {
                const parsedInfo = JSON.parse(savedInfo);
                if (parsedInfo.logo) {
                    setLogo(parsedInfo.logo);
                }
            }
        } catch (e) {
            console.error("Could not load logo from local storage", e);
        }

        if (id) {
            getPackingListById(id)
                .then(data => {
                    setPackingList(data);
                })
                .catch(err => {
                    console.error("Failed to fetch packing list", err);
                    setPackingList(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="container py-8">
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!packingList) {
        return (
            <div className="container py-8">
                <div className="mb-8 no-print">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/packing-list">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Packing Lists
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Packing List not found.
                </div>
            </div>
        );
    }

    return (
        <CompanyInfoProvider>
            <CurrencyProvider>
                <div className="container py-8 bg-background printable-area">
                    <div className="flex justify-between items-center mb-8 no-print">
                        <Button variant="ghost" asChild>
                            <Link href="/admin/packing-list">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Packing Lists
                            </Link>
                        </Button>
                    </div>
                    
                    {packingList && <PackingListPreview packingList={packingList} logo={logo} />}
                </div>
            </CurrencyProvider>
        </CompanyInfoProvider>
    );
}
