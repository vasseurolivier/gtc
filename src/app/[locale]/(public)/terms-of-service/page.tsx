
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function TermsOfServicePage({ params }: { params: { locale: Locale } }) {
  const dictionary = await getDictionary(params.locale);
  const pageDict = dictionary.termsOfServicePage;

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          {pageDict.title}
        </h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p>{pageDict.introduction}</p>
          <section>
            <h2 className="text-2xl font-semibold">{pageDict.section1.title}</h2>
            <p>{pageDict.section1.p1}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold">{pageDict.section2.title}</h2>
            <p>{pageDict.section2.p1}</p>
          </section>
           <section>
            <h2 className="text-2xl font-semibold">{pageDict.section3.title}</h2>
            <p>{pageDict.section3.p1}</p>
          </section>
           <section>
            <h2 className="text-2xl font-semibold">{pageDict.section4.title}</h2>
            <p>{pageDict.section4.p1}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
