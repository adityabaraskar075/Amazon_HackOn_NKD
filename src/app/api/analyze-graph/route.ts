import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { summarizeRiskFactors } from '@/ai/flows/summarize-risk-factors';
import { mockGnnPrediction } from '@/lib/mockGnn';
import type { TransactionGraph, RiskAssessment } from '@/types';

const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  properties: z.record(z.any()).optional(),
});

const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  amount: z.number().optional(),
  timestamp: z.string().optional(),
  properties: z.record(z.any()).optional(),
});

const GraphDataSchema = z.object({
  nodes: z.array(GraphNodeSchema).min(1, "Graph must contain at least one node."),
  edges: z.array(GraphEdgeSchema),
});


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = GraphDataSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid graph data', details: parseResult.error.format() }, { status: 400 });
    }

    const graphData: TransactionGraph = parseResult.data;

    // Mock GNN prediction
    const { riskScore, riskFactors } = mockGnnPrediction(graphData);

    // Summarize risk factors using GenAI flow
    let summary = "Could not generate summary.";
    try {
        // Ensure riskFactors is not empty for the AI flow, provide a default if necessary
        const factorsForAI = riskFactors.length > 0 ? riskFactors : ["No specific risk factors identified."];
        const riskSummary = await summarizeRiskFactors({ riskScore, riskFactors: factorsForAI });
        summary = riskSummary.summary;
    } catch (aiError) {
        console.error("AI summarization error:", aiError);
        summary = "AI-powered summary unavailable. Key factors: " + (riskFactors.length > 0 ? riskFactors.join(', ') : "None identified.");
    }
    
    const isHighRisk = riskScore >= 0.7;

    const assessment: RiskAssessment = {
      riskScore,
      riskFactors,
      summary,
      isHighRisk,
    };

    console.log("Graph data received, processed. Risk assessment:", assessment);

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error analyzing graph:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
