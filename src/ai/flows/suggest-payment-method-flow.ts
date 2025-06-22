
'use server';
/**
 * @fileOverview Suggests the best payment method based on cart value, merchant type, and available methods using a Genkit AI flow.
 *
 * - suggestPaymentMethod - A function that provides a payment suggestion by calling an LLM.
 * - SuggestPaymentMethodInput - The input type.
 * - SuggestPaymentMethodOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { PaymentMethodDetail } from '@/types';

const PaymentMethodDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['card', 'upi', 'wallet', 'netbanking']),
});

const SuggestPaymentMethodInputSchema = z.object({
  cartValue: z.number().describe('The total value of the shopping cart in INR.'),
  merchantType: z
    .enum(['fashion', 'electronics', 'groceries', 'general', 'travel'])
    .describe('The category of the merchant.'),
  availablePaymentMethods: z
    .array(PaymentMethodDetailSchema)
    .describe('A list of payment methods available to the user, with their names and types.'),
});
export type SuggestPaymentMethodInput = z.infer<typeof SuggestPaymentMethodInputSchema>;

const SuggestPaymentMethodOutputSchema = z.object({
  suggestedMethodName: z.string().describe('The name of the suggested payment method, exactly matching one from the input list.'),
  reason: z.string().describe('A brief, user-friendly explanation for the suggestion, highlighting benefits like discounts or cashback.'),
  confidence: z.number().min(0).max(1).describe('A score indicating the confidence in the suggestion (0.0 to 1.0).'),
});
export type SuggestPaymentMethodOutput = z.infer<typeof SuggestPaymentMethodOutputSchema>;

const paymentSuggestionPrompt = ai.definePrompt({
  name: 'paymentSuggestionPrompt',
  input: { schema: SuggestPaymentMethodInputSchema },
  output: { schema: SuggestPaymentMethodOutputSchema },
  prompt: `You are Q-SmartPay's AI Financial Advisor. Your goal is to suggest the MOST BENEFICIAL payment method for the user's current transaction.

Transaction Details:
- Cart Value: {{{cartValue}}} INR
- Merchant Type: {{{merchantType}}}

Available Payment Methods:
{{#each availablePaymentMethods}}
- Name: {{this.name}}, Type: {{this.type}} (ID: {{this.id}})
{{/each}}

Based on the above, please provide a payment suggestion by choosing ONE method from the "Available Payment Methods" list.
Your response MUST be a JSON object with the following fields:
- suggestedMethodName: (string) The EXACT name of the chosen payment method from the list.
- reason: (string) A compelling, user-friendly explanation for why this method is suggested. Mention specific offers, discounts, or cashback if applicable and relevant to the cart value and merchant type. BE CREATIVE BUT PLAUSIBLE WITH OFFERS if no explicit offers are mentioned in the input. Perform any necessary calculations yourself and include the final computed values in the reason string.
- confidence: (number, 0.0 to 1.0) Your confidence in this suggestion.

CRITICAL INSTRUCTIONS:
1.  **Prioritize Cards with Offers**: When the cart value is significant (e.g., over 1000 INR), STRONGLY prioritize suggesting a card-based payment method if a plausible offer can be associated with it. You should INVENT a realistic-sounding offer (like '5% instant discount', '₹200 cashback on fashion', 'extra 2% rewards on electronics') if no specific offers are provided.
2.  **Compelling Reason**: The 'reason' MUST be highly compelling. It should clearly state the benefit to the user, ideally quantifying the savings. For example, instead of "Good for electronics", say "Save ₹250 with a 5% discount on electronics over ₹5000!"
3.  **Calculate Savings**: If you mention a discount or cashback, CALCULATE the actual saving for the given cartValue and INCLUDE IT in the reason.
4.  **Avoid UPI Default**: Do NOT default to UPI for significant cart values unless no card offer (even an invented plausible one) makes sense or if UPI genuinely has a unique, stated advantage for the specific transaction. For very low cart values (e.g., under 200 INR), UPI is a reasonable suggestion.

Example Scenarios for Guidance (emulate these kinds of reasons and offer structures if similar conditions apply - perform calculations yourself and output the final string):
1.  If merchantType is 'fashion', cartValue is 2499 INR, and a card like 'Amazon Pay ICICI Card' is available:
    The 'reason' should be something like: "Eligible for ₹200 Cashback + 10% Instant Discount on fashion items over ₹2,000 with this card. You'd save about ₹450 on this purchase!" (Confidence: ~0.9)
2.  If merchantType is 'electronics', cartValue is 5500 INR, and a card like 'HDFC Millennia Card' is available:
    The 'reason' should be something like: "Save big! Get 5% Instant Discount (up to ₹300) on electronics above ₹5,000 with this HDFC card. For your cart of ₹5500, that's a direct saving of ₹275!" (Confidence: ~0.88)
3.  If merchantType is 'general', cartValue is 6500 INR, and a card like 'HDFC Millennia Card' is available:
    The 'reason' should be something like: "Best Deal! Use HDFC Millennia for a 5% Instant Discount (max ₹300) + 2% Bonus Cashback on orders over ₹5,000. On ₹6500, you could save ₹300 instantly and get ₹130 cashback, totaling ₹430 in benefits!" (Confidence: ~0.92)
4.  If merchantType is 'groceries', cartValue is 1200 INR, and 'Google Pay UPI' and 'Paytm Wallet' are available:
    The 'reason' for 'Paytm Wallet' could be: "Get flat ₹50 cashback on grocery orders above ₹1000 using Paytm Wallet. A quick saving for your essentials!" (Confidence: ~0.75)

If NO specific strong offer seems highly relevant for the current cartValue and merchantType AFTER trying to invent a plausible one for a card:
- You might suggest UPI for its speed and wide acceptance, especially for lower value transactions. Example reason: "UPI is generally fast and widely accepted. No specific high-value card offers detected for this transaction amount." (Confidence: ~0.7)

Ensure your 'suggestedMethodName' EXACTLY matches one of the names from the "Available Payment Methods" list provided in the input.
Provide ONLY the JSON object as your response. Do not add any explanatory text before or after the JSON.
`,
});

const suggestPaymentMethodFlow = ai.defineFlow(
  {
    name: 'suggestPaymentMethodFlow',
    inputSchema: SuggestPaymentMethodInputSchema,
    outputSchema: SuggestPaymentMethodOutputSchema,
  },
  async (input) => {
    const { output } = await paymentSuggestionPrompt(input);

    if (!output) {
      // Fallback if AI returns no output or parsing fails (though schema helps)
      const fallbackMethod = input.availablePaymentMethods.find(pm => pm.type === 'upi') || input.availablePaymentMethods[0];
      return {
        suggestedMethodName: fallbackMethod ? fallbackMethod.name : 'Any available method',
        reason: 'AI suggestion currently unavailable. UPI is a fast and common choice, or select your preferred method.',
        confidence: 0.5,
      };
    }
    
    // Ensure the suggestedMethodName is valid
    const isValidSuggestion = input.availablePaymentMethods.some(pm => pm.name === output.suggestedMethodName);
    if (!isValidSuggestion && input.availablePaymentMethods.length > 0) {
        // If AI hallucinates a method name, pick the first available UPI or card as a safe fallback
        const fallbackMethod = input.availablePaymentMethods.find(pm => pm.type === 'upi') || input.availablePaymentMethods.find(pm => pm.type === 'card') || input.availablePaymentMethods[0];
        return {
            suggestedMethodName: fallbackMethod.name,
            reason: `AI suggested '${output.suggestedMethodName}', which is not available. Defaulting to ${fallbackMethod.name}. Original AI reason for unavailable suggestion: ${output.reason}`,
            confidence: output.confidence > 0.3 ? output.confidence - 0.2 : 0.4, // Slightly reduce confidence
        };
    } else if (!isValidSuggestion && input.availablePaymentMethods.length === 0) {
        return {
            suggestedMethodName: "No methods available",
            reason: "No payment methods were provided to suggest from.",
            confidence: 0.1,
        };
    }

    return output;
  }
);

export async function suggestPaymentMethod(
  input: SuggestPaymentMethodInput
): Promise<SuggestPaymentMethodOutput> {
  if (input.availablePaymentMethods.length === 0) {
    return {
      suggestedMethodName: "No payment methods available",
      reason: "No payment methods were provided to the suggestion engine.",
      confidence: 0.1
    };
  }
  return suggestPaymentMethodFlow(input);
}

