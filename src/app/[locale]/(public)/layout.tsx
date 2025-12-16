
import { PublicProviders } from '@/components/layout/public-providers';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicProviders>
      {children}
    </PublicProviders>
  );
}
