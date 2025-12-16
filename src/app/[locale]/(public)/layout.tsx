
import { PublicProviders } from '@/components/layout/public-providers';
import { ReactNode } from 'react';

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <PublicProviders>
      {children}
    </PublicProviders>
  );
}
