
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { checkUpiRisk } from '@/ai/flows/check-upi-risk-flow';
import type { UpiAnalysisResponse } from '@/types';

const UpiInputSchema = z.object({
  upiId: z.string().min(3, "UPI ID must be at least 3 characters long."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = UpiInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid UPI ID', details: parseResult.error.format() }, { status: 400 });
    }

    const { upiId } = parseResult.data;

    const upiRiskResult = await checkUpiRisk({ upiId });
    
    const response: UpiAnalysisResponse = {
        analysisMessage: upiRiskResult.analysisMessage,
        isWarning: upiRiskResult.analysisMessage.toLowerCase().startsWith('warning:'),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error analyzing UPI ID:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
