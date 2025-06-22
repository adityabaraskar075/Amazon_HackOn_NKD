
'use client';

import type * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { RiskAssessment, PaymentDetails } from '@/types';
import { AlertTriangle, ShieldCheck, ShieldAlert, ExternalLink, MessageSquareWarning, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PaymentResultScreenProps {
  assessment: RiskAssessment;
  paymentDetails: PaymentDetails;
  onProceedAnyway: () => void;
  onCancelPayment: () => void;
  onReportMerchant: () => void;
  onProceedSafe: () => void;
}

export function PaymentResultScreen({
  assessment,
  paymentDetails,
  onProceedAnyway,
  onCancelPayment,
  onReportMerchant,
  onProceedSafe
}: PaymentResultScreenProps) {
  const riskPercentage = Math.round(assessment.riskScore * 100);

  if (!assessment.isHighRisk) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl rounded-xl">
        <CardHeader className="bg-green-500/10 p-6 rounded-t-xl text-center">
           <ShieldCheck size={48} className="mx-auto text-green-600 mb-3" />
          <CardTitle className="font-headline text-2xl font-bold text-green-700">
            Merchant Verified as Safe
          </CardTitle>
          <CardDescription className="text-green-600">
            Risk Score: {riskPercentage}% (Low Risk). It's safe to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-6">
            Our analysis indicates that {paymentDetails.merchantName} is a safe merchant.
          </p>
          <Button onClick={onProceedSafe} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <ThumbsUp size={18} className="mr-2"/> Proceed to Pay ₹{paymentDetails.amount.toLocaleString()}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-lg mx-auto shadow-2xl rounded-xl border-2 border-destructive animate-pulse-orange-border")}>
      <CardHeader className="bg-destructive/10 p-6 rounded-t-xl text-center">
        <ShieldAlert size={48} className="mx-auto text-destructive mb-3" />
        <CardTitle className="font-headline text-2xl font-bold text-destructive">
          High-Risk Merchant Detected!
        </CardTitle>
        <CardDescription className="text-destructive/90">
          This UPI ID ({paymentDetails.merchantId}) has a fraud risk score of <strong className="font-bold">{riskPercentage}%</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
          <h4 className="font-semibold text-destructive mb-2">Flagged for:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-destructive/80">
            {assessment.riskFactors.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </div>

        {assessment.summary && (
            <div>
                <h4 className="font-semibold text-foreground mb-1">AI-Generated Summary:</h4>
                <p className="text-muted-foreground bg-muted p-3 rounded-md text-sm leading-relaxed">{assessment.summary}</p>
            </div>
        )}

        {assessment.fraudProofHash && (
          <div className="text-center mt-4">
            <Link
              href={`https://mumbai.polygonscan.com/tx/${assessment.fraudProofHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={14} /> View Fraud Proof on Blockchain (Mock)
            </Link>
          </div>
        )}

        <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/30 text-center">
          <p className="font-bold text-amber-700 text-base">
            We strongly recommend you DO NOT PROCEED with this payment.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 p-6 border-t border-border">
        {/* Top row for Cancel & Report */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onCancelPayment} className="w-full sm:flex-1">
            <ThumbsDown size={18} className="mr-2"/> Cancel Payment
          </Button>
          <Button variant="ghost" onClick={onReportMerchant} className="w-full sm:flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive">
             <MessageSquareWarning size={18} className="mr-2"/> Report Merchant
          </Button>
        </div>
        {/* Bottom row for Proceed Anyway */}
        <Button variant="destructive" onClick={onProceedAnyway} className="w-full">
          Proceed Anyway
        </Button>
      </CardFooter>
    </Card>
  );
}
