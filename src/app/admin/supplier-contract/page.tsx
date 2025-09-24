
'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CompanyInfoContext } from '@/context/company-info-context';
import { useToast } from '@/hooks/use-toast';

const contractSchema = z.object({
  supplierName: z.string().min(1, 'Le nom du fournisseur est requis.'),
  supplierAddress: z.string().min(1, "L'adresse du fournisseur est requise."),
  supplierRepresentative: z.string().min(1, 'Le nom du représentant est requis.'),
  productDescription: z.string().min(1, 'La description des produits est requise.'),
  productPrice: z.string().min(1, 'Le prix est requis.'),
  paymentTerms: z.string().min(1, 'Les conditions de paiement sont requises.'),
  deliveryLeadTime: z.string().min(1, 'Le délai de livraison est requis.'),
  qualityControl: z.string().min(1, 'Les modalités de contrôle qualité sont requises.'),
  contractDate: z.date(),
});

type ContractValues = z.infer<typeof contractSchema>;

export default function SupplierContractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const companyInfoContext = useContext(CompanyInfoContext);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  const form = useForm<ContractValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      supplierName: '',
      supplierAddress: '',
      supplierRepresentative: '',
      productDescription: '',
      productPrice: '',
      paymentTerms: '30% T/T à la commande, 70% T/T avant expédition après inspection validée.',
      deliveryLeadTime: '30-45 jours après réception du premier paiement.',
      qualityControl: 'Inspection finale selon AQL Niveau II, Majeur 2.5, Mineur 4.0.',
      contractDate: new Date(),
    },
  });

  const watchedValues = form.watch();
  const { companyInfo } = companyInfoContext || {};

  const handlePrint = () => {
    window.print();
  };
  
  if (!companyInfoContext) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const contractText = `
CONTRAT D'APPROVISIONNEMENT FOURNISSEUR

ENTRE LES SOUSSIGNÉS :

1. LE CLIENT :
${companyInfo?.name || '[Nom de votre société]'}
Adresse : ${companyInfo?.address || '[Adresse de votre société]'}
Représenté par : [Votre Nom], en sa qualité de [Votre Fonction].
Ci-après dénommé "le Client".

ET

2. LE FOURNISSEUR :
${watchedValues.supplierName || '[Nom du Fournisseur]'}
Adresse : ${watchedValues.supplierAddress || '[Adresse du Fournisseur]'}
Représenté par : ${watchedValues.supplierRepresentative || '[Nom du Représentant Fournisseur]'}, en sa qualité de [Fonction du Représentant].
Ci-après dénommé "le Fournisseur".

Ci-après collectivement dénommées "les Parties".

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 : OBJET DU CONTRAT
Le présent contrat a pour objet de définir les termes et conditions dans lesquels le Fournisseur s'engage à fabriquer et à vendre au Client les produits décrits ci-après.

ARTICLE 2 : DESCRIPTION DES PRODUITS
Description : ${watchedValues.productDescription || '[Description détaillée des produits, SKUs, matériaux, couleurs, etc.]'}

ARTICLE 3 : PRIX
Le prix des produits est fixé à : ${watchedValues.productPrice || '[Prix unitaire et total, devise (ex: 10,000 USD)]'}.
Ce prix est entendu FOB (Free On Board) [Port Chinois, ex: Shanghai], Incoterms 2020, sauf accord contraire écrit entre les Parties.

ARTICLE 4 : CONDITIONS DE PAIEMENT
Les conditions de paiement sont les suivantes :
${watchedValues.paymentTerms}

ARTICLE 5 : DÉLAI DE LIVRAISON
Le délai de livraison est de : ${watchedValues.deliveryLeadTime}. Ce délai court à compter de la date de réception effective par le Fournisseur du premier acompte.

ARTICLE 6 : CONTRÔLE QUALITÉ
Les modalités de contrôle qualité sont les suivantes :
${watchedValues.qualityControl}. Le Client se réserve le droit de mandater un tiers pour effectuer cette inspection. En cas de non-conformité majeure, le Fournisseur s'engage à reprendre et corriger la production à ses frais.

ARTICLE 7 : OBLIGATIONS DU FOURNISSEUR
- Livrer des produits conformes aux spécifications et aux normes de qualité convenues.
- Respecter les délais de livraison.
- Fournir toute la documentation nécessaire à l'exportation.

ARTICLE 8 : OBLIGATIONS DU CLIENT
- Effectuer les paiements selon l'échéancier convenu.
- Valider ou refuser les échantillons et rapports d'inspection dans des délais raisonnables.

ARTICLE 9 : CONFIDENTIALITÉ
Les Parties s'engagent à ne pas divulguer les informations confidentielles échangées dans le cadre de ce contrat.

ARTICLE 10 : DROIT APPLICABLE ET JURIDICTION
Le présent contrat est régi par le droit [français/chinois]. Tout litige relatif à son exécution sera soumis à la compétence exclusive du tribunal de commerce de [Votre Ville] ou à un arbitrage à [Lieu d'arbitrage, ex: CIETAC à Shanghai].

Fait à __________, le ${format(watchedValues.contractDate, 'd MMMM yyyy', { locale: fr })}.

En deux exemplaires originaux, un pour chaque Partie.


Pour le Client :
[Signature]
_________________________
[Votre Nom]
[Votre Fonction]


Pour le Fournisseur :
[Signature]
_________________________
${watchedValues.supplierRepresentative || '[Nom du Représentant Fournisseur]'}
[Fonction du Représentant]
`;


  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-3xl font-bold">Générateur de Contrat Fournisseur</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Exporter en PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Informations du Contrat</h3>
            <Form {...form}>
              <form className="space-y-4">
                <FormField control={form.control} name="supplierName" render={({ field }) => (
                  <FormItem><FormLabel>Nom du Fournisseur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="supplierAddress" render={({ field }) => (
                  <FormItem><FormLabel>Adresse du Fournisseur</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="supplierRepresentative" render={({ field }) => (
                  <FormItem><FormLabel>Représentant Légal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Separator />
                <FormField control={form.control} name="productDescription" render={({ field }) => (
                  <FormItem><FormLabel>Description des Produits</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="productPrice" render={({ field }) => (
                  <FormItem><FormLabel>Prix et Devise</FormLabel><FormControl><Input placeholder="ex: 15,000 USD" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem><FormLabel>Conditions de Paiement</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="deliveryLeadTime" render={({ field }) => (
                  <FormItem><FormLabel>Délai de Livraison</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="qualityControl" render={({ field }) => (
                  <FormItem><FormLabel>Contrôle Qualité</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            <div className="print-content">
                <Card>
                    <CardContent className="p-8">
                        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                            {contractText}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
