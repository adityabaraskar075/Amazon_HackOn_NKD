'use client';

import type * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { PaymentDetails } from '@/types';
import { CreditCard, Smartphone, Wifi, UserCircle, ShoppingBag, AlertTriangle } from 'lucide-react';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';

interface PaymentDetailsScreenProps {
  paymentDetails: PaymentDetails;
  onConfirmPayment: () => void;
  onCancelPayment: () => void;
  isScanning: boolean;
  scanError?: string | null;
}

export function PaymentDetailsScreen({ 
  paymentDetails, 
  onConfirmPayment, 
  onCancelPayment,
  isScanning,
  scanError
}: PaymentDetailsScreenProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-xl rounded-xl">
      <CardHeader className="bg-primary/10 p-6 rounded-t-xl">
        <CardTitle className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
          <CreditCard size={28} /> Confirm Your Payment
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Please review the details before proceeding with your payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="space-y-3">
          <InfoRow icon={<ShoppingBag size={20} className="text-primary"/>} label="Merchant" value={`${paymentDetails.merchantName} (${paymentDetails.merchantId})`} />
          <InfoRow icon={<UserCircle size={20} className="text-primary"/>} label="Amount" value={`${paymentDetails.currency} ${paymentDetails.amount.toLocaleString()}`} highlightValue />
          <InfoRow icon={<CreditCard size={20} className="text-primary"/>} label="Payment Method" value={paymentDetails.paymentMethod} />
          <InfoRow icon={<Smartphone size={20} className="text-primary"/>} label="Device" value={paymentDetails.deviceId} />
          <InfoRow icon={<Wifi size={20} className="text-primary"/>} label="IP Address" value={paymentDetails.ipAddress} />
        </div>

        {isScanning && (
           <div className="flex items-center justify-center text-sm text-primary pt-4">
            <AnimatedLoader size={20} className="mr-2" />
            <span>Real-time fraud scan in progress...</span>
          </div>
        )}

        {scanError && !isScanning && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-sm flex items-center gap-2" role="alert">
            <AlertTriangle size={18} /> 
            <p>{scanError}</p>
          </div>
        )}
        
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-border">
        <Button variant="outline" onClick={onCancelPayment} disabled={isScanning} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={onConfirmPayment} disabled={isScanning} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          {isScanning ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlightValue?: boolean;
}

function InfoRow({ icon, label, value, highlightValue = false }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="flex items-center text-muted-foreground gap-2">
        {icon} {label}:
      </span>
      <span className={`font-medium text-right ${highlightValue ? 'text-lg text-primary font-bold' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
