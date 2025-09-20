"use client";

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border p-0.5">
      <Button
        variant={language === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        className="rounded-full h-8 px-3"
        onClick={() => setLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant={language === 'fr' ? 'secondary' : 'ghost'}
        size="sm"
        className="rounded-full h-8 px-3"
        onClick={() => setLanguage('fr')}
      >
        FR
      </Button>
    </div>
  );
}
