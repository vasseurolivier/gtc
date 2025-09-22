import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function PrivacyPolicyPage({ params: { locale } }: { params: { locale: Locale } }) {
  const dictionary = await getDictionary(locale);
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          {dictionary.privacyPolicyPage.title}
        </h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{dictionary.privacyPolicyPage.content}</p>
        </div>
      </div>
    </div>
  );
}
