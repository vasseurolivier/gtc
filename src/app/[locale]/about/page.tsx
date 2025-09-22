import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2 } from 'lucide-react';

const advantages = [
  {
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
    title: "Expertise Locale Approfondie",
    description: "Notre présence sur le terrain en Chine nous donne une compréhension inégalée du marché, des fournisseurs et de la culture des affaires locales."
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
    title: "Communication Transparente",
    description: "Nous assurons une communication claire et constante en français, anglais et mandarin, éliminant les barrières linguistiques et les malentendus."
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
    title: "Contrôle Qualité Rigoureux",
    description: "De l'audit d'usine aux inspections finales, nous nous assurons que vos produits respectent les normes les plus strictes avant leur expédition."
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
    title: "Solutions Complètes",
    description: "Nous gérons l'ensemble du processus, du sourcing à la logistique, vous permettant de vous concentrer sur la croissance de votre entreprise."
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
    title: "Partenariat Stratégique",
    description: "Nous ne sommes pas un simple intermédiaire, mais un partenaire engagé dans votre succès à long terme sur le marché mondial."
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
    title: "Optimisation des Coûts",
    description: "Grâce à notre réseau et à notre pouvoir de négociation, nous vous aidons à obtenir les meilleurs prix sans compromettre la qualité."
  }
];

export default function AboutPage() {
  const aboutHeroImage = PlaceHolderImages.find(p => p.id === 'about-hero');

  return (
    <>
      <section className="relative w-full h-[40vh] min-h-[300px] text-primary-foreground">
        {aboutHeroImage && (
          <Image
            src={aboutHeroImage.imageUrl}
            alt={aboutHeroImage.description}
            data-ai-hint={aboutHeroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  Notre Mission : Votre Succès Global
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  Nous connectons les entreprises du monde entier aux opportunités uniques qu'offre la Chine, en offrant une expertise locale et des solutions complètes.
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline font-bold text-primary">
                Qui Sommes-Nous ?
              </h2>
              <div className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Fondée sur les principes de confiance, de transparence et d'efficacité, Global Trading China est bien plus qu'une simple société de négoce. Nous sommes votre partenaire stratégique sur le terrain en Chine. Notre mission est de simplifier la complexité du commerce international et de rendre le sourcing, la production et l'expédition accessibles à tous, des petites entreprises aux grandes multinationales.
              </div>
              <div className="mt-4 text-muted-foreground leading-relaxed">
                Notre équipe multiculturelle combine une connaissance approfondie du marché chinois avec une compréhension des attentes des marchés occidentaux, créant ainsi un pont solide pour vos ambitions commerciales.
              </div>
            </div>
            <div>
              <Card>
                <CardContent className="p-8 space-y-4">
                  <div>
                    <h3 className="font-headline font-semibold text-xl">Notre Vision</h3>
                    <div className="text-muted-foreground mt-2">Devenir le partenaire de confiance incontournable pour toutes les entreprises cherchant à prospérer grâce au commerce avec la Chine.</div>
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-xl">Nos Valeurs</h3>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Intégrité et Transparence</li>
                      <li>Orientation Client</li>
                      <li>Excellence Opérationnelle</li>
                      <li>Partenariat à Long Terme</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Pourquoi Nous Choisir ?
            </h2>
            <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Les avantages clés qui font de nous votre partenaire idéal en Chine.
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage) => (
              <Card key={advantage.title} className="p-6 text-left">
                  {advantage.icon}
                  <CardHeader className="p-0 mt-4">
                    <CardTitle className="font-headline text-xl">
                      {advantage.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <div className="text-muted-foreground text-sm">
                      {advantage.description}
                    </div>
                  </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
