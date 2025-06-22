'use server';
/**
 * @fileOverview Checks a UPI ID against a scam registry and generates a risk assessment message.
 *
 * - checkUpiRisk - A function that handles the UPI risk check.
 * - CheckUpiRiskInput - The input type for the checkUpiRisk function.
 * - CheckUpiRiskOutput - The return type for the checkUpiRisk function.
 */

import { ai } from '@/ai/genkit'; // Use ai for this flow
import {z} from 'genkit';
import { getUpiFraudReport, type UpiReport } from '@/lib/mockScamRegistry';

const CheckUpiRiskInputSchema = z.object({
  upiId: z.string().describe('The UPI ID to be checked against the Scam Registry.'),
});
export type CheckUpiRiskInput = z.infer<typeof CheckUpiRiskInputSchema>;

const CheckUpiRiskOutputSchema = z.object({
  analysisMessage: z
    .string()
    .describe('A user-friendly message summarizing the risk assessment for the UPI ID.'),
});
export type CheckUpiRiskOutput = z.infer<typeof CheckUpiRiskOutputSchema>;

const UpiFraudReportSchema = z.object({
    isFlagged: z.boolean().describe("Whether the UPI ID is flagged in the Scam Registry."),
    reasons: z.array(z.string()).optional().describe("Reasons for the UPI ID being flagged."),
    reportCount: z.number().optional().describe("Number of fraud reports associated with the UPI ID."),
});

const getUpiFraudReportTool = ai.defineTool(
  {
    name: 'getUpiFraudReportTool',
    description: "Gets fraud report details for a given UPI ID from the Scam Registry. Returns whether it's flagged, reasons for flagging, and the number of reports.",
    inputSchema: z.object({ upiId: z.string().describe("The UPI ID to check.") }),
    outputSchema: UpiFraudReportSchema,
  },
  async (input) => getUpiFraudReport(input.upiId)
);


export async function checkUpiRisk(input: CheckUpiRiskInput): Promise<CheckUpiRiskOutput> {
  return checkUpiRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkUpiRiskPrompt',
  input: {schema: CheckUpiRiskInputSchema},
  output: {schema: CheckUpiRiskOutputSchema},
  tools: [getUpiFraudReportTool],
  prompt: `You are a helpful assistant for Q-SmartPay.
A user is about to make a payment to the UPI ID: {{{upiId}}}.
You have access to a tool called 'getUpiFraudReportTool' to check this UPI ID against a Scam Registry.

Use the 'getUpiFraudReportTool' with the provided {{{upiId}}} to get information about it.

Based on the tool's response:
- If the tool indicates the UPI ID is flagged (isFlagged is true):
  - Construct a clear warning message. The message MUST start with "Warning:".
  - Mention that the UPI ID ({{{upiId}}}) is listed in the Scam Registry.
  - If 'reasons' are provided by the tool and the array is not empty, incorporate them concisely. Example: "due to: [joined reasons]".
  - If 'reportCount' is provided by the tool and is greater than 0, you can mention it, e.g., "flagged in [reportCount] past fraud report(s)."
  - Combine these pieces of information naturally. For example: "Warning: This UPI ID ({{{upiId}}}) is listed in the Scam Registry, flagged in [reportCount] past report(s) due to: [reasons]. Proceed with caution."
  - If reasons are not available or empty, a more general warning is fine: "Warning: This UPI ID ({{{upiId}}}) is listed in the Scam Registry. Proceed with caution."
- If the tool indicates the UPI ID is not flagged (isFlagged is false):
  - Respond with a reassuring message like: "The UPI ID ({{{upiId}}}) was not found in our Scam Registry. However, always exercise general caution with online payments."
- If the tool call fails or returns unexpected data (e.g., no valid response from the tool):
  - Provide a generic cautionary message: "Could not verify the UPI ID ({{{upiId}}}) against our Scam Registry at this moment. Please proceed with caution and verify the recipient independently."

Provide only the final analysisMessage in the 'analysisMessage' field. Do not include any other explanatory text.`,
});

const checkUpiRiskFlow = ai.defineFlow(
  {
    name: 'checkUpiRiskFlow',
    inputSchema: CheckUpiRiskInputSchema,
    outputSchema: CheckUpiRiskOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        return { analysisMessage: `Could not analyze UPI ID ${input.upiId}. Please try again.`};
    }
    return output;
  }
);
