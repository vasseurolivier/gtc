
export default function LegalNoticePage() {
  const pageDict = {
    title: "Mentions Légales",
    section1: {
      title: "Éditeur du Site",
      p1: "Ce site est édité par la société Global Trading China.",
      item1: { label: "Raison Sociale :", value: "Global Trading China" },
      item2: { label: "Adresse :", value: "浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501" },
      item3: { label: "Email :", value: "info@globaltradingchina.com" }
    },
    section2: {
      title: "Hébergement",
      p1: "Ce site est hébergé par Firebase Hosting, un service de Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA."
    },
    section3: {
      title: "Propriété Intellectuelle",
      p1: "Tout le contenu présent sur le site, incluant, de façon non limitative, les graphismes, images, textes, vidéos, animations, sons, logos, gifs et icônes ainsi que leur mise en forme sont la propriété exclusive de la société Global Trading China à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs."
    },
    section4: {
      title: "Responsabilité",
      p1: "Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes. Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email, en décrivant le problème de la manière la plus précise possible."
    }
  };

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
