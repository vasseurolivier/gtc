
export default function ClientTermsPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">Conditions d'Utilisation de l'Espace Client</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">1. Objet de l'Espace Client</h2>
            <p>
              L'Espace Client de Global Trading China est un outil professionnel sécurisé destiné à faciliter les échanges commerciaux, le suivi du sourcing et la gestion des commandes entre nos clients et nos agents en Chine.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900">2. Accès et Sécurité</h2>
            <p>
              L'accès est strictement personnel. Chaque client est responsable de la confidentialité de ses identifiants. Toute action effectuée depuis un compte client est réputée avoir été effectuée par le titulaire du compte. Global Trading China se réserve le droit de suspendre tout compte en cas de suspicion d'usage frauduleux ou de non-respect des accords commerciaux.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900">3. Confidentialité des Données de Sourcing</h2>
            <p>
              Les informations de sourcing (fournisseurs, prix d'achat, fiches techniques) présentes dans l'espace client sont strictement confidentielles. Le client s'engage à ne pas divulguer ces informations à des tiers ou à tenter de contourner Global Trading China pour contacter directement les fournisseurs identifiés, conformément aux accords de non-contournement signés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900">4. Validation des Documents</h2>
            <p>
              La validation électronique d'une Proforma Invoice (PI) dans l'Espace Client vaut signature contractuelle et engagement de paiement. Le client est tenu de vérifier l'exactitude des spécifications techniques avant toute validation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900">5. Responsabilité Logistique</h2>
            <p>
              L'Espace Client permet de suivre l'état d'avancement de la logistique. Global Trading China décline toute responsabilité en cas de retard indépendant de sa volonté (grèves portuaires, météo, blocages douaniers imprévus) mais s'engage à informer le client en temps réel via la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900">6. Modifications des Conditions</h2>
            <p>
              Global Trading China se réserve le droit de modifier ces conditions à tout moment pour les adapter aux évolutions législatives ou techniques de la plateforme.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
