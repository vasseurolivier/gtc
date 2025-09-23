
import { getInvoiceById, Invoice } from '@/actions/invoices';
import { getCustomerById, Customer } from '@/actions/customers';
import { getProducts, Product } from '@/actions/products';
import { PrintButton } from './print-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { InvoicePreview } from './invoice-preview';

type PageProps = {
  params: {
    id: string;
  };
};

async function getInvoiceData(id: string): Promise<{ invoice: Invoice | null, customer: Customer | null, products: Product[] }> {
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


export default async function InvoicePreviewPage({ params }: PageProps) {
    const { invoice, customer, products } = await getInvoiceData(params.id);

    if (!invoice || !customer) {
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

    return (
        <div className="container py-8 bg-background printable-area">
             <div className="flex justify-between items-center mb-8 no-print">
                <Button variant="ghost" asChild>
                    <Link href="/admin/invoices">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Invoices
                    </Link>
                </Button>
                <PrintButton />
            </div>
            
            <InvoicePreview invoice={invoice} customer={customer} products={products} />
        </div>
    );
}
