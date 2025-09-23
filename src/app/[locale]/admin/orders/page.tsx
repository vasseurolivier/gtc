
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des Commandes</h1>
       <Card>
          <CardHeader>
            <CardTitle>Section en construction</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Cette page permettra de suivre le statut de toutes vos commandes.
            </CardDescription>
          </CardContent>
        </Card>
    </div>
  );
}
