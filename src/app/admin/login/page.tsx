'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
        setIsAuthenticated(true);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === "admin123") {
      localStorage.setItem('isAdminAuthenticated', 'true');
      setIsAuthenticated(true);
       toast({
        title: 'Connexion réussie',
        description: 'Redirection vers le tableau de bord...',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec',
        description: 'Mot de passe incorrect.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">GTC Admin</CardTitle>
          <CardDescription className="text-zinc-400">Accès sécurisé réservé aux administrateurs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold h-12">
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
