
'use client';

import * as React from 'react';
import type { RiskAssessment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ShieldCheck, ShieldAlert, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RiskDisplayCardProps {
  assessment: RiskAssessment | null;
  showOldStructure?: boolean; // To conditionally render the old card structure if needed elsewhere
}

// This component might be largely replaced or integrated into PaymentResultScreen.tsx
// For now, let's keep its structure but note it might not be directly used in the new page.tsx flow.
// The new `PaymentResultScreen.tsx` will handle more specific layouts.
// This component can serve as a fallback or for a different display context if needed.

export function RiskDisplayCard({ assessment, showOldStructure = false }: RiskDisplayCardProps) {
  if (!assessment || !showOldStructure) { // If not showing old structure, this card won't render from page.tsx
    return null;
  }

  const { riskScore, riskFactors, summary, isHighRisk, fraudProofHash } = assessment;
  const riskPercentage = Math.round(riskScore * 100);

  let RiskIcon = Info;
  let iconColor = "text-blue-500";
  let titleText = "Risk Assessment Details";

  if (riskScore < 0.3) {
    RiskIcon = ShieldCheck;
    iconColor = "text-green-500";
    titleText = "Low Risk Detected";
  } else if (riskScore < 0.7) {
    RiskIcon = AlertTriangle;
    iconColor = "text-yellow-500"; 
    titleText = "Moderate Risk Detected";
  } else {
    RiskIcon = ShieldAlert;
    iconColor = "text-destructive";
    titleText = "High Risk Detected";
  }

  return (
    <Card className={cn("w-full shadow-lg", isHighRisk && "animate-pulse-orange-border border-primary")}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        <RiskIcon size={40} className={cn("mt-1", iconColor)} aria-hidden="true" />
        <div>
          <CardTitle className="font-headline font-bold text-2xl">{titleText}</CardTitle>
          <CardDescription className="text-base">
            Based on the GNN analysis of the transaction graph.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isHighRisk && (
            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <ShieldAlert className="h-6 w-6 text-destructive mr-3" />
                    </div>
                    <div>
                        <p className="font-bold">Critical Alert: High Potential Fraud</p>
                        <p className="text-sm">This transaction exhibits a high risk. Review immediately.</p>
                    </div>
                </div>
            </div>
        )}
        <div>
          <h3 className="text-lg font-semibold mb-1">Overall Risk Score: {riskPercentage}%</h3>
          <Progress value={riskPercentage} aria-label={`Risk score ${riskPercentage} percent`} className="h-4 [&>div]:bg-primary" />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">AI-Generated Summary:</h3>
          <p className="text-muted-foreground bg-muted p-3 rounded-md text-sm leading-relaxed">{summary || "No summary available."}</p>
        </div>
        
        {riskFactors && riskFactors.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Key Risk Factors:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
              {riskFactors.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
         {fraudProofHash && (
          <div className="text-sm mt-3">
            <Link 
              href={`https://mumbai.polygonscan.com/tx/${fraudProofHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={14} /> View Fraud Proof on Polygonscan (Mock)
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
