import { TranslatedContent } from '@/components/shared/translated-content';

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          <TranslatedContent content="Politique de Confidentialité" />
        </h1>

        <div className="prose prose-lg max-w-none text-muted-foreground">
            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md my-6">
                <h4 className="font-bold">AVERTISSEMENT</h4>
                <p className="text-sm">
                    Ce modèle de politique de confidentialité est un exemple et ne constitue pas un conseil juridique. Il est impératif de le faire examiner par un avocat pour vous assurer qu'il est complet et conforme aux réglementations applicables (notamment le RGPD) pour votre activité.
                </p>
            </div>
            
            <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}</p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">1. Préambule</h2>
            <p>
                Global Trading China, soucieuse des droits des individus, notamment au regard des traitements automatisés et dans une volonté de transparence avec ses clients, a mis en place une politique reprenant l’ensemble de ces traitements, des finalités poursuivies par ces derniers ainsi que des moyens d’actions à la disposition des individus afin qu’ils puissent au mieux exercer leurs droits.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">2. Responsable du traitement</h2>
            <p>
                Le responsable du traitement des données personnelles est Global Trading China, dont les coordonnées sont précisées dans les mentions légales.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">3. Collecte des données</h2>
            <p>
                Les données personnelles pouvant être collectées sur le site sont principalement utilisées par l'éditeur pour la gestion des relations avec vous, et le cas échéant pour le traitement de vos commandes. Elles sont enregistrées dans le fichier de clients de l'éditeur.
            </p>
            <p>Les données collectées sont les suivantes :</p>
            <ul>
                <li>Nom et prénom</li>
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone</li>
                <li>Toute autre information que vous nous communiquez via le formulaire de contact.</li>
            </ul>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">4. Finalité des données collectées</h2>
            <p>
                La collecte de vos données a pour but de :
            </p>
            <ul>
                <li>Répondre à vos demandes de contact et de devis.</li>
                <li>Gérer la relation commerciale et le suivi des prestations.</li>
                <li>Envoyer des informations commerciales, si vous y avez consenti.</li>
            </ul>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">5. Vos droits sur vos données</h2>
            <p>
                Conformément à la réglementation sur les données personnelles (notamment le RGPD), vous disposez des droits suivants :
            </p>
            <ul>
                <li>Droit d’accès : vous pouvez exercer votre droit d'accès, pour connaître les données personnelles vous concernant.</li>
                <li>Droit de rectification : si les données personnelles détenues sont inexactes, vous pouvez demander la mise à jour des informations.</li>
                <li>Droit de suppression : vous pouvez demander la suppression de vos données à caractère personnel.</li>
                <li>Droit à la limitation du traitement.</li>
                <li>Droit de vous opposer au traitement des données.</li>
                <li>Droit à la portabilité.</li>
            </ul>
            <p>
                Vous pouvez exercer ces droits en nous contactant à l'adresse email : info@globaltradingchina.com, ou par courrier postal à l'adresse indiquée dans les mentions légales.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">6. Durée de conservation des données</h2>
            <p>
                Vos données sont conservées pendant la durée de la relation commerciale et pour une durée de trois ans à compter de la fin de celle-ci, à des fins de prospection commerciale.
            </p>

            <h2 className="text-2xl font-headline font-semibold mt-8 mb-4">7. Cookies</h2>
            <p>
                Le site peut collecter automatiquement des informations standards. Toutes les informations collectées indirectement ne seront utilisées que pour suivre le volume, le type et la configuration du trafic utilisant ce site, pour en développer la conception et l'agencement et à d'autres fins administratives et de planification.
            </p>
        </div>
      </div>
    </div>
  );
}
