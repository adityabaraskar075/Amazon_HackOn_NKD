
import { config } from 'dotenv';
config();

import '@/ai/flows/budget-prediction.ts';
// Other flows like generate-initial-graph-from-prompt, summarize-risk-factors, check-upi-risk-flow
// are no longer explicitly initialized here for Genkit tooling,
// but can still be called directly if needed by other parts of the application.
// If they also need to be discoverable by Genkit tooling, they should be imported.
