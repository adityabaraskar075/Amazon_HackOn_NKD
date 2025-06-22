
'use server';
/**
 * @fileOverview Summarizes the key risk factors from a GNN model's fraud assessment.
 *
 * - summarizeRiskFactors - A function that summarizes the risk factors.
 * - SummarizeRiskFactorsInput - The input type for the summarizeRiskFactors function.
 * - SummarizeRiskFactorsOutput - The return type for the summarizeRiskFactors function.
 */

import { ai } from '@/ai/genkit'; // Use ai for this flow
import {z} from 'genkit';

const SummarizeRiskFactorsInputSchema = z.object({
  riskScore: z.number().describe('The risk score of the transaction graph.'),
  riskFactors: z.array(z.string()).describe('The key factors contributing to the risk score.'),
});
export type SummarizeRiskFactorsInput = z.infer<typeof SummarizeRiskFactorsInputSchema>;

const SummarizeRiskFactorsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key risk factors.'),
});
export type SummarizeRiskFactorsOutput = z.infer<typeof SummarizeRiskFactorsOutputSchema>;

export async function summarizeRiskFactors(input: SummarizeRiskFactorsInput): Promise<SummarizeRiskFactorsOutput> {
  return summarizeRiskFactorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeRiskFactorsPrompt',
  input: {schema: SummarizeRiskFactorsInputSchema},
  output: {schema: SummarizeRiskFactorsOutputSchema},
  prompt: `You are an expert in fraud detection. Please summarize the key risk factors contributing to the risk score in a concise and understandable manner.\n\nRisk Score: {{{riskScore}}}\nRisk Factors: {{#each riskFactors}}{{{this}}}\n{{/each}}\n\nSummary: `,
});

const summarizeRiskFactorsFlow = ai.defineFlow(
  {
    name: 'summarizeRiskFactorsFlow',
    inputSchema: SummarizeRiskFactorsInputSchema,
    outputSchema: SummarizeRiskFactorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

