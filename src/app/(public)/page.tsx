
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { ContactSection } from '@/components/sections/contact-section';
import { Building2, ShieldCheck, Globe2, Zap } from 'lucide-react';

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
      
      {/* Social Proof / Stats Section */}
      <section className="py-12 bg-zinc-950 text-white overflow-hidden">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-primary">10+ Ans</div>
            <div className="text-xs md:text-sm text-zinc-400 uppercase tracking-widest font-semibold">D'Expertise Terrain</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-primary">1000+</div>
            <div className="text-xs md:text-sm text-zinc-400 uppercase tracking-widest font-semibold">Usines Auditées</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
            <div className="text-xs md:text-sm text-zinc-400 uppercase tracking-widest font-semibold">Clients Satisfaits</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl md:text-4xl font-bold text-primary">24h</div>
            <div className="text-xs md:text-sm text-zinc-400 uppercase tracking-widest font-semibold">Réponse Garantie</div>
          </div>
        </div>
      </section>

      <ServicesSection />
      
      {/* Why Us / Trust Section */}
      <section className="py-20 bg-zinc-50 border-y border-zinc-200">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 mb-4">Pourquoi choisir Global Trading China ?</h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">Nous levons toutes les barrières de l'importation pour sécuriser vos investissements.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Globe2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Présence Physique Locale</h3>
              <p className="text-zinc-600">Basés à Yiwu, nous sommes vos yeux et vos oreilles en Chine. Nous visitons les usines en personne, pas seulement sur le web.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Contrôle Qualité AQL</h3>
              <p className="text-zinc-600">Nous effectuons des inspections rigoureuses selon les normes internationales pour vous garantir zéro défaut à l'arrivée.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Logistique Sans Stress</h3>
              <p className="text-zinc-600">Du dédouanement au transport DDP, nous gérons toute la complexité administrative pour une livraison à votre porte.</p>
            </div>
          </div>
        </div>
      </section>

      <AboutSection />
      <ProcessSection />
      
      <section className="bg-card">
        <div className="container text-center pt-16 md:pt-24">
            <h2 className="text-3xl md:text-5xl font-headline font-bold">
              Prêt à lancer votre projet ?
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
