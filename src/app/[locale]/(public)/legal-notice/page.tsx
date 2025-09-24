
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function LegalNoticePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);
  const pageDict = dictionary.legalNoticePage;

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          {pageDict.title}
        </h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold">{pageDict.section1.title}</h2>
            <p>{pageDict.section1.p1}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>{pageDict.section1.item1.label}</strong> {pageDict.section1.item1.value}</li>
              <li><strong>{pageDict.section1.item2.label}</strong> {pageDict.section1.item2.value}</li>
              <li><strong>{pageDict.section1.item3.label}</strong> <a href={`mailto:${pageDict.section1.item3.value}`} className="text-primary hover:underline">{pageDict.section1.item3.value}</a></li>
            </ul>
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
