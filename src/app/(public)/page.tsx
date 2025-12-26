import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { ContactSection } from '@/components/sections/contact-section';

export default function Home() {
    const dictionary = {
    contactSection: {
      title: "Contactez-nous",
      subtitle: "Vous avez un projet ou une question ? Remplissez le formulaire ci-dessous et notre équipe vous répondra sous 24 heures.",
      form: {
        name: { label: "Votre nom", placeholder: "Jean Dupont" },
        email: { label: "Votre email", placeholder: "jean.dupont@exemple.com" },
        phone: { label: "Téléphone / WhatsApp", placeholder: "+33 6 12 34 56 78" },
        subject: { label: "Sujet de votre demande", placeholder: "Sourcing de produits textiles" },
        message: { label: "Votre message", placeholder: "Décrivez-nous votre projet, les produits que vous recherchez, les quantités estimées, etc." },
        submit: "Envoyer votre demande"
      },
      office: {
        title: "Nos bureaux",
        address: "浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501",
        phone: "+86 135 6477 0717",
        email: "info@globaltradingchina.com"
      },
      toast: {
        success: { title: "Message envoyé !", description: "Merci de nous avoir contactés. Nous reviendrons vers vous rapidement." },
        error: { title: "Échec de l'envoi", db: "Un problème est survenu avec la connexion à la base de données. Veuillez vérifier vos règles de sécurité Firestore.", unexpected: "Une erreur inattendue est survenue. Veuillez réessayer." }
      }
    }
  };

  return (
    <>
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <ProcessSection />
      <section className="bg-card">
        <div className="container text-center pt-16 md:pt-24">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Nous contacter
            </h2>
            <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {dictionary.contactSection.subtitle}
            </div>
          </div>
        <ContactSection dictionary={dictionary.contactSection} />
      </section>
    </>
  );
}
