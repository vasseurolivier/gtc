
import { getCustomerById } from '@/actions/customers';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CustomerProfileClient } from './customer-profile-client';


export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const customer = await getCustomerById(id);

    if (!customer) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Customers
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Customer not found.
                </div>
            </div>
        );
    }

    return <CustomerProfileClient customer={customer} />;
}
