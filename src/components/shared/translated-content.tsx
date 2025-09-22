"use client";

// This component is no longer needed for AI translation.
// It is kept for potential future use with a manual i18n library.
interface TranslatedContentProps {
  content: string;
  as?: React.ElementType;
  [key: string]: any; // Allow other props
}

export function TranslatedContent({ content, as: Component = 'span', ...props }: TranslatedContentProps) {
  return <Component {...props}>{content}</Component>;
}
