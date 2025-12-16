
import { PublicProviders } from '@/components/layout/public-providers';
import { ReactNode } from 'react';

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <PublicProviders>
      {children}
    </PublicProviders>
  );
}
