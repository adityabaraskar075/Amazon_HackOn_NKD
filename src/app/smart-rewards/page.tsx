
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Sparkles, Percent, CheckCircle, AlertTriangle, ExternalLink, Loader2, WalletCards, Beaker } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { useReward } from '@/hooks/useReward';
import toast, { Toaster as HotToaster } from 'react-hot-toast'; // Using react-hot-toast
import ABI from "@/abi/RewardValidator.json";
import { formatEther } from 'ethers';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDR as `0x${string}`;

interface RewardEntry {
  paymentMethod: string;
  merchant: string;
  amount: bigint;
  rewardAmount: bigint;
  timestamp: bigint;
}

const mockRewardHistory: RewardEntry[] = [
  {
    paymentMethod: "Credit Card",
    merchant: "Amazon Books",
    amount: BigInt("12500000000000000000"), // 12.5 tokens
    rewardAmount: BigInt("1250000000000000000"), // 1.25 QSP
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 5), // 5 days ago
  },
  {
    paymentMethod: "AmazonPay",
    merchant: "Electronics World",
    amount: BigInt("75000000000000000000"), // 75.0 tokens
    rewardAmount: BigInt("7500000000000000000"), // 7.5 QSP
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 2), // 2 days ago
  },
    {
    paymentMethod: "UPI",
    merchant: "Daily Groceries",
    amount: BigInt("4500000000000000000"), // 4.5 tokens
    rewardAmount: BigInt("450000000000000000"), // 0.45 QSP
    timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 1), // 1 day ago
  },
];

const mockTotalRewards = mockRewardHistory.reduce((sum, entry) => sum + entry.rewardAmount, BigInt(0));


