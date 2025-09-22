
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Building, Target, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';


export default async function AboutPage({ params: { locale } }: { params: { locale: Locale } }) {
  const dictionary = await getDictionary(locale);
  const aboutPageDict = dictionary.aboutPage;

  const teamMembers = [
    {
      name: aboutPageDict.team.member1.name,
      role: aboutPageDict.team.member1.role,
      imageUrl: "/placeholder-user.jpg",
      bio: aboutPageDict.team.member1.bio
    },
    {
      name: aboutPageDict.team.member2.name,
      role: aboutPageDict.team.member2.role,
      imageUrl: "/placeholder-user.jpg",
      bio: aboutPageDict.team.member2.bio
    },
    {
      name: aboutPageDict.team.member3.name,
      role: aboutPageDict.team.member3.role,
      imageUrl: "/placeholder-user.jpg",
      bio: aboutPageDict.team.member3.bio
    }
  ];

  const values = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: aboutPageDict.values.value1.title,
      description: aboutPageDict.values.value1.description
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: aboutPageDict.values.value2.title,
      description: aboutPageDict.values.value2.description
    },
    {
      icon: <Building className="h-8 w-8 text-primary" />,
      title: aboutPageDict.values.value3.title,
      description: aboutPageDict.values.value3.description
    }
  ];

  const aboutHero = PlaceHolderImages.find(p => p.id === 'about-hero');

  return (
    <>
      <section className="relative w-full h-[40vh] min-h-[300px] text-primary-foreground">
        {aboutHero && (
          <Image
            src={aboutHero.imageUrl}
            alt={aboutHero.description}
            data-ai-hint={aboutHero.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {aboutPageDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {aboutPageDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                {aboutPageDict.aboutUs.title}
              </h2>
              <div className="mt-6 prose prose-lg max-w-none text-muted-foreground">
                <p>
                  {aboutPageDict.aboutUs.p1}
                </p>
                <p>
                  {aboutPageDict.aboutUs.p2}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {values.map(value => (
                <Card key={value.title}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {value.icon}
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">{value.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {aboutPageDict.team.title}
            </h2>
            <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {aboutPageDict.team.subtitle}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center">
                <div className="relative h-32 w-32 mx-auto mb-4 rounded-full overflow-hidden">
                    <Image src={member.imageUrl} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-headline font-bold">{member.name}</h3>
                <div className="text-primary font-semibold">{member.role}</div>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
