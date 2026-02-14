
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateEmail } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  ShieldCheck, 
  Save, 
  Loader2, 
  CheckCircle2,
  Fingerprint,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateClientProfile, updateClientCredentials } from '@/actions/registered-clients';

export default function ClientProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // States for form
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');

  const clientRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'clients', user.uid);
  }, [db, user]);

  const { data: profile, isLoading } = useDoc(clientRef);

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setCompanyName(profile.companyName || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      // 1. Check if email changed and update Auth
      if (email !== profile?.email) {
        try {
          await updateEmail(user, email);
          // If auth update succeeds, also update Firestore credentials record
          await updateClientCredentials(user.uid, email);
        } catch (authError: any) {
          if (authError.code === 'auth/requires-recent-login') {
            toast({ 
              variant: "destructive", 
              title: "Action requise", 
              description: "Pour changer votre email de connexion, veuillez vous déconnecter puis vous reconnecter avant de réessayer." 
            });
            setIsSaving(false);
            return;
          }
          throw authError;
        }
      }

      // 2. Update Firestore Profile
      const result = await updateClientProfile(user.uid, {
        phone,
        companyName,
        address
      });

      if (result.success) {
        toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées avec succès." });
      } else {
        toast({ variant: "destructive", title: "Erreur", description: result.message });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Mon Profil</h1>
          <p className="text-zinc-500">Gérez vos informations personnelles et vos coordonnées de livraison.</p>
        </div>
        {profile?.status === 'validated' && (
          <Badge className="bg-green-500 hover:bg-green-600 h-8 px-4 gap-2">
            <CheckCircle2 className="h-4 w-4" /> Compte Validé
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100">
              <CardTitle className="text-sm font-bold uppercase text-zinc-400 tracking-widest">Compte</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                  {profile?.firstName?.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-zinc-900">{profile?.firstName} {profile?.lastName}</div>
                  <div className="text-xs text-zinc-500">Client depuis {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '-'}</div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-600 truncate">{profile?.email}</span>
                </div>
                {profile?.clientNumber && (
                  <div className="flex items-center gap-3 text-sm">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    <span className="font-bold text-primary">N° Client: {profile.clientNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5" /> Sécurité des données
            </h4>
            <p className="text-xs text-primary/70 leading-relaxed">
              Vos informations sont utilisées exclusivement pour la gestion de vos ordres de sourcing, la facturation et l'organisation logistique de vos imports.
            </p>
          </div>
        </div>

        <Card className="md:col-span-2 border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle>Détails du Profil</CardTitle>
            <CardDescription>Ces informations seront utilisées pour vos bons de commande et proformas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Email de connexion</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                      id="email" 
                      type="email"
                      className="pl-10" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 italic flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Changer l'email changera votre identifiant de connexion.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Téléphone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                      id="phone" 
                      className="pl-10" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+33..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="font-bold">Nom de l'entreprise</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    id="company" 
                    className="pl-10" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="SARL..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="font-bold">Adresse de livraison par défaut</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Textarea 
                    id="address" 
                    className="pl-10 min-h-[100px]" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Indiquez ici votre adresse habituelle ou l'entrepôt de destination..."
                  />
                </div>
                <p className="text-[10px] text-zinc-400 italic">Cette adresse sera pré-remplie lors de vos prochaines commandes.</p>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="h-12 px-8 font-bold" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
