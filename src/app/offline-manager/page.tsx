
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateSha256Hash } from '@/lib/cryptoUtils';
import type { QueuedPayment, PaymentHistoryItem } from '@/types';
import { format } from 'date-fns';
import { Wifi, WifiOff, ListChecks, History, UploadCloud, Loader2, User, DollarSign, CalendarDays, Hash, Link2, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const FORTY_EIGHT_HOURS_IN_MS = 48 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;
const OFFLINE_QUEUE_KEY = 'offlinePaymentQueue';
const OFFLINE_HISTORY_KEY = 'offlinePaymentHistory';
const SIMULATED_TIME_OFFSET_KEY = 'simulatedTimeOffset';


// Helper function to deduplicate an array of payment items by 'id'
function deduplicatePaymentItems(items: PaymentHistoryItem[]): PaymentHistoryItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item || typeof item.id === 'undefined') { // Guard against malformed items
      console.warn('Malformed item found during deduplication:', item);
      return false;
    }
    if (seen.has(item.id)) {
      console.warn(`Duplicate item ID found and removed during deduplication: ${item.id}`);
      return false;
    }
    seen.add(item.id);
    return true;
  });
}


export default function OfflineManagerPage() {
  const { toast } = useToast();
  const { isOnline, toggleSimulatedStatus } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<QueuedPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (storedQueue) setPendingPayments(JSON.parse(storedQueue));

      const storedHistory = localStorage.getItem(OFFLINE_HISTORY_KEY);
      if (storedHistory) {
        try {
            const parsedHistory = JSON.parse(storedHistory);
            if (Array.isArray(parsedHistory)) {
                const uniqueSortedHistory = deduplicatePaymentItems(parsedHistory)
                    .sort((a: PaymentHistoryItem, b: PaymentHistoryItem) => b.numericTimestamp - a.numericTimestamp);
                setPaymentHistory(uniqueSortedHistory);
            } else {
                setPaymentHistory([]); // Set to empty if not an array
            }
        } catch (e) {
            console.error("Error parsing payment history from localStorage:", e);
            setPaymentHistory([]); // Reset to empty on error
            localStorage.removeItem(OFFLINE_HISTORY_KEY); // Clear corrupted data
        }
      }
      
      const storedTimeOffset = localStorage.getItem(SIMULATED_TIME_OFFSET_KEY);
      if (storedTimeOffset) setSimulatedTimeOffset(JSON.parse(storedTimeOffset));
    }
  }, []);

  const shortenHash = (hash: string, len = 8) => hash ? `${hash.substring(0, len)}...${hash.substring(hash.length - Math.min(len, hash.length))}` : 'N/A';

  const handleCreateMockPayment = async () => {
    setIsLoadingPayment(true);
    try {
      let previousHash = GENESIS_HASH;
      let currentQueue: QueuedPayment[] = [];
      if (typeof window !== 'undefined') {
        const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (storedQueue) currentQueue = JSON.parse(storedQueue);
      }
      
      let currentHistory: PaymentHistoryItem[] = [];
       if (typeof window !== 'undefined') {
        const storedHistoryData = localStorage.getItem(OFFLINE_HISTORY_KEY);
        if (storedHistoryData) {
            try {
                const parsedHistory = JSON.parse(storedHistoryData);
                currentHistory = Array.isArray(parsedHistory) ? deduplicatePaymentItems(parsedHistory) : [];
            } catch (e) { currentHistory = []; }
        }
      }
      currentHistory.sort((a,b) => b.numericTimestamp - a.numericTimestamp);


      if (currentQueue.length > 0) {
        previousHash = currentQueue[currentQueue.length - 1].hash;
      } else if (currentHistory.length > 0) {
        previousHash = currentHistory[0].hash; 
      }

      const currentNumericTimestamp = Date.now();
      const newPaymentData = {
        id: `tx_man_${currentNumericTimestamp}_${Math.random().toString(36).substring(2, 9)}`,
        recipient: `Dynamic Merchant ${Math.floor(Math.random() * 100)}`,
        amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
        currency: '₹',
        timestamp: new Date(currentNumericTimestamp).toISOString(),
        numericTimestamp: currentNumericTimestamp,
        status: 'pending' as 'pending',
        previousHash: previousHash,
      };
      
      const dataToHash = { ...newPaymentData };
      const currentHash = await generateSha256Hash(dataToHash);

      const newPaymentWithHash: QueuedPayment = {
        ...newPaymentData,
        hash: currentHash,
      };

      const updatedQueue = [...currentQueue, newPaymentWithHash];
      setPendingPayments(updatedQueue);
      if (typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      }
      toast({ title: 'Mock Payment Queued', description: 'A new payment has been added to the offline queue.' });
    } catch (error) {
      console.error("Error creating mock payment:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create mock payment.'});
    } finally {
      setIsLoadingPayment(false);
    }
  };


  const handleSyncQueue = async () => {
    if (!isOnline) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: 'You must be online to sync payments.' });
      return;
    }
    
    let currentQueue: QueuedPayment[] = [];
    if (typeof window !== 'undefined') {
        const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (storedQueue) currentQueue = JSON.parse(storedQueue);
    }

    if (currentQueue.length === 0) {
      toast({ title: 'Queue Empty', description: 'No pending payments to sync.' });
      if (pendingPayments.length > 0) setPendingPayments([]);
      return;
    }

    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const nowISO = new Date().toISOString();
    const syncedPaymentsHistoryItems: PaymentHistoryItem[] = currentQueue.map(p => ({
      ...p,
      status: 'Synced', 
      syncedAt: nowISO,
    }));
    
    let currentHistoryFromStorage: PaymentHistoryItem[] = [];
    if (typeof window !== 'undefined') {
        const storedHistory = localStorage.getItem(OFFLINE_HISTORY_KEY);
        if (storedHistory) {
            try {
                const parsedHistory = JSON.parse(storedHistory);
                currentHistoryFromStorage = Array.isArray(parsedHistory) ? deduplicatePaymentItems(parsedHistory) : [];
            } catch(e) {
                currentHistoryFromStorage = [];
            }
        }
    }

    const existingHistoryIds = new Set(currentHistoryFromStorage.map(p => p.id));
    const uniqueSyncedItems = syncedPaymentsHistoryItems.filter(p => !existingHistoryIds.has(p.id));

    if (uniqueSyncedItems.length < syncedPaymentsHistoryItems.length) {
        console.warn("Some items to sync were already found in history and will not be re-added:", 
            syncedPaymentsHistoryItems.filter(p => existingHistoryIds.has(p.id))
        );
    }

    const updatedHistoryUnsorted = [...uniqueSyncedItems, ...currentHistoryFromStorage];
    const finalUpdatedHistory = deduplicatePaymentItems(updatedHistoryUnsorted)
                                .sort((a,b) => b.numericTimestamp - a.numericTimestamp);

    setPaymentHistory(finalUpdatedHistory);
    setPendingPayments([]);
    
    if (typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_HISTORY_KEY, JSON.stringify(finalUpdatedHistory));
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
    
    setIsSyncing(false);
    toast({
      title: 'Queue Synced Successfully!',
      description: `${uniqueSyncedItems.length} pending offline payment(s) have been processed.`,
      className: 'bg-green-500 text-white',
    });
  };
  
  const checkAndCancelExpiredPayments = (currentOffsetForCheck: number) => {
    if (typeof window !== 'undefined') {
      let currentQueue: QueuedPayment[] = [];
      const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (storedQueue) currentQueue = JSON.parse(storedQueue);

      if (currentQueue.length > 0) {
        const effectiveNow = Date.now() + currentOffsetForCheck;
        const stillPending: QueuedPayment[] = [];
        const toCancelAndMove: PaymentHistoryItem[] = [];

        currentQueue.forEach(payment => {
          if ((effectiveNow - payment.numericTimestamp) > FORTY_EIGHT_HOURS_IN_MS) {
            toast({
              title: 'Payment Auto-Cancelled',
              description: `Payment ${shortenHash(payment.id, 8)} expired (older than 48h simulated) and was cancelled.`,
              variant: 'destructive',
            });
            toCancelAndMove.push({
              ...payment,
              status: 'Cancelled (Expired)',
              syncedAt: undefined,
              cancelledAt: new Date(effectiveNow).toISOString(),
            });
          } else {
            stillPending.push(payment);
          }
        });

        if (toCancelAndMove.length > 0) {
          setPendingPayments(stillPending);
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(stillPending));
          
          setPaymentHistory(prevReactHistoryState => {
              let currentHistoryFromStorage: PaymentHistoryItem[] = [];
              const storedHistoryData = localStorage.getItem(OFFLINE_HISTORY_KEY);
              if (storedHistoryData) {
                try {
                    const parsedHistory = JSON.parse(storedHistoryData);
                    currentHistoryFromStorage = Array.isArray(parsedHistory) ? deduplicatePaymentItems(parsedHistory) : [];
                } catch(e) {
                    currentHistoryFromStorage = [];
                }
              }

              const existingHistoryIds = new Set(currentHistoryFromStorage.map(p => p.id));
              const uniqueNewItemsToCancel = toCancelAndMove.filter(p => !existingHistoryIds.has(p.id));
              
              if (uniqueNewItemsToCancel.length < toCancelAndMove.length) {
                console.warn("Some items to be cancelled were already found in history and will not be re-added:", 
                  toCancelAndMove.filter(p => existingHistoryIds.has(p.id))
                );
              }
              
              const newHistoryUnsorted = [...uniqueNewItemsToCancel, ...currentHistoryFromStorage];
              const finalNewHistoryForStateAndStorage = deduplicatePaymentItems(newHistoryUnsorted)
                                                        .sort((a,b) => b.numericTimestamp - a.numericTimestamp);

              localStorage.setItem(OFFLINE_HISTORY_KEY, JSON.stringify(finalNewHistoryForStateAndStorage));
              return finalNewHistoryForStateAndStorage;
          });
        }
      }
    }
  };

  const handleForwardTime24Hours = () => {
    const newOffset = simulatedTimeOffset + TWENTY_FOUR_HOURS_IN_MS;
    setSimulatedTimeOffset(newOffset);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIMULATED_TIME_OFFSET_KEY, JSON.stringify(newOffset));
    }
    toast({ 
      title: 'Time Advanced', 
      description: `Simulated time forwarded by 24 hours. Total advancement: ${newOffset / (60 * 60 * 1000)} hours. Payments older than 48h (simulated) may be auto-cancelled.` 
    });
    checkAndCancelExpiredPayments(newOffset);
  };

  const handleResetSimulatedTime = () => {
    setSimulatedTimeOffset(0);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIMULATED_TIME_OFFSET_KEY, JSON.stringify(0));
    }
    toast({ title: 'Time Simulation Reset', description: 'Simulated time has been reset to normal.'});
    checkAndCancelExpiredPayments(0); // Check with current time (0 offset)
  };
  

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
          {isOnline ? <Wifi size={36} /> : <WifiOff size={36} className="text-amber-500" />} Offline Payment Manager
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your queued offline payments and view transaction history with DAG-based integrity.
          Current status: {isOnline ? "Online" : "Offline / Simulated Offline"}
          {simulatedTimeOffset > 0 && <span className="block text-sm text-blue-500"> (Simulated time currently advanced by {simulatedTimeOffset / (60 * 60 * 1000)} hours)</span>}
        </p>
        <div className="mt-4 space-x-2 flex flex-wrap justify-center gap-2">
            <Button onClick={toggleSimulatedStatus} variant="outline">
            Simulate: Go {isOnline ? 'Offline' : 'Online'}
            </Button>
            <Button onClick={handleCreateMockPayment} variant="secondary" disabled={isLoadingPayment}>
            {isLoadingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add Mock Offline Payment
            </Button>
            <Button onClick={handleForwardTime24Hours} variant="outline" className="flex items-center gap-1.5">
             <Clock size={16}/> Forward Time by 24 Hours
            </Button>
            <Button onClick={handleResetSimulatedTime} variant="outline" className="flex items-center gap-1.5" disabled={simulatedTimeOffset === 0}>
             <RefreshCw size={16}/> Reset Simulated Time
            </Button>
        </div>
      </div>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <ListChecks size={24}/> Pending Offline Payments Queue ({pendingPayments.length})
          </CardTitle>
          <CardDescription>These payments will be synced when you are online. Each payment is cryptographically linked. Payments older than 48 (simulated) hours will be auto-cancelled when "Forward Time" is used.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Your offline queue is empty.</p>
          ) : (
            <ul className="space-y-4">
              {pendingPayments.map(payment => (
                <li key={payment.id} className="p-4 border rounded-lg bg-background shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Transaction: <span className="text-primary font-mono">{shortenHash(payment.id, 8)}</span></h3>
                    <Badge variant="outline" className="text-amber-600 border-amber-500">Pending</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Queued on: {format(new Date(payment.timestamp), "P, pp")}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <InfoItem icon={<User size={16} />} label="Recipient" value={payment.recipient} />
                    <InfoItem icon={<DollarSign size={16} />} label="Amount" value={`${payment.currency}${payment.amount.toFixed(2)}`} />
                    <InfoItem icon={<CalendarDays size={16} />} label="Timestamp (Numeric)" value={payment.numericTimestamp.toString()} />
                    <InfoItem icon={<Hash size={16} />} label="Hash" value={shortenHash(payment.hash, 12)} mono />
                    <InfoItem icon={<Link2 size={16} />} label="Prev Hash" value={shortenHash(payment.previousHash, 12)} mono />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSyncQueue} className="w-full" disabled={!isOnline || isSyncing || pendingPayments.length === 0}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud size={18} className="mr-2"/>}
            Sync Queue ({pendingPayments.length})
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <History size={24}/> Synced Payment History ({paymentHistory.length})
          </CardTitle>
          <CardDescription>Your processed and cryptographically linked transactions, including auto-cancelled ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No transaction history yet.</p>
          ) : (
             <ul className="space-y-4">
              {paymentHistory.map(payment => (
                <li key={payment.id} className="p-4 border rounded-lg bg-background shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Transaction: <span className="text-primary font-mono">{shortenHash(payment.id, 8)}</span></h3>
                    {payment.status === 'Synced' && <Badge className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 size={14} className="mr-1.5"/> Synced</Badge>}
                    {payment.status === 'Failed Sync' && <Badge variant="destructive"><AlertTriangle size={14} className="mr-1.5"/> Failed Sync</Badge>}
                    {payment.status === 'Cancelled (Expired)' && <Badge variant="outline" className="text-orange-600 border-orange-500"><XCircle size={14} className="mr-1.5"/> Cancelled (Expired)</Badge>}
                  </div>
                   <p className="text-xs text-muted-foreground mb-1">Original Queue Time: {format(new Date(payment.timestamp), "P, pp")}</p>
                   {payment.syncedAt && <p className="text-xs text-muted-foreground mb-3">Synced on: {format(new Date(payment.syncedAt), "P, pp")}</p>}
                   {payment.cancelledAt && <p className="text-xs text-orange-500 mb-3">Cancelled on: {format(new Date(payment.cancelledAt), "P, pp")}</p>}
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <InfoItem icon={<User size={16} />} label="Recipient" value={payment.recipient} />
                    <InfoItem icon={<DollarSign size={16} />} label="Amount" value={`${payment.currency}${payment.amount.toFixed(2)}`} />
                    <InfoItem icon={<CalendarDays size={16} />} label="Timestamp (Numeric)" value={payment.numericTimestamp.toString()} />
                    <InfoItem icon={<Hash size={16} />} label="Hash" value={shortenHash(payment.hash, 12)} mono />
                    <InfoItem icon={<Link2 size={16} />} label="Prev Hash" value={shortenHash(payment.previousHash, 12)} mono />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
       <p className="text-xs text-muted-foreground mt-6 text-center">
        Note: Offline DAG logic uses localStorage. Hashes are generated client-side. Simulated time advancement is persisted until reset. Expiry is 48h.
      </p>
    </div>
  );
}

interface InfoItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}
function InfoItem({icon, label, value, mono}: InfoItemProps) {
    return (
        <div className="flex items-center">
            <span className="text-muted-foreground mr-2">{icon}</span>
            <span className="font-medium mr-1">{label}:</span>
            <span className={mono ? 'font-mono text-foreground truncate' : 'text-foreground truncate'}>{value}</span>
        </div>
    )
}
