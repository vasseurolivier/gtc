"use client";

interface TranslatedContentProps {
  content: string;
  as?: React.ElementType;
  [key: string]: any; // Allow other props
}

export function TranslatedContent({ content, as: Component = 'span', ...props }: TranslatedContentProps) {
  // For now, just render the content directly.
  // This component can be replaced later with a real i18n implementation.
  return <Component {...props}>{content}</Component>;
}
