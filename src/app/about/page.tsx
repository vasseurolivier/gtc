import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TranslatedContent } from '@/components/shared/translated-content';

const teamMembers = [
  {
    name: "Jean Dupont",
    role: "PDG et Fondateur",
    avatar: "https://picsum.photos/seed/jd/100/100",
    bio: "Avec 20 ans d'expérience dans le commerce international, Jean a fondé TradeBridge pour simplifier les échanges avec la Chine.",
  },
  {
    name: "Marie Dubois",
    role: "Responsable Sourcing",
    avatar: "https://picsum.photos/seed/md/100/100",
    bio: "Spécialiste de la chaîne d'approvisionnement, Marie excelle dans la recherche des meilleurs fournisseurs pour nos clients.",
  },
  {
    name: "Chen Wei",
    role: "Responsable Logistique",
    avatar: "https://picsum.photos/seed/cw/100/100",
    bio: "Basé à Guangzhou, Chen assure que toutes les opérations logistiques se déroulent sans accroc, de l'usine au client.",
  },
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
                  <TranslatedContent content="Notre Mission : Votre Succès Global" />
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="Nous connectons les entreprises du monde entier aux opportunités uniques qu'offre la Chine, en offrant une expertise locale et des solutions complètes." />
              </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline font-bold text-primary">
                <TranslatedContent content="Qui Sommes-Nous ?" />
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                <TranslatedContent content="Fondée sur les principes de confiance, de transparence et d'efficacité, TradeBridge Global est bien plus qu'une simple société de négoce. Nous sommes votre partenaire stratégique sur le terrain en Chine. Notre mission est de simplifier la complexité du commerce international et de rendre le sourcing, la production et l'expédition accessibles à tous, des petites entreprises aux grandes multinationales." />
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                <TranslatedContent content="Notre équipe multiculturelle combine une connaissance approfondie du marché chinois avec une compréhension des attentes des marchés occidentaux, créant ainsi un pont solide pour vos ambitions commerciales." />
              </p>
            </div>
            <div>
              <Card>
                <CardContent className="p-8 space-y-4">
                  <div>
                    <h3 className="font-headline font-semibold text-xl">Notre Vision</h3>
                    <p className="text-muted-foreground mt-2">Devenir le partenaire de confiance incontournable pour toutes les entreprises cherchant à prospérer grâce au commerce avec la Chine.</p>
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
              <TranslatedContent content="Rencontrez Notre Équipe" />
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              <TranslatedContent content="Des experts passionnés et dévoués à votre service." />
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center p-6">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <CardHeader className="p-0">
                  <CardTitle className="font-headline text-xl">{member.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                  <p className="text-primary font-semibold">{member.role}</p>
                  <p className="text-muted-foreground text-sm mt-3">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
