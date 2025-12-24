
export default function PrivacyPolicyPage() {
  const pageDict = {
    title: "Politique de Confidentialité",
    introduction: "Cette politique de confidentialité décrit comment vos informations personnelles sont collectées, utilisées et partagées lorsque vous visitez ou effectuez un achat sur notre site.",
    section1: {
      title: "Informations Personnelles que nous Collectons",
      p1: "Lorsque vous visitez le site, nous collectons automatiquement certaines informations sur votre appareil. De plus, lorsque vous tentez de nous contacter via le site, nous collectons certaines informations vous concernant, notamment :",
      item1: "Votre nom",
      item2: "Votre adresse e-mail"
    },
    section2: {
      title: "Comment Utilisons-Nous Vos Informations Personnelles ?",
      p1: "Nous utilisons les informations que nous collectons généralement pour communiquer avec vous et pour filtrer nos commandes à la recherche de risques potentiels ou de fraudes."
    },
    section3: {
      title: "Partage de Vos Informations Personnelles",
      p1: "Nous ne partageons pas vos Informations Personnelles avec des tiers, sauf pour nous conformer aux lois et réglementations applicables, pour répondre à une assignation, un mandat de perquisition ou toute autre demande légale d'informations que nous recevons, ou pour protéger nos droits."
    },
    section4: {
      title: "Vos Droits",
      p1: "Si vous êtes un résident européen, vous avez le droit d'accéder aux informations personnelles que nous détenons à votre sujet et de demander que vos informations personnelles soient corrigées, mises à jour ou supprimées. Si vous souhaitez exercer ce droit, veuillez nous contacter."
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
            <ul className="list-disc pl-6 space-y-1">
                <li>{pageDict.section1.item1}</li>
                <li>{pageDict.section1.item2}</li>
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
