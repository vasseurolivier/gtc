
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import type { Invoice } from '@/actions/invoices';
import { getInvoiceById } from '@/actions/invoices';
import type { Customer } from '@/actions/customers';
import { getCustomerById } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { getProducts } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { InvoicePreview } from './invoice-preview';

async function getInvoiceData(id: string) {
    try {
        const invoice = await getInvoiceById(id);
        if (!invoice) {
            return { invoice: null, customer: null, products: [] };
        }
        const [customer, products] = await Promise.all([
            getCustomerById(invoice.customerId),
            getProducts()
        ]);
        return { invoice, customer, products };
    } catch (e) {
        console.error(e);
        return { invoice: null, customer: null, products: [] };
    }
}

export default function InvoicePreviewPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [data, setData] = useState<{ invoice: Invoice | null, customer: Customer | null, products: Product[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logo, setLogo] = useState('');

    useEffect(() => {
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
            setIsLoading(true);
            getInvoiceData(id)
                .then(setData)
                .finally(() => setIsLoading(false));
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

    if (!data?.invoice || !data?.customer) {
        return (
            <div className="container py-8">
                 <div className="mb-8 no-print">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/invoices">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Invoices
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Invoice not found or customer data is missing.
                </div>
            </div>
        );
    }
    
    const { invoice, customer, products } = data;

    return (
      <div className="container py-8 printable-area">
          <div className="flex justify-between items-center mb-8 no-print">
              <Button variant="ghost" asChild>
                  <Link href="/admin/invoices">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Invoices
                  </Link>
              </Button>
          </div>
          
          <InvoicePreview invoice={invoice} customer={customer} products={products} logo={logo} />
      </div>
    );
}
