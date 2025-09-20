import { TranslatedContent } from '@/components/shared/translated-content';

export default function TermsOfServicePage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          <TranslatedContent content="Conditions Générales de Vente" />
        </h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground">
            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md my-6">
                <h4 className="font-bold">AVERTISSEMENT</h4>
                <p className="text-sm">
                    Ce document est un modèle générique de Conditions Générales de Vente (CGV) et ne constitue en aucun cas un conseil juridique. Chaque entreprise étant unique, il est indispensable de faire rédiger, vérifier et adapter vos CGV par un avocat ou un juriste spécialisé pour qu'elles soient valides et couvrent les spécificités de votre activité.
                </p>
            </div>

            <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}</p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 1 : Objet</h2>
            <p>
                Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre la société Global Trading China et ses clients dans le cadre de ses services de sourcing, négoce, et solutions e-commerce. Toute commande passée implique l'adhésion entière et sans réserve du client à ces CGV.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 2 : Prestations</h2>
            <p>
                Global Trading China propose des prestations de conseil et d'intermédiation commerciale. La société agit en tant que mandataire pour le compte de ses clients. Les services détaillés sont décrits sur les pages correspondantes du site www.globaltradingchina.com.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 3 : Commandes et Devis</h2>
            <p>
                Toute prestation fait l'objet d'un devis détaillé, valable pour une durée de [ex: 30] jours. La commande est considérée comme ferme et définitive à réception du devis signé par le client, accompagné du paiement de l'acompte éventuellement demandé.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 4 : Tarifs et Paiement</h2>
            <p>
                Les prix des prestations sont indiqués en euros hors taxes (HT). Les modalités de paiement sont précisées sur le devis (acompte, solde, etc.). Le paiement s'effectue par [virement bancaire, etc.].
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 5 : Responsabilité</h2>
            <p>
                Global Trading China est soumise à une obligation de moyens. Elle met en œuvre toute son expertise pour mener à bien sa mission. Cependant, elle ne saurait être tenue pour responsable des défaillances des fournisseurs, des transporteurs, ou de tout autre tiers, ni des défauts de conformité des marchandises qui relèvent de la responsabilité du fabricant. Le contrôle qualité effectué par Global Trading China vise à réduire ces risques mais ne constitue pas une garantie absolue.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 6 : Force Majeure</h2>
            <p>
                La responsabilité de Global Trading China ne pourra pas être mise en œuvre si la non-exécution ou le retard dans l'exécution de l'une de ses obligations décrites dans les présentes CGV découle d'un cas de force majeure.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">Article 7 : Droit Applicable et Litiges</h2>
            <p>
                Les présentes conditions générales sont soumises au droit [français, belge, etc.]. En cas de litige, et après une tentative de recherche de solution amiable, compétence expresse est attribuée au Tribunal de Commerce de [Ville].
            </p>
        </div>
      </div>
    </div>
  );
}
