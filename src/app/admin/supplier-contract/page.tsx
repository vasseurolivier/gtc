
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SupplierContractPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Supplier Contract</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Page en Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cette page est actuellement en cours de maintenance pour corriger un problème technique. Elle sera de retour prochainement.</p>
        </CardContent>
      </Card>
    </div>
  );
}
