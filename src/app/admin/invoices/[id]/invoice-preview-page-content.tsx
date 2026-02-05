'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';

import type { Invoice } from '@/actions/invoices';
import { getInvoiceById } from '@/actions/invoices';
import { getCustomerById } from '@/actions/customers';
import { getRegisteredClientById } from '@/actions/registered-clients';
import type { Product } from '@/actions/products';
import { getProducts } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { InvoicePreview } from './invoice-preview';
import { CompanyInfoContext } from '@/context/company-info-context';


export default function InvoicePreviewPageContent() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [data, setData] = useState<{ invoice: Invoice | null, customer: any | null, products: Product[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const companyInfoContext = useContext(CompanyInfoContext);

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
          router.push('/admin/login');
          return;
        }

        if (id) {
            setIsLoading(true);
            async function getInvoiceData(id: string) {
                try {
                    const invoice = await getInvoiceById(id);
                    if (!invoice) {
                        return { invoice: null, customer: null, products: [] };
                    }
                    
                    // Try to fetch from registered clients first (since converted leads use Auth UID)
                    let clientData: any = await getRegisteredClientById(invoice.customerId);
                    
                    // Fallback to CRM customers if not found
                    if (!clientData) {
                        clientData = await getCustomerById(invoice.customerId);
                    }

                    const products = await getProducts();
                    
                    return { invoice, customer: clientData, products };
                } catch (e) {
                    console.error(e);
                    return { invoice: null, customer: null, products: [] };
                }
            }
            getInvoiceData(id)
                .then(setData)
                .finally(() => setIsLoading(false));
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

    if (!data?.invoice || !data?.customer) {
        return (
            <div className="container py-8">
                 <div className="mb-8">
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
      <div className="container py-8">
          <div className="flex justify-between items-center mb-8">
              <Button variant="ghost" asChild>
                  <Link href="/admin/invoices">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Invoices
                  </Link>
              </Button>
          </div>
          
          <InvoicePreview invoice={invoice} customer={customer} products={products} />
      </div>
    );
}
