
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FHE } from '@/lib/fhe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Lock, AlertTriangle, ShieldCheck, Loader2, Save } from 'lucide-react';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { Separator } from '@/components/ui/separator';

function FhePrivacyPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State for the transaction form
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  
  // State for the budget setting form
  const [budgetInput, setBudgetInput] = useState<number>(12000);
  const [budgetLimit, setBudgetLimit] = useState<number>(12000);
  
  // State for FHE results
  const [encryptedTotal, setEncryptedTotal] = useState<string | null>(null);
  const [encryptedAlert, setEncryptedAlert] = useState<string | null>(null);
  
  // State for loading and errors
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSettingBudget, setIsSettingBudget] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cartAmount = searchParams.get('fromCart');
    if (cartAmount) {
      const parsedAmount = parseFloat(cartAmount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setAmount(parsedAmount);
        setCategory('amazon-cart');
        toast({
          title: 'Details from Cart',
          description: `Transaction amount of ₹${parsedAmount.toLocaleString()} and category 'Amazon Cart' have been pre-filled.`,
        });
      }
    }
  }, [searchParams, toast]);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetInput <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Budget',
        description: 'Please enter a positive number for your budget limit.',
      });
      return;
    }
    
    setIsSettingBudget(true);
    setError(null);
    setEncryptedTotal(null); // Reset results when budget changes
    setEncryptedAlert(null);

    try {
      const encryptedBudget = FHE.encrypt(budgetInput);

      const response = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctBudget: encryptedBudget }),
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server responded with an error while setting budget.');
      }
      
      setBudgetLimit(budgetInput);
      toast({
        title: 'Private Budget Set',
        description: `Your new encrypted budget of ₹${budgetInput.toLocaleString()} has been set on the server. Total spend has been reset.`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Setting Budget Failed',
        description: errorMessage,
      });
    } finally {
      setIsSettingBudget(false);
    }
  };


  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !category) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a positive amount and select a category.',
      });
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Encrypt the amount client-side. The category is for UI purposes only in this demo.
      const encryptedAmount = FHE.encrypt(amount);
      
      // 2. Send only the encrypted data to the server.
      const response = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctAmount: encryptedAmount }),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error.');
      }

      const data = await response.json();
      
      // 3. Receive encrypted results from the server.
      setEncryptedTotal(data.ctTotal);
      setEncryptedAlert(data.ctAlert);
      
      toast({
        title: 'Computation Successful',
        description: 'Received encrypted budget data from the server.',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Computation Failed',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSpent = encryptedTotal ? FHE.decrypt(encryptedTotal) : 0;
  const isOverBudget = encryptedAlert ? FHE.decrypt(encryptedAlert) === 1 : false;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-primary/10 p-6 text-center">
          <Lock size={48} className="mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-3xl font-bold text-primary">
            FHE-Powered Budget Tracker
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your transaction data is encrypted on your device and remains encrypted on our servers.
          </CardDescription>
        </CardHeader>
        
        {/* Set Budget Form */}
        <form onSubmit={handleSetBudget}>
          <CardContent className="p-6 space-y-4">
             <h3 className="text-xl font-semibold">1. Set Your Private Budget</h3>
             <p className="text-sm text-muted-foreground">
                Set your total budget limit. This value will be encrypted before being sent. Changing this will reset your total spend.
             </p>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Limit (₹)</Label>
                <div className="flex items-center gap-2">
                    <Input
                      id="budget"
                      type="number"
                      placeholder="e.g., 12000"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(Number(e.target.value))}
                      min="1"
                      required
                      disabled={isSettingBudget || isProcessing}
                    />
                     <Button type="submit" disabled={isSettingBudget || isProcessing} size="lg">
                        {isSettingBudget ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                           <Save className="mr-2 h-5 w-5"/>
                        )}
                        Set Budget
                    </Button>
                </div>
              </div>
          </CardContent>
        </form>

        <Separator />

        {/* Add Transaction Form */}
        <form onSubmit={handleAddTransaction}>
          <CardContent className="p-6 space-y-6">
             <h3 className="text-xl font-semibold">2. Add a Secure Transaction</h3>
              <div className="space-y-2">
                <Label htmlFor="amount">Transaction Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 500"
                  value={amount <= 0 ? '' : amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  required
                  disabled={isProcessing || isSettingBudget}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  required
                  disabled={isProcessing || isSettingBudget}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon-cart">Amazon Cart</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <Button type="submit" disabled={isProcessing || isSettingBudget} size="lg" className="w-full">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Computing Encrypted Budget...
                  </>
                ) : (
                  'Add Transaction Securely'
                )}
              </Button>
          </CardContent>
        </form>

        {error && <p className="text-destructive text-sm mt-2 text-center pb-6 px-6">{error}</p>}

        {encryptedTotal !== null && (
          <div className="p-6 border-t">
            <h3 className="text-xl font-semibold text-center mb-4">Your Private Budget Status</h3>
            <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Encrypted Spend / Budget Limit</p>
                <p className="text-3xl font-bold mt-1">₹{totalSpent.toLocaleString()} / ₹{budgetLimit.toLocaleString()}</p>
                
                {isOverBudget ? (
                   <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                     <AlertTriangle size={20} />
                     <span className="font-semibold">Alert: You are over budget!</span>
                   </div>
                ) : (
                   <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md">
                    <ShieldCheck size={20} />
                    <span className="font-semibold">You are within your budget.</span>
                  </div>
                )}
            </div>
             <p className="text-xs text-muted-foreground mt-4 text-center">
                Note: The total spend and budget alert were calculated on the server using encrypted data. The result was decrypted only here in your browser.
             </p>
          </div>
        )}
      </Card>
    </div>
  );
}


export default function FhePrivacyPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <AnimatedLoader size={48} />
            </div>
        }>
            <FhePrivacyPageContent />
        </Suspense>
    )
}
