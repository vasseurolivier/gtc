"use client";

import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </LanguageProvider>
  );
}
