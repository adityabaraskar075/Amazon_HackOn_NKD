
'use client';

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ABI from "@/abi/RewardValidator.json";

export function useReward() {
  const { writeContract, data, isPending, error: writeError } = useWriteContract();
  
  const { data: txReceipt, isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({ 
    hash: data,
  });

  return { 
    writeReward: writeContract, 
    txHash: data, 
    txReceipt,
    isPendingWrite: isPending, 
    isConfirming,
    isConfirmed,
    error: writeError || txError 
  };
}
