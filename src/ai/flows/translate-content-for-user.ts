'use server';
/**
 * @fileOverview A content translation AI agent.
 *
 * - translateContentForUser - A function that translates content based on user preferences.
 * - TranslateContentForUserInput - The input type for the translateContentForUser function.
 * - TranslateContentForUserOutput - The return type for the translateContentForUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateContentForUserInputSchema = z.object({
  content: z.string().describe('The content to be translated.'),
  targetLanguage: z.enum(['en', 'fr']).describe('The target language for translation (en or fr).'),
});
export type TranslateContentForUserInput = z.infer<typeof TranslateContentForUserInputSchema>;

const TranslateContentForUserOutputSchema = z.object({
  translatedContent: z.string().describe('The translated content.'),
});
export type TranslateContentForUserOutput = z.infer<typeof TranslateContentForUserOutputSchema>;

export async function translateContentForUser(input: TranslateContentForUserInput): Promise<TranslateContentForUserOutput> {
  return translateContentForUserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateContentForUserPrompt',
  input: {schema: TranslateContentForUserInputSchema},
  output: {schema: TranslateContentForUserOutputSchema},
  prompt: `Translate the following content into {{targetLanguage}}:\n\n{{content}}`,
});

const translateContentForUserFlow = ai.defineFlow(
  {
    name: 'translateContentForUserFlow',
    inputSchema: TranslateContentForUserInputSchema,
    outputSchema: TranslateContentForUserOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
