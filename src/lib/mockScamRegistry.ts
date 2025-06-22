
'use server';

export interface UpiReport {
  isFlagged: boolean;
  reasons?: string[];
  reportCount?: number;
}

const scamRegistry: Record<string, UpiReport> = {
  'ramesh@exampleupi': {
    isFlagged: true,
    reasons: ['Multiple fraud reports regarding non-delivery of goods'],
    reportCount: 8,
  },
  'safe@exampleupi': {
    isFlagged: false,
  },
  'suspicious@exampleupi': {
    isFlagged: true,
    reasons: ['Associated with phishing attempts'],
    reportCount: 3,
  },
  'unknown@exampleupi': {
    isFlagged: false, // Default to not flagged if not in registry for this mock
  },
};

export async function getUpiFraudReport(upiId: string): Promise<UpiReport> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const report = scamRegistry[upiId.toLowerCase()];
  if (report) {
    return report;
  }
  // If not explicitly in the registry, assume not flagged for this mock
  return { isFlagged: false };
}