export default function SmartRewardsPage() {
  const { address: accountAddress, isConnected } = useAccount();
  const { writeReward, txHash, txReceipt, isPendingWrite, isConfirming, isConfirmed, error: rewardError } = useReward();
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { data: totalRewardsData, isLoading: isLoadingTotalRewards, error: totalRewardsError, refetch: refetchTotalRewards } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'rewards',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: !!accountAddress && !isDemoMode,
    },
    chainId: 80001, 
  });

  const { data: rewardHistoryData, isLoading: isLoadingRewardHistory, error: rewardHistoryError, refetch: refetchRewardHistory } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'getRewardHistory',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: !!accountAddress && !isDemoMode,
    },
    chainId: 80001,
  });

  const { data: maticBalance } = useBalance({
    address: accountAddress,
    chainId: 80001,
  });

  const handleCheckReward = async () => {
    if (!accountAddress) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!contractAddress) {
        toast.error("Contract address is not configured. Please check environment variables.");
        return;
    }
    // Placeholder arguments for the validateAndReward function
    const paymentMethod = "AmazonPay";
    const merchant = "AmazonStore";
    const amount = BigInt(Math.floor(Math.random() * 10000) + 1000);

    writeReward({
      address: contractAddress,
      abi: ABI,
      functionName: 'validateAndReward',
      args: [paymentMethod, merchant, amount, accountAddress],
    });
  };

  useEffect(() => {
    if (isConfirmed && txReceipt) {
      toast.success(
        (t) => (
          <span className="flex items-center">
            🎉 Reward confirmed!&nbsp;
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://mumbai.polygonscan.com/tx/${txReceipt.transactionHash}`}
              className="underline hover:text-blue-500 flex items-center gap-1"
              onClick={() => toast.dismiss(t.id)}
            >
              View on Polygonscan <ExternalLink size={14} />
            </a>
          </span>
        ), { duration: 8000 }
      );
      refetchTotalRewards();
      refetchRewardHistory();
    }
    if (rewardError) {
      const shortMessage = (rewardError.shortMessage || rewardError.message).split('\n')[0];
      toast.error(`Transaction failed: ${shortMessage}`, { duration: 6000 });
    }
  }, [isConfirmed, rewardError, txReceipt, refetchTotalRewards, refetchRewardHistory]);

  useEffect(() => {
    if (txHash && isPendingWrite) {
      toast.loading('Sending transaction...', { id: 'reward-tx' });
    }
    if (txHash && isConfirming && !isConfirmed) {
      toast.loading('Confirming transaction on blockchain...', { id: 'reward-tx' });
    }
    if (!isPendingWrite && !isConfirming) {
      toast.dismiss('reward-tx');
    }
  }, [txHash, isPendingWrite, isConfirming, isConfirmed]);

  const totalRewards = totalRewardsData ? formatEther(totalRewardsData as bigint) : '0';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <HotToaster position="top-center" reverseOrder={false} />
      <Card className="shadow-xl max-w-3xl mx-auto">
        <CardHeader className="bg-primary/10 p-6 text-center">
          <Award size={48} className="mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-3xl font-bold text-primary">
            Smart Rewards Center
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Transparent, instant cashback via Polygon smart contracts.
             {isDemoMode && <Badge className="ml-2">Demo Mode</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className={isDemoMode ? 'opacity-50 pointer-events-none' : ''}>
              <ConnectButton />
            </div>
            <Button 
                onClick={() => setIsDemoMode(!isDemoMode)} 
                variant="outline"
                className="w-full sm:w-auto"
            >
                <Beaker size={20} className="mr-2" />
                {isDemoMode ? "Show Live Data" : "Demonstrate Mock Rewards"}
            </Button>
          </div>
          
          {isDemoMode && (
            <div className="text-center p-3 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-md">
                You are in demo mode. Wallet interactions are disabled.
            </div>
          )}

          {isConnected && accountAddress && !isDemoMode && (
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-secondary-foreground">
                  <WalletCards size={20} /> Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Address: <span className="font-mono text-xs">{accountAddress}</span></p>
                <p>Balance: {maticBalance ? `${parseFloat(formatEther(maticBalance.value)).toFixed(4)} MATIC` : 'Loading...'}</p>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button 
              onClick={handleCheckReward} 
              disabled={!isConnected || isPendingWrite || isConfirming || isDemoMode}
              size="lg"
              className="w-full sm:w-auto"
            >
              {(isPendingWrite || isConfirming) ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={20} className="mr-2" /> Check for Rewards
                </>
              )}
            </Button>
            {txHash && !isConfirming && !isConfirmed && !isDemoMode &&(
                <p className="text-xs text-muted-foreground mt-2">Transaction Sent: {txHash.substring(0,10)}...</p>
            )}
          </div>
          
          <Card>
              <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary">
                    <Award size={24} /> Your Total Q-SmartPay Rewards
                  </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                  {isDemoMode ? (
                      <p className="text-4xl font-bold text-primary">{formatEther(mockTotalRewards)} <span className="text-2xl">QSP</span></p>
                  ) : isLoadingTotalRewards ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  ) : totalRewardsError ? (
                    <p className="text-destructive text-sm">Error loading rewards. Connect wallet.</p>
                  ) : isConnected ? (
                    <p className="text-4xl font-bold text-primary">{totalRewards} <span className="text-2xl">QSP</span></p>
                  ) : (
                     <p className="text-muted-foreground">Connect your wallet to see live rewards.</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                      {isDemoMode ? "Showing mock data for demonstration." : "Updated on reward check or page load."}
                  </p>
              </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <Percent size={24} /> Reward History
              </CardTitle>
              <CardDescription>Recent rewards claimed by your connected wallet.</CardDescription>
            </CardHeader>
            <CardContent>
              {isDemoMode ? (
                 <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {mockRewardHistory.slice().reverse().map((entry, index) => (
                    <li key={index} className="p-3 border rounded-md bg-background text-sm">
                      <p><strong>Merchant:</strong> {entry.merchant}, <strong>Method:</strong> {entry.paymentMethod}</p>
                      <p><strong>Payment:</strong> {formatEther(entry.amount)} Tokens, <strong>Reward:</strong> <span className="text-green-600 font-semibold">{formatEther(entry.rewardAmount)} QSP</span></p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : isLoadingRewardHistory ? (
                 <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" /> 
                    <span className="ml-2 text-muted-foreground">Loading history...</span>
                 </div>
              ) : rewardHistoryError ? (
                <p className="text-destructive text-sm text-center">Error loading reward history.</p>
              ) : rewardHistoryData && (rewardHistoryData as RewardEntry[]).length > 0 && isConnected ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {(rewardHistoryData as RewardEntry[]).slice().reverse().map((entry, index) => (
                    <li key={index} className="p-3 border rounded-md bg-background text-sm">
                      <p><strong>Merchant:</strong> {entry.merchant}, <strong>Method:</strong> {entry.paymentMethod}</p>
                      <p><strong>Payment:</strong> {formatEther(entry.amount)} Tokens, <strong>Reward:</strong> <span className="text-green-600 font-semibold">{formatEther(entry.rewardAmount)} QSP</span></p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                    {isConnected ? "No reward history found for this wallet." : "Connect wallet to view history."}
                </p>
              )}
            </CardContent>
          </Card>


          <div className="mt-8 border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Rewards are managed by a smart contract on Polygon Mumbai. All transactions are transparent and verifiable.
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t">
             <Button variant="outline" asChild className="w-full">
                <Link href="/">Return to Home</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

