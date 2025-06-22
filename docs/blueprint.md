# **App Name**: Q-SmartPay FraudGNN Shield

## Core Features:

- GNN Prediction: Utilize an external GNN inference service tool to predict potential fraud based on transaction graphs uploaded by the Next.js app.
- Risk Display: Display fraud risk assessment of merchants to the user via toast notifications and blocking payment, when risk is detected.
- Real-time Warnings: Provide a user interface element (e.g., toast notification) for instantaneous warning messages in the Next.js mini-app based on the fraud risk score returned by the GNN model.
- Graph Upload: Securely upload pseudonymized transaction graph data from the Next.js front-end to Cloud Storage for processing by the GNN model.
- Payload Forwarding: Forward graph data to Cloud Function from Next.js API route.

## Style Guidelines:

- Primary color: Amazon orange (#FF9900) to align with the Amazon brand and convey energy and trust.
- Secondary color: Amazon gray (#37475A) for a professional and trustworthy feel.
- Accent color: A lighter shade of Amazon orange (#FFB347) to highlight important alerts and calls to action.
- Body text: 'Amazon Ember' (or a similar clean, readable sans-serif) to maintain brand consistency and ensure readability.
- Headline text: 'Amazon Ember' Bold for emphasis and clear hierarchy.
- Use Amazon's Fluent UI icon set (or similar) with standard security icons to communicate risk levels and actions.
- Prioritize a clean, minimal layout adhering to Amazon's design principles for clarity and ease of use. Important fraud warnings should be prominently displayed.
- Subtle animations for loading states to enhance user experience. An attention-grabbing animation (e.g., a pulsing orange border) can be used for critical fraud alerts.