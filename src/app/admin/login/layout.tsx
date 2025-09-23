import { AppProviders } from '@/components/app-providers';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      {children}
    </AppProviders>
  );
}
