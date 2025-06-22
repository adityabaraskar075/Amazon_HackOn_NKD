'use client';

import type * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Lock, ShieldCheck, Info } from 'lucide-react';
import type { PaymentDetails } from '@/types';

interface PostDecisionInfoProps {
  decision: 'proceeded' | 'cancelled' | 'reported' | 'proceeded_safe';
  paymentDetails: PaymentDetails;
  fraudProofHash?: string | null;
}

export function PostDecisionInfo({ decision, paymentDetails, fraudProofHash }: PostDecisionInfoProps) {
  let title = "Action Recorded";
  let Icon = CheckCircle;
  let iconColor = "text-green-500";
  let messages: string[] = [];

  switch (decision) {
    case 'proceeded':
      title = "Payment Attempted (Risky)";
      Icon = Info;
      iconColor = "text-amber-500";
      messages = [
        `You chose to proceed with the payment to ${paymentDetails.merchantName}.`,
        "Your decision has been recorded.",
        "Monitor your account closely."
      ];
      break;
    case 'proceeded_safe':
      title = "Payment Processed Safely";
      Icon = ShieldCheck;
      iconColor = "text-green-500";
       messages = [
        `Payment to ${paymentDetails.merchantName} for ₹${paymentDetails.amount.toLocaleString()} is being processed.`,
        "Merchant was verified as safe."
      ];
      break;
    case 'cancelled':
      title = "Payment Cancelled";
      Icon = CheckCircle;
      iconColor = "text-primary";
      messages = [
        `Payment to ${paymentDetails.merchantName} has been cancelled.`,
        "Your decision has been recorded."
      ];
      break;
    case 'reported':
      title = "Merchant Reported";
      Icon = CheckCircle;
      iconColor = "text-primary";
      messages = [
        `${paymentDetails.merchantName} has been reported.`,
        "Thank you for helping keep our platform safe."
      ];
      break;
  }
  
  if (fraudProofHash && (decision === 'proceeded' || decision === 'cancelled')) {
    messages.push(`Transaction context (DAG hash - mock): ${fraudProofHash.substring(0,10)}...`);
  }
   if (decision !== 'proceeded_safe') {
     messages.push("We'll notify you if this merchant is later confirmed to be involved in widespread fraudulent activity.");
   }


  return (
    <Card className="w-full max-w-md mx-auto shadow-xl rounded-xl my-8">
      <CardHeader className="p-6 text-center">
        <Icon size={48} className={`mx-auto ${iconColor} mb-3`} />
        <CardTitle className={`font-headline text-2xl font-bold ${iconColor}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3 text-center">
        {messages.map((msg, idx) => (
          <p key={idx} className="text-sm text-muted-foreground">{msg}</p>
        ))}
        <div className="flex items-center justify-center text-xs text-muted-foreground/80 pt-3">
          <Lock size={14} className="mr-1.5"/> Securely logged for compliance.
        </div>
      </CardContent>
    </Card>
  );
}
