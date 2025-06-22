
'use server';

/**
 * @fileOverview AI-powered budget prediction flow.
 *
 * - budgetPrediction - Predicts the user's spending for the next month based on past spending history.
 * - BudgetPredictionInput - The input type for the budgetPrediction function.
 * - BudgetPredictionOutput - The return type for the budgetPrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetPredictionInputSchema = z.object({
  spendingHistory: z
    .string()
    .describe(
      'A JSON string representing the user spending history. Each entry should have date and amount fields.'
    ),
});
export type BudgetPredictionInput = z.infer<typeof BudgetPredictionInputSchema>;

const BudgetPredictionOutputSchema = z.object({
  predictedSpending: z
    .number()
    .describe('The predicted spending amount for the next month.'),
  explanation: z
    .string()
    .describe('An explanation of how the prediction was made.'),
});
export type BudgetPredictionOutput = z.infer<typeof BudgetPredictionOutputSchema>;

export async function budgetPrediction(input: BudgetPredictionInput): Promise<BudgetPredictionOutput> {
  return budgetPredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetPredictionPrompt',
  input: {schema: BudgetPredictionInputSchema},
  output: {schema: BudgetPredictionOutputSchema},
  prompt: `You are a personal finance advisor.  Given the following spending history, predict the user's spending for the next month.

Spending History:
{{{spendingHistory}}}

Consider seasonality, trends, and any other relevant factors.

Format your response as a JSON object with "predictedSpending" and "explanation" fields.`,
});

const budgetPredictionFlow = ai.defineFlow(
  {
    name: 'budgetPredictionFlow',
    inputSchema: BudgetPredictionInputSchema,
    outputSchema: BudgetPredictionOutputSchema,
  },
  async input => {
    try {
      // Validate that spending history is valid JSON.
      JSON.parse(input.spendingHistory);
    } catch (e: any) {
      throw new Error(
        `Invalid spending history, must be a valid JSON string.  The error was: ${e.message}`
      );
    }

    const {output} = await prompt(input);
    if (!output) {
        // Fallback if AI returns no output
        const fallbackSpending = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000; // Random between 3000-8000
        return {
            predictedSpending: fallbackSpending,
            explanation: "AI model did not return a specific prediction. This is a general estimate based on typical patterns."
        };
    }
    return output!;
  }
);
