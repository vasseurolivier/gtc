import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { TranslatedContent } from '@/components/shared/translated-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Lightbulb, Package, Wifi } from 'lucide-react';

const cities = [
  {
    id: "guangzhou",
    name: "Guangzhou (Canton)",
    subtitle: "La Capitale Mondiale du Commerce Traditionnel",
    description: "Historiquement l'un des plus anciens ports de commerce de Chine, Guangzhou est un hub incontournable. Célèbre pour la Foire de Canton, la plus grande foire commerciale au monde, la ville excelle dans une vaste gamme de produits, notamment le textile, les vêtements, les articles en cuir et l'électronique.",
    imageUrlId: "guangzhou-city",
    specialties: ["Textile & Habillement", "Foire de Canton", "Électronique", "Articles en cuir"],
    icon: <Building className="h-8 w-8 text-primary" />,
  },
  {
    id: "shenzhen",
    name: "Shenzhen",
    subtitle: "La Silicon Valley de l'Hardware",
    description: "Voisine de Hong Kong, Shenzhen est le cœur battant de l'innovation technologique en Chine. C'est l'épicentre mondial de la fabrication électronique, des composants aux produits finis. Si votre projet concerne les startups, la haute technologie, les gadgets ou tout ce qui est alimenté par une batterie, Shenzhen est votre destination.",
    imageUrlId: "shenzhen-city",
    specialties: ["Électronique grand public", "Composants", "Startups Tech", "Innovation"],
    icon: <Wifi className="h-8 w-8 text-primary" />,
  },
  {
    id: "yiwu",
    name: "Yiwu",
    subtitle: "Le plus Grand Marché de Gros au Monde",
    description: "Yiwu est une ville-marché unique, abritant l'immense 'International Trade City'. C'est le paradis pour le sourcing de petits articles, de biens de consommation courante, de jouets, de bijoux, de décorations et de papeterie. Idéal pour les acheteurs cherchant à commander de petites quantités (MOQ bas) sur une très grande variété de produits.",
    imageUrlId: "yiwu-city",
    specialties: ["Petites marchandises", "Jouets & Gadgets", "Bijoux & Accessoires", "Faibles MOQ"],
    icon: <Package className="h-8 w-8 text-primary" />,
  },
]

export default function TradeCitiesPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'trade-cities-hero');

  return (
    <>
      <section className="relative w-full h-[40vh] min-h-[300px] text-primary-foreground">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  <TranslatedContent content="Pôles Commerciaux Stratégiques en Chine" />
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="Découvrez les villes clés qui sont au cœur du commerce mondial et comment nous vous y donnons accès." />
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container space-y-20">
          {cities.map((city, index) => {
            const image = PlaceHolderImages.find(p => p.id === city.imageUrlId);
            const isOdd = index % 2 !== 0;

            return (
              <div key={city.id} className="grid md:grid-cols-2 gap-12 items-center">
                <div className={`relative h-96 rounded-xl overflow-hidden shadow-lg ${isOdd ? 'md:order-last' : ''}`}>
                    {image && <Image src={image.imageUrl} alt={city.name} data-ai-hint={image.imageHint} fill className="object-cover"/>}
                </div>
                <div>
                  <div className="flex items-center gap-4">
                    {city.icon}
                    <h2 className="text-3xl font-headline font-bold text-primary">
                        <TranslatedContent content={city.name} />
                    </h2>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-muted-foreground">
                    <TranslatedContent content={city.subtitle} />
                  </div>
                  <div className="mt-4 text-muted-foreground leading-relaxed">
                    <TranslatedContent content={city.description} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {city.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        <TranslatedContent content={specialty} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
