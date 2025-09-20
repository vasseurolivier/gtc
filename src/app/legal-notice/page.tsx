import { TranslatedContent } from '@/components/shared/translated-content';

export default function LegalNoticePage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          <TranslatedContent content="Mentions Légales" />
        </h1>

        <div className="prose prose-lg max-w-none text-muted-foreground">
            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md my-6">
                <h4 className="font-bold">AVERTISSEMENT</h4>
                <p className="text-sm">
                    Ce modèle de mentions légales est fourni à titre indicatif. Il ne constitue pas un conseil juridique. Vous devez le vérifier et l'adapter à votre situation spécifique avec l'aide d'un professionnel du droit pour garantir votre conformité.
                </p>
            </div>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">1. Éditeur du Site</h2>
            <p>
                <strong>Dénomination sociale :</strong> Yiwu Huangqui Trading company limited.<br />
                <strong>Forme juridique :</strong> Société à responsabilité limitée de droit chinois<br />
                <strong>Adresse du siège social :</strong> 浙江省， 金华市， 义乌市， 小三里唐3区， 6栋二单元1501<br />
                <strong>Capital social :</strong> 5000 €<br />
                <strong>Numéro d'immatriculation :</strong> Notre société est enregistrée en Chine, les notions de RCS et de numéro de TVA intracommunautaire ne sont pas applicables.<br />
                <strong>Adresse e-mail :</strong> info@globaltradingchina.com<br />
                <strong>Téléphone :</strong> +86 135 6477 0717<br />
                <strong>Directeur de la publication :</strong> Vasseur Olivier
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">2. Hébergement du Site</h2>
            <p>
                <strong>Hébergeur :</strong> Google Firebase (App Hosting)<br />
                <strong>Société :</strong> Google LLC<br />
                <strong>Adresse :</strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA<br />
                <strong>Site web :</strong> <a href="https://firebase.google.com" target="_blank" rel="noopener noreferrer">firebase.google.com</a>
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">3. Propriété Intellectuelle</h2>
            <p>
                L'ensemble de ce site (contenus, textes, images, vidéos, logos) constitue une œuvre protégée par la législation en vigueur sur la propriété intellectuelle. Nul n'est autorisé à reproduire, exploiter, rediffuser ou utiliser à quelque titre que ce soit, même partiellement, des éléments du site sans l'accord préalable et écrit de Global Trading China.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">4. Données Personnelles</h2>
            <p>
                Les informations relatives à la collecte et au traitement des données personnelles sont fournies dans la Politique de Confidentialité du site.
            </p>
        </div>
      </div>
    </div>
  );
}
