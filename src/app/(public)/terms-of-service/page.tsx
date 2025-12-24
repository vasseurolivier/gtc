
export default function TermsOfServicePage() {
  const pageDict = {
    title: "Conditions Générales de Vente",
    introduction: "Ces Conditions Générales de Vente régissent votre utilisation de notre site web et des services que nous offrons. En accédant ou en utilisant le service, vous acceptez d'être lié par ces Conditions.",
    section1: {
      title: "Services",
      p1: "Nous fournissons des services de sourcing, de négoce et d'e-commerce depuis la Chine. Les spécificités de ces services seront définies dans un accord séparé ou un devis qui vous sera fourni."
    },
    section2: {
      title: "Obligations de l'Utilisateur",
      p1: "Vous vous engagez à n'utiliser notre site et nos services qu'à des fins légales. Vous devez fournir des informations exactes et complètes lors de la demande d'un devis ou de l'utilisation de nos services."
    },
    section3: {
      title: "Limitation de Responsabilité",
      p1: "Notre responsabilité sera limitée au montant que vous avez payé pour les services. Nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs."
    },
    section4: {
      title: "Droit Applicable",
      p1: "Ces Conditions seront régies et interprétées conformément aux lois de la République populaire de Chine, sans égard à ses dispositions en matière de conflit de lois."
    }
  };

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
