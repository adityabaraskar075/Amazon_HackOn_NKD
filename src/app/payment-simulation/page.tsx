
'use client';

import { useState, useEffect } from 'react';
import type { RiskAssessment, ApiError, PaymentDetails, TransactionGraph } from '@/types';
import { useToast } from '@/hooks/use-toast';
// Note: Header and Footer are now in RootLayout or individual page layouts if needed, not here.
// import { Header } from '@/components/layout/Header'; 
// import { Footer } from '@/components/layout/Footer';
import { PaymentDetailsScreen } from '@/components/PaymentDetailsScreen';
import { ScanningProgress } from '@/components/ScanningProgress';
import { PaymentResultScreen } from '@/components/PaymentResultScreen';
import { PostDecisionInfo } from '@/components/PostDecisionInfo';
import { Button } from '@/components/ui/button'; 

type PaymentStep = 'details' | 'scanning' | 'result' | 'post_decision';

// Riya's Scenario Details
const initialPaymentDetails: PaymentDetails = {
  userId: 'user-riya-456',
  merchantName: 'FastPay Services',
  merchantId: 'UPI@fast123', 
  amount: 3000,
  currency: '₹',
  paymentMethod: 'UPI',
  deviceId: 'device-redminote12',
  ipAddress: '172.22.11.87',
  timestamp: new Date().toISOString(),
};

export default function PaymentSimulationPage() {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('details');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(initialPaymentDetails);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [userDecision, setUserDecision] = useState<'proceeded' | 'cancelled' | 'reported' | 'proceeded_safe' | null>(null);
  const { toast } = useToast();

  const constructTransactionGraph = (details: PaymentDetails): TransactionGraph => {
    return {
      nodes: [
        { id: details.userId, type: 'user', properties: { id: details.userId } },
        { id: details.merchantId, type: 'merchant', properties: { name: details.merchantName, id: details.merchantId } },
        { id: details.deviceId, type: 'device', properties: { id: details.deviceId, reuseCount: 40 } }, 
        { id: details.ipAddress, type: 'ip_address', properties: { address: details.ipAddress, reuseCount: 10 } }, 
      ],
      edges: [
        { 
          id: `tx-${Date.now()}`, 
          source: details.userId, 
          target: details.merchantId, 
          type: 'transaction', 
          amount: details.amount, 
          timestamp: details.timestamp 
        },
        { id: `edge-user-device-${Date.now()}`, source: details.userId, target: details.deviceId, type: 'uses_device' },
        { id: `edge-user-ip-${Date.now()}`, source: details.userId, target: details.ipAddress, type: 'uses_ip' },
      ],
    };
  };

  const handleConfirmPayment = async () => {
    setCurrentStep('scanning');
    setApiError(null);
    setRiskAssessment(null);
    setUserDecision(null);

    const graphData = constructTransactionGraph(paymentDetails);

    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));

      const response = await fetch('/api/analyze-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graphData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        const errorMessage = errorData.details ? `${errorData.message}: ${JSON.stringify(errorData.details, null, 2)}` : errorData.message;
        throw new Error(errorMessage || 'Failed to analyze transaction risk');
      }
      
      const assessmentResult = data as RiskAssessment;
      setRiskAssessment(assessmentResult);
      setCurrentStep('result');

    } catch (err) {
      let message = 'An unexpected error occurred during risk analysis.';
      if (err instanceof Error) {
        message = err.message;
      }
      setApiError(message);
      setCurrentStep('details'); 
       toast({
        variant: 'destructive',
        title: 'Error Analyzing Transaction',
        description: message,
        duration: 8000,
      });
    }
  };

  const handleUserDecision = (decision: 'proceeded' | 'cancelled' | 'reported' | 'proceeded_safe') => {
    setUserDecision(decision);
    setCurrentStep('post_decision');
    console.log(`User decision: ${decision}, Payment Details:`, paymentDetails, `Risk Assessment:`, riskAssessment);
    
    let toastTitle = "Decision Recorded";
    let toastDescription = `Your decision to ${decision.replace('_', ' ')} has been logged.`;

    if (decision === 'proceeded_safe') {
        toastTitle = "Payment Successful";
        toastDescription = `Payment to ${paymentDetails.merchantName} processed.`;
    } else if (decision === 'proceeded') {
        toastTitle = "Payment Attempted";
        toastDescription = `You chose to proceed with the risky payment.`;
    }

    toast({
      title: toastTitle,
      description: toastDescription,
      duration: 5000,
    });
  };

  const resetFlow = () => {
    setCurrentStep('details');
    setRiskAssessment(null);
    setApiError(null);
    setUserDecision(null);
    setPaymentDetails({
        ...initialPaymentDetails,
        timestamp: new Date().toISOString(),
    });
  };


  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-lg"> {/* Added max-width for better centering of content */}
          {currentStep === 'details' && (
            <PaymentDetailsScreen 
              paymentDetails={paymentDetails}
              onConfirmPayment={handleConfirmPayment}
              onCancelPayment={() => {
                handleUserDecision('cancelled'); 
              }}
              isScanning={false} 
              scanError={apiError}
            />
          )}

          {currentStep === 'scanning' && <ScanningProgress />}

          {currentStep === 'result' && riskAssessment && (
            <PaymentResultScreen
              assessment={riskAssessment}
              paymentDetails={paymentDetails}
              onProceedAnyway={() => handleUserDecision('proceeded')}
              onCancelPayment={() => handleUserDecision('cancelled')}
              onReportMerchant={() => handleUserDecision('reported')}
              onProceedSafe={() => handleUserDecision('proceeded_safe')}
            />
          )}

          {currentStep === 'post_decision' && userDecision && paymentDetails && (
            <>
              <PostDecisionInfo 
                decision={userDecision} 
                paymentDetails={paymentDetails} 
                fraudProofHash={riskAssessment?.fraudProofHash} 
              />
              <div className="text-center mt-6">
                <Button onClick={resetFlow} variant="outline">
                  Start New Payment Simulation
                </Button>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
