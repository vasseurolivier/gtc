
'use client';

import { useContext } from 'react';
import Head from 'next/head';
import { CompanyInfoContext } from '@/context/company-info-context';

export function Favicon() {
  const companyInfoContext = useContext(CompanyInfoContext);
  const publicLogo = companyInfoContext?.companyInfo?.publicLogo;

  if (!publicLogo) {
    return null;
  }

  return (
    <Head>
      <link rel="icon" href={publicLogo} type="image/png" sizes="any" />
    </Head>
  );
}
