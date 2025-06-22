
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { Lightbulb, CreditCard, AlertTriangle, CheckCircle, ShoppingCart, Wifi, WifiOff, ListChecks, Info, Search, Package, PackageCheck, Truck, History as HistoryIcon, Award, ExternalLink } from 'lucide-react';
import type { SuggestPaymentMethodInput, SuggestPaymentMethodOutput } from '@/ai/flows/suggest-payment-method-flow';
import { suggestPaymentMethod } from '@/ai/flows/suggest-payment-method-flow';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { cn } from '@/lib/utils';
import type { PaymentMethodDetail, QueuedPayment, PaymentHistoryItem, PaymentDetails } from '@/types';
import { generateSha256Hash } from '@/lib/cryptoUtils';
import { format, addDays } from 'date-fns';


// Mocked available methods
const mockAvailablePaymentMethods: PaymentMethodDetail[] = [
  { id: 'amazon-pay-icici', name: 'Amazon Pay ICICI Card', type: 'card' },
  { id: 'upi-gpay', name: 'Google Pay UPI', type: 'upi' },
  { id: 'hdfc-millennia', name: 'HDFC Millennia Card', type: 'card' },
  { id: 'paytm-wallet', name: 'Paytm Wallet', type: 'wallet' },
];

const OFFLINE_QUEUE_KEY = 'offlinePaymentQueue';
const OFFLINE_HISTORY_KEY = 'offlinePaymentHistory';
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';


