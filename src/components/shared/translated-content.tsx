"use client";
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { translateContentForUser } from '@/ai/flows/translate-content-for-user';
import { Skeleton } from '@/components/ui/skeleton';

interface TranslatedContentProps {
  content: string;
  as?: React.ElementType;
  className?: string;
}

export function TranslatedContent({ content, as: Component = 'span', ...props }: TranslatedContentProps) {
  const { language } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState<Record<string, string>>({ en: content });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (language !== 'en' && !translatedContent[language]) {
      const translate = async () => {
        setLoading(true);
        try {
          const result = await translateContentForUser({ content, targetLanguage: language });
          setTranslatedContent(prev => ({ ...prev, [language]: result.translatedContent }));
        } catch (error) {
          console.error("Translation failed:", error);
          setTranslatedContent(prev => ({ ...prev, [language]: content })); // fallback to original
        } finally {
          setLoading(false);
        }
      };
      translate();
    }
  }, [language, content, translatedContent]);

  const currentText = translatedContent[language] || (language === 'en' ? content : '');
  
  if (loading || (language !== 'en' && !currentText)) {
    return <Skeleton className="h-6 w-3/4 inline-block" />;
  }
  
  return <Component {...props}>{currentText || content}</Component>;
}
