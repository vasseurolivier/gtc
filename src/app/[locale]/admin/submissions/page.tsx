
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now an alias for the dashboard.
// The content has been moved to the dashboard page.
export default function SubmissionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return null; 
}
