
'use client';

import React, { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { CompanyInfoContext } from '@/context/company-info-context';

export function Favicon() {
  const [faviconUrl, setFaviconUrl] = useState('/favicon.ico'); // Fallback
  const companyInfoContext = useContext(CompanyInfoContext);

  useEffect(() => {
    if (companyInfoContext?.companyInfo.publicLogo) {
      setFaviconUrl(companyInfoContext.companyInfo.publicLogo);
    }
  }, [companyInfoContext]);

  return (
    <Head>
      <link rel="icon" href={faviconUrl} type="image/png" sizes="any" />
    </Head>
  );
}