function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isOnline, toggleSimulatedStatus, isSimulatedOffline } = useNetworkStatus();
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ // Used to store amount and merchant for success screen
    userId: 'user-checkout-dynamic',
    merchantName: 'Selected Merchant', // This will be generic for now
    merchantId: 'merchant-dynamic',
    amount: 0,
    currency: '₹',
    paymentMethod: '', // Will be filled by selected method
    deviceId: 'device-checkout-web',
    ipAddress: '127.0.0.1', // Mock IP
    timestamp: new Date().toISOString(),
  });
  const [amount, setAmount] = useState<number>(0); // Legacy amount, primarily from URL
  const [merchantType, setMerchantType] = useState<'fashion' | 'electronics' | 'groceries' | 'general' | 'travel'>('general');
  const [paymentSuggestion, setPaymentSuggestion] = useState<SuggestPaymentMethodOutput | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  
  const [confirmedOfflineOrderDetails, setConfirmedOfflineOrderDetails] = useState<QueuedPayment | null>(null);
  const [offlineOrderStatus, setOfflineOrderStatus] = useState<'pending' | 'synced' | 'unknown'>('unknown');


  useEffect(() => {
    const amountParam = searchParams.get('amount');
    if (amountParam) {
      const parsedAmount = parseFloat(amountParam);
      setAmount(parsedAmount);
      setPaymentDetails(prev => ({...prev, amount: parsedAmount, timestamp: new Date().toISOString() }));
    }
  }, [searchParams]);

  // Check status of confirmed offline order if it exists
  useEffect(() => {
    if (confirmedOfflineOrderDetails && confirmedOfflineOrderDetails.id) {
      if (typeof window !== 'undefined') {
        const historyString = localStorage.getItem(OFFLINE_HISTORY_KEY);
        if (historyString) {
          const history: PaymentHistoryItem[] = JSON.parse(historyString);
          const syncedItem = history.find(item => item.id === confirmedOfflineOrderDetails.id && (item.status === 'Synced' || item.status === 'Completed'));
          if (syncedItem) {
            setOfflineOrderStatus('synced');
            setConfirmedOfflineOrderDetails(prev => syncedItem ? {...prev, ...syncedItem} as QueuedPayment : prev);
          } else {
            setOfflineOrderStatus('pending');
          }
        } else {
          setOfflineOrderStatus('pending'); 
        }
      }
    }
  }, [confirmedOfflineOrderDetails, isOnline]); 

  const fetchPaymentSuggestion = async () => {
    if (amount <= 0) {
        toast({ variant: 'destructive', title: "Error", description: "Cannot fetch suggestions for zero amount." });
        return;
    }
    setIsLoadingSuggestion(true);
    setErrorSuggestion(null);
    setPaymentSuggestion(null); 
    setSelectedMethodId(null); 
    try {
      const input: SuggestPaymentMethodInput = {
        cartValue: amount,
        merchantType: merchantType,
        availablePaymentMethods: mockAvailablePaymentMethods
      };
      const suggestion = await suggestPaymentMethod(input);
      setPaymentSuggestion(suggestion);
    } catch (error) {
      console.error("Failed to fetch payment suggestion:", error);
      setErrorSuggestion("Could not load payment suggestion. Please try again.");
      toast({ variant: 'destructive', title: "Error", description: "Failed to fetch payment suggestion." });
    } finally {
      setIsLoadingSuggestion(false);
    }
  };
  
  const getSelectedMethodName = () => {
    if (!selectedMethodId) return null;
    return mockAvailablePaymentMethods.find(m => m.id === selectedMethodId)?.name;
  };

  const handleOnlinePayNow = async () => {
    if (!isOnline) {
        toast({ variant: 'destructive', title: 'Offline', description: 'Cannot process online payment while offline.' });
        return;
    }
     const currentSelectedMethodName = getSelectedMethodName();
     if (!currentSelectedMethodName) {
        toast({ variant: 'destructive', title: "Payment Method", description: "Please select a payment method first." });
        return;
    }
    setPaymentDetails(prev => ({...prev, paymentMethod: currentSelectedMethodName, timestamp: new Date().toISOString() }));
    setPaymentStatus('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isHighRisk = Math.random() > 0.8; 

    if (isHighRisk) {
      setPaymentStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Payment Blocked',
        description: 'High fraud risk detected. Payment cannot be processed.',
        duration: 8000,
      });
    } else {
      setPaymentStatus('success');
      toast({
        title: 'Payment Successful!',
        description: `₹${amount.toLocaleString()} paid successfully using ${currentSelectedMethodName} (Simulated).`,
        className: 'bg-green-500 text-white',
      });
    }
  };

  const handleOfflinePay = async () => {
    if (isOnline) {
        toast({ title: 'Online', description: 'You are online. Use the regular payment button.' });
        return;
    }
    const currentSelectedMethod = getSelectedMethodName();
    if (!currentSelectedMethod) {
        toast({ variant: 'destructive', title: "Payment Method", description: "Please select a payment method first." });
        return;
    }
    setPaymentStatus('processing');
    
    try {
      let previousHash = GENESIS_HASH;
      let queue: QueuedPayment[] = [];
      let history: PaymentHistoryItem[] = [];

      if (typeof window !== 'undefined') {
        const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (storedQueue) queue = JSON.parse(storedQueue);
        const storedHistory = localStorage.getItem(OFFLINE_HISTORY_KEY);
        if (storedHistory) history = JSON.parse(storedHistory);
      }

      if (queue.length > 0) {
        previousHash = queue[queue.length - 1].hash;
      } else if (history.length > 0) {
        const sortedHistory = [...history].sort((a,b) => b.numericTimestamp - a.numericTimestamp);
        if (sortedHistory.length > 0) previousHash = sortedHistory[0].hash;
      }
      
      const currentNumericTimestamp = Date.now();
      const newPaymentDataForHash: QueuedPayment = { 
        id: `tx_chk_${currentNumericTimestamp}_${Math.random().toString(36).substring(2, 9)}`,
        recipient: `Checkout Merchant (Pay to: ${currentSelectedMethod} for ${amount})`,
        amount: amount,
        currency: '₹',
        timestamp: new Date(currentNumericTimestamp).toISOString(),
        numericTimestamp: currentNumericTimestamp,
        status: 'pending',
        previousHash: previousHash,
        hash: '', // Will be filled after generation
      };
      
      const currentHash = await generateSha256Hash({...newPaymentDataForHash, hash: undefined}); // Exclude hash itself from hashing

      const newPaymentWithHash: QueuedPayment = {
        ...newPaymentDataForHash,
        hash: currentHash,
      };

      queue.push(newPaymentWithHash);
      if (typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }

      setConfirmedOfflineOrderDetails(newPaymentWithHash);
      setOfflineOrderStatus('pending');
      setPaymentStatus('idle'); 
      toast({
        title: 'Payment Queued!',
        description: `Your order of ₹${amount.toLocaleString()} is queued. Manage it in the Offline Payment Manager.`,
        className: 'bg-blue-500 text-white'
      });

    } catch (error) {
        console.error("Error queueing offline payment:", error);
        toast({variant: 'destructive', title: "Queueing Error", description: "Could not add payment to offline queue."});
        setPaymentStatus('idle');
    }
  };
  
  const resetCheckoutFlow = () => {
    setAmount(0); 
    setPaymentDetails(prev => ({
        ...prev,
        amount: 0,
        merchantName: 'Selected Merchant', // Reset merchant if needed
        paymentMethod: '',
        timestamp: new Date().toISOString()
    }));
    setPaymentSuggestion(null);
    setSelectedMethodId(null);
    setPaymentStatus('idle');
    setErrorSuggestion(null);
    setConfirmedOfflineOrderDetails(null);
    setOfflineOrderStatus('unknown');
    if (searchParams.get('amount')) {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
  };

  if (confirmedOfflineOrderDetails) {
    const orderDisplayAmount = confirmedOfflineOrderDetails.amount.toLocaleString();
    const orderRecipientInfo = confirmedOfflineOrderDetails.recipient; 

    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto shadow-xl">
          {offlineOrderStatus === 'synced' && confirmedOfflineOrderDetails.syncedAt ? (
            <>
              <CardHeader className="bg-green-500/10 p-6">
                <CardTitle className="font-headline text-3xl font-bold text-green-700 flex items-center gap-3">
                  <PackageCheck size={32} /> Payment Completed! (Offline Sync)
                </CardTitle>
                <CardDescription>Your offline queued order of ₹{orderDisplayAmount} has been successfully processed.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-lg">Your payment for the order to <span className="font-semibold">{orderRecipientInfo}</span> has been completed.</p>
                
                <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                    <div className="flex items-start gap-3">
                        <Award size={24} className="mt-0.5 text-primary flex-shrink-0"/>
                        <div>
                        <p className="font-bold text-primary">You've Earned a Reward!</p>
                        <p className="text-sm text-muted-foreground">Your synced offline transaction is eligible for cashback.</p>
                        <Button asChild size="sm" className="mt-2">
                            <Link href="/smart-rewards">
                                Go to Rewards Center <ExternalLink size={16} className="ml-2" />
                            </Link>
                        </Button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
                  <div className="flex items-start gap-3">
                    <Truck size={24} className="mt-0.5 text-green-600 flex-shrink-0"/>
                    <div>
                      <p className="font-bold">Shipment Information</p>
                      <p>Your items will be shipped soon. Expected delivery by: <strong>{format(addDays(new Date(confirmedOfflineOrderDetails.syncedAt), 5), 'PPP')}</strong>.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
                <Button asChild className="w-full sm:w-auto" variant="outline">
                    <Link href="/smart-rewards">
                        <Award size={18} className="mr-2" /> Check Rewards
                    </Link>
                </Button>
                <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
                  Place Another Order
                </Button>
              </CardFooter>
            </>
          ) : ( 
            <>
              <CardHeader className="bg-blue-500/10 p-6">
                <CardTitle className="font-headline text-3xl font-bold text-blue-700 flex items-center gap-3">
                  <CheckCircle size={32} /> Order Queued (Offline)
                </CardTitle>
                <CardDescription>Your payment for ₹{orderDisplayAmount} will be processed once you're back online and sync the queue.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div>
                    <p className="text-md text-muted-foreground">Payment to</p>
                    <p className="text-lg font-semibold ">{orderRecipientInfo}</p>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-md">
                    <div className="flex items-start gap-3">
                        <Package size={24} className="mt-0.5 text-blue-600 flex-shrink-0"/>
                        <div>
                            <p className="font-bold">Shipment Information</p>
                            <p>Shipment of your items will proceed as soon as this payment is successfully synced from the Offline Payment Manager when you're back online.</p>
                        </div>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
                <Button asChild className="w-full sm:w-auto" variant="secondary">
                  <Link href="/offline-manager">
                    <ListChecks size={18} className="mr-2" /> Go to Offline Manager
                  </Link>
                </Button>
                <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
                  Place Another Order
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    const expectedDeliveryDate = format(addDays(new Date(), 5), 'PPP');
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="bg-green-500/10 p-6">
            <CardTitle className="font-headline text-3xl font-bold text-green-700 flex items-center gap-3">
              <PackageCheck size={32} /> Payment Successful!
            </CardTitle>
            <CardDescription>Your order of ₹{paymentDetails.amount.toLocaleString()} to {paymentDetails.merchantName} has been confirmed.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-lg">Thank you for shopping with us!</p>
            
            <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-md">
                <div className="flex items-start gap-3">
                    <Award size={24} className="mt-0.5 text-primary flex-shrink-0"/>
                    <div>
                        <p className="font-bold text-primary">You've Earned a Reward!</p>
                        <p className="text-sm text-muted-foreground">Your transaction is eligible for Q-SmartPay cashback.</p>
                        <Button asChild size="sm" className="mt-2">
                            <Link href="/smart-rewards">
                                Go to Rewards Center <ExternalLink size={16} className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
              <div className="flex items-start gap-3">
                <Truck size={24} className="mt-0.5 text-green-600 flex-shrink-0"/>
                <div>
                  <p className="font-bold">Shipment Information</p>
                  <p>Your items will be shipped soon. Expected delivery by: <strong>{expectedDeliveryDate}</strong>.</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
                <p>Order ID: <span className="font-mono">tx_online_{new Date(paymentDetails.timestamp).getTime()}_{Math.random().toString(36).substring(2,9)}</span> (Simulated)</p>
                <p>Payment Method: <span className="font-semibold">{paymentDetails.paymentMethod}</span></p>
             </div>
          </CardContent>
          <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3">
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/smart-rewards">
                    <Award size={18} className="mr-2"/> Check Rewards
                </Link>
            </Button>
            <Button onClick={resetCheckoutFlow} className="w-full sm:w-auto">
              Place Another Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  if (amount === 0 && !searchParams.get('amount') && paymentStatus !== 'processing' && !confirmedOfflineOrderDetails) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
            <ShoppingCart size={64} className="text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-4">Your cart seems to be empty or amount is missing.</h2>
            <p className="text-muted-foreground mb-6">Please add items to your cart before proceeding to checkout.</p>
            <Button asChild>
                <Link href="/cart">Go to Cart</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10 p-6">
          <CardTitle className="font-headline text-3xl font-bold text-primary flex items-center justify-between">
            <span className="flex items-center gap-3"><CreditCard size={32} /> Checkout</span>
             <Button onClick={toggleSimulatedStatus} variant="outline" size="sm" className="text-xs">
              {isOnline ? <Wifi size={16} className="mr-1.5 text-green-600" /> : <WifiOff size={16} className="mr-1.5 text-amber-600" />}
              Simulate: Go {isOnline ? 'Offline' : 'Online'}
            </Button>
          </CardTitle>
          <CardDescription>Review your order. Current status: {isOnline ? "Online" : isSimulatedOffline ? "Simulated Offline" : "Offline"}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Total Amount Due</p>
            <p className="text-4xl font-bold text-primary">₹{amount.toLocaleString()}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <Lightbulb size={24} /> AI Payment Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!paymentSuggestion && !isLoadingSuggestion && (
                <Button onClick={fetchPaymentSuggestion} className="w-full" disabled={amount <=0}>
                  <Search size={18} className="mr-2"/> Get AI Suggestion & Offers
                </Button>
              )}
              {isLoadingSuggestion && <div className="flex items-center gap-2 text-muted-foreground"><AnimatedLoader size={20} /><span>Fetching best offers...</span></div>}
              {errorSuggestion && <p className="text-destructive flex items-center gap-2"><AlertTriangle size={18}/> {errorSuggestion}</p>}
              
              {paymentSuggestion && !isLoadingSuggestion && (
                <div className="bg-accent/50 p-4 rounded-md border border-accent">
                  <p className="font-semibold text-accent-foreground text-lg">{paymentSuggestion.suggestedMethodName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{paymentSuggestion.reason}</p>
                  {paymentSuggestion.confidence && <p className="text-xs text-muted-foreground mt-1">Confidence: {(paymentSuggestion.confidence * 100).toFixed(0)}%</p>}
                   <Button onClick={fetchPaymentSuggestion} variant="link" size="sm" className="mt-2 p-0 h-auto">
                     Refresh Suggestion
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ListChecks size={24}/> Your Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {mockAvailablePaymentMethods.map(method => (
                    <div 
                      key={method.id} 
                      className={cn(
                        "p-3 border rounded-md flex justify-between items-center text-sm transition-all cursor-pointer hover:bg-muted/50",
                        selectedMethodId === method.id && "border-primary ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => setSelectedMethodId(method.id)}
                    >
                        <div>
                            <span>{method.name} </span>
                            <span className="text-xs capitalize text-muted-foreground">({method.type})</span>
                        </div>
                        <Button 
                          variant={selectedMethodId === method.id ? "default" : "outline"} 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setSelectedMethodId(method.id);}}
                          disabled={paymentStatus === 'processing' || selectedMethodId === method.id}
                          className="pointer-events-auto"
                        >
                          {selectedMethodId === method.id ? 'Selected' : 'Select'}
                        </Button>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="pt-2 pb-4 px-6">
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-xs w-full">
                <div className="flex items-start gap-2">
                  <Info size={18} className="mt-0.5 text-blue-600" />
                  <div>
                    {!selectedMethodId && paymentSuggestion && (
                      <p>The AI suggestion above guides your choice. Selecting it or another method will enable payment.</p>
                    )}
                     {selectedMethodId && paymentSuggestion && mockAvailablePaymentMethods.find(m => m.name === paymentSuggestion.suggestedMethodName)?.id === selectedMethodId && (
                      <p><strong>You've selected the AI's recommendation!</strong> {paymentSuggestion.reason}</p>
                    )}
                    {selectedMethodId && paymentSuggestion && mockAvailablePaymentMethods.find(m => m.name === paymentSuggestion.suggestedMethodName)?.id !== selectedMethodId && (
                      <p>You've selected <strong>{getSelectedMethodName()}</strong>. The AI recommended <strong>{paymentSuggestion.suggestedMethodName}</strong> because: "{paymentSuggestion.reason}". Consider if the AI's pick offers better savings!</p>
                    )}
                     {selectedMethodId && !paymentSuggestion && (
                       <p>You've selected <strong>{getSelectedMethodName()}</strong>. You can get an AI suggestion for offers.</p>
                     )}
                     {!selectedMethodId && !paymentSuggestion && (
                       <p>Choose a payment method or get an AI suggestion to proceed.</p>
                     )}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

        </CardContent>
        <CardFooter className="p-6 border-t flex flex-col gap-3">
          {paymentStatus === 'idle' && (
            <>
              {isOnline ? (
                <Button size="lg" className="w-full" onClick={handleOnlinePayNow} disabled={isLoadingSuggestion || !selectedMethodId}>
                  Pay ₹{amount.toLocaleString()} Now
                </Button>
              ) : (
                <Button size="lg" className="w-full" onClick={handleOfflinePay} variant="secondary" disabled={!selectedMethodId}>
                  Pay ₹{amount.toLocaleString()} Offline (Add to Queue)
                </Button>
              )}
               {!isOnline && <p className="text-xs text-center text-amber-600">You are offline. Payment will be queued.</p>}
            </>
          )}
          {paymentStatus === 'processing' && (
            <Button size="lg" className="w-full" disabled>
              <AnimatedLoader size={20} className="mr-2"/> Processing Payment...
            </Button>
          )}
          {paymentStatus === 'failed' && (
             <div className="w-full text-center p-4 bg-red-100 text-red-700 rounded-md flex flex-col sm:flex-row items-center justify-center gap-2">
              <AlertTriangle size={24} /> 
              <div>
                <p className="font-semibold">Payment Blocked due to High Risk!</p>
                <p className="text-sm">This transaction was flagged by our security systems.</p>
              </div>
              <Button onClick={resetCheckoutFlow} variant="outline" size="sm" className="mt-2 sm:mt-0 sm:ml-4">Try another payment</Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><AnimatedLoader size={48} /></div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}


    