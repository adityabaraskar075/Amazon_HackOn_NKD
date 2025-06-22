
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { Utensils, Shirt, Laptop, Package, Wand2, AlertTriangle, Info, RefreshCw, DollarSign, Settings, CheckCircle, Plane as PlaneIconLucide, ShoppingCart as ShoppingCartIconLucide, Bell, Lock, ShieldCheck, Loader2, BarChart } from 'lucide-react';
import type { BudgetPredictionInput, BudgetPredictionOutput } from '@/ai/flows/budget-prediction';
import { budgetPrediction } from '@/ai/flows/budget-prediction';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FHE } from '@/lib/fhe';


const USER_BUDGET_LIMIT_KEY = 'qSmartPayUserBudgetLimit';
const BUDGET_ALERTS_ENABLED_KEY = 'qSmartPayBudgetAlertsEnabled';

const categoryIcons: Record<string, React.ReactElement> = {
  Food: <Utensils className="w-5 h-5" />,
  Fashion: <Shirt className="w-5 h-5" />,
  Electronics: <Laptop className="w-5 h-5" />,
  Travel: <PlaneIconLucide className="w-5 h-5" />,
  Groceries: <ShoppingCartIconLucide className="w-5 h-5" />,
  Other: <Package className="w-5 h-5" />,
  Cosmetics: <Wand2 className="w-5 h-5 text-pink-500" />,
  Books: <Laptop className="w-5 h-5 text-blue-500" />,
};


interface SimpleSpendingItem {
  category: string;
  amount: number;
  color: string;
}

const mockThisMonthSpendingData: SimpleSpendingItem[] = [
  { category: 'Food', amount: 1250.75, color: 'hsl(var(--chart-1))' },
  { category: 'Fashion', amount: 800.50, color: 'hsl(var(--chart-2))' },
  { category: 'Electronics', amount: 2200.00, color: 'hsl(var(--chart-3))' },
  { category: 'Groceries', amount: 1500.25, color: 'hsl(var(--chart-4))' },
  { category: 'Travel', amount: 450.00, color: 'hsl(var(--chart-5))' },
  { category: 'Other', amount: 300.00, color: 'var(--muted-foreground)' },
];

const totalSpentThisMonth = mockThisMonthSpendingData.reduce((sum, item) => sum + item.amount, 0);

// Colors for the FHE chart, corresponds to CSS variables
const FHE_CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export default function BudgetPage() {
  const { toast } = useToast();
  // AI Prediction State
  const [spendingPrediction, setSpendingPrediction] = useState<BudgetPredictionOutput | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState<boolean>(false);
  const [errorPrediction, setErrorPrediction] = useState<string | null>(null);
  const [hasPredicted, setHasPredicted] = useState<boolean>(false);
  
  // General Budget State
  const [userBudgetLimit, setUserBudgetLimit] = useState<number | null>(null);
  const [editingBudgetInput, setEditingBudgetInput] = useState<string>('');
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState<boolean>(false);
  const [isSettingBudget, setIsSettingBudget] = useState<boolean>(false);
  
  // Spending Scenario State
  const [selectedScenarioCategory, setSelectedScenarioCategory] = useState<string>('');
  const [scenarioAmount, setScenarioAmount] = useState<string>('');

  // FHE State
  const [fheAmount, setFheAmount] = useState<number>(0);
  const [fheCategory, setFheCategory] = useState<string>('');
  const [fheEncryptedTotal, setFheEncryptedTotal] = useState<string | null>(null);
  const [fheEncryptedAlert, setFheEncryptedAlert] = useState<string | null>(null);
  const [isFheLoading, setIsFheLoading] = useState<boolean>(false);
  const [fheError, setFheError] = useState<string | null>(null);
  const [fheTransactionHistory, setFheTransactionHistory] = useState<{ category: string, amount: number }[]>([]);
  const [isFheGraphVisible, setIsFheGraphVisible] = useState<boolean>(false);
  const [fheBudgetLimit, setFheBudgetLimit] = useState<number>(12000);


  // Effect to load budget limit from localStorage (client-side only)
  useEffect(() => {
    const storedBudget = localStorage.getItem(USER_BUDGET_LIMIT_KEY);
    if (storedBudget) {
      const budgetNum = parseFloat(storedBudget);
      if (!isNaN(budgetNum) && budgetNum > 0) {
          setUserBudgetLimit(budgetNum);
          setEditingBudgetInput(budgetNum.toString());
          setFheBudgetLimit(budgetNum); // Sync FHE display limit on load
      }
    }
    const storedAlerts = localStorage.getItem(BUDGET_ALERTS_ENABLED_KEY);
    if (storedAlerts !== null) {
      setBudgetAlertsEnabled(storedAlerts === 'true');
    }
  }, []);

  // Effect to save budget alerts setting to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(BUDGET_ALERTS_ENABLED_KEY, String(budgetAlertsEnabled));
  }, [budgetAlertsEnabled]);

  const handleSetBudget = async () => {
    const newBudget = parseFloat(editingBudgetInput);
    if (isNaN(newBudget) || newBudget <= 0) {
      toast({ variant: 'destructive', title: "Invalid Budget", description: "Please enter a valid positive number for your budget." });
      return;
    }

    setIsSettingBudget(true);

    try {
      // Set the budget for FHE computations on the server
      const encryptedBudget = FHE.encrypt(newBudget);
      const response = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctBudget: encryptedBudget }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set private budget on the server.');
      }

      // Update local state for UI (plaintext and FHE display)
      setUserBudgetLimit(newBudget);
      setFheBudgetLimit(newBudget);
      localStorage.setItem(USER_BUDGET_LIMIT_KEY, newBudget.toString());
      
      toast({ 
        title: "Budget Updated", 
        description: `Your new budget of ₹${newBudget.toLocaleString()} is set for both AI predictions and private FHE tracking.`,
        className: 'bg-green-500 text-white'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Failed to Set Budget',
        description: errorMessage,
      });
    } finally {
      setIsSettingBudget(false);
    }
  };

  const fetchSpendingPrediction = async () => {
    setIsLoadingPrediction(true);
    setErrorPrediction(null);
    setHasPredicted(true);
    try {
      const spendingHistoryForAI = mockThisMonthSpendingData.map(item => ({
        date: new Date().toISOString().split('T')[0], 
        category: item.category,
        amount: item.amount,
      }));
      
      const input: BudgetPredictionInput = {
        spendingHistory: JSON.stringify(spendingHistoryForAI),
      };
      const prediction = await budgetPrediction(input);
      setSpendingPrediction(prediction);

      toast({
        title: "AI Prediction Received",
        description: `Predicted spending for next month: ₹${prediction.predictedSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Explanation: ${prediction.explanation}`,
        duration: 7000,
      });

    } catch (error) {
      console.error("Failed to fetch spending prediction:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorPrediction(errorMessage);
      
      const randomFallbackSpend = 5000 + Math.floor(Math.random() * 3000);
      setSpendingPrediction({
        predictedSpending: randomFallbackSpend,
        explanation: `Error: AI Prediction Service Unreachable or failed. ${errorMessage}. Displaying a general estimate for next month: ₹${randomFallbackSpend.toFixed(2)}.`,
      });
       toast({ variant: 'destructive', title: "Error Fetching Prediction", description: `Could not load spending prediction. ${errorMessage}` });
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleFheSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fheAmount <= 0 || !fheCategory) {
        toast({
            variant: 'destructive',
            title: 'Invalid Input',
            description: 'Please enter a positive amount and select a category for FHE transaction.',
        });
        return;
    }
    
    setIsFheLoading(true);
    setFheError(null);

    try {
        const encryptedAmount = FHE.encrypt(fheAmount);
        
        const response = await fetch('/api/compute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ctAmount: encryptedAmount }),
        });

        if (!response.ok) {
            throw new Error('Server responded with an error during FHE computation.');
        }

        const data = await response.json();
        
        setFheEncryptedTotal(data.ctTotal);
        setFheEncryptedAlert(data.ctAlert);
        setFheTransactionHistory(prev => [...prev, { category: fheCategory, amount: fheAmount }]);
        
        toast({
            title: 'FHE Computation Successful',
            description: 'Received encrypted budget data from the server.',
        });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setFheError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'FHE Computation Failed',
            description: errorMessage,
        });
    } finally {
        setIsFheLoading(false);
    }
  };

  const handleCheckBudgetImpact = () => {
    if (!spendingPrediction || !selectedScenarioCategory || !scenarioAmount) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a category, enter an amount, and ensure a budget prediction is available.',
      });
      return;
    }
    const amountNum = parseFloat(scenarioAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid positive amount.' });
      return;
    }

    const aiPredictedNextMonthSpend = spendingPrediction.predictedSpending;
    const newPotentialNextMonthSpend = aiPredictedNextMonthSpend + amountNum;

    let impactTitle = "Budget Impact Analysis";
    let impactDescriptionLines = [
      `Impact of spending ₹${amountNum.toLocaleString()} on ${selectedScenarioCategory}:`,
      `Your AI-predicted spending for next month was ₹${aiPredictedNextMonthSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      `This potential purchase would notionally increase it to ₹${newPotentialNextMonthSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      ""
    ];
    
    let toastVariant: "default" | "destructive" = "default";

    if (userBudgetLimit && userBudgetLimit > 0) {
      if (newPotentialNextMonthSpend > userBudgetLimit) {
        impactDescriptionLines.push(`🔴 WARNING: This EXCEEDS your set budget of ₹${userBudgetLimit.toLocaleString()} by ₹${(newPotentialNextMonthSpend - userBudgetLimit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
        toastVariant = "destructive";
      } else if (newPotentialNextMonthSpend >= userBudgetLimit * 0.9) {
        impactDescriptionLines.push(`🟠 CAUTION: This brings your potential spending to ${((newPotentialNextMonthSpend / userBudgetLimit) * 100).toFixed(0)}% of your ₹${userBudgetLimit.toLocaleString()} budget.`);
      } else {
        impactDescriptionLines.push(`🟢 This is comfortably WITHIN your set budget of ₹${userBudgetLimit.toLocaleString()}.`);
      }
    } else {
      impactDescriptionLines.push(`ℹ️ Consider setting a budget limit in 'Your Budget Settings' for more specific alerts.`);
    }

    toast({
      title: impactTitle,
      description: <div className="whitespace-pre-line text-sm">{impactDescriptionLines.join('\n')}</div>,
      variant: toastVariant,
      duration: 10000,
    });
  };
  
  let predictionStatusStyle = 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300';
  let PredictionIconComponent = Info;
  let predictionAlertTitle = "AI Prediction Details";
  let budgetComparisonMessage = "";

  if (spendingPrediction) {
    if (errorPrediction && !isLoadingPrediction) {
        predictionStatusStyle = 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300';
        PredictionIconComponent = AlertTriangle;
        predictionAlertTitle = "AI Prediction Error";
    } else if (spendingPrediction.explanation.toLowerCase().includes("error")) {
        predictionStatusStyle = 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300';
        PredictionIconComponent = AlertTriangle;
        predictionAlertTitle = "AI Prediction Error";
    } else {
        predictionStatusStyle = 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300';
        PredictionIconComponent = CheckCircle;
        predictionAlertTitle = "Prediction Status";
    }

    if (userBudgetLimit !== null && !errorPrediction) {
        if (spendingPrediction.predictedSpending > userBudgetLimit) {
            budgetComparisonMessage = `Warning: Your predicted spending (₹${spendingPrediction.predictedSpending.toLocaleString()}) is ₹${(spendingPrediction.predictedSpending - userBudgetLimit).toLocaleString()} OVER your set budget of ₹${userBudgetLimit.toLocaleString()}.`;
        } else if (spendingPrediction.predictedSpending >= userBudgetLimit * 0.9) {
            budgetComparisonMessage = `Caution: Your predicted spending (₹${spendingPrediction.predictedSpending.toLocaleString()}) is ${((spendingPrediction.predictedSpending / userBudgetLimit) * 100).toFixed(0)}% of your ₹${userBudgetLimit.toLocaleString()} budget.`;
        } else {
            budgetComparisonMessage = `Your predicted spending (₹${spendingPrediction.predictedSpending.toLocaleString()}) is well within your ₹${userBudgetLimit.toLocaleString()} budget.`;
        }
    }
  }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center sm:text-left mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3 sm:justify-start justify-center">
          <DollarSign size={32} /> Budget Insights
        </h1>
        <p className="text-lg text-muted-foreground mt-1">
          Track your spending, set budgets, and get AI-powered forecasts.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1 */}
        <div className="space-y-8">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <DollarSign size={26} className="text-primary" /> This Month's Spending Summary
                </CardTitle>
                <CardDescription>Total spent: <span className="font-semibold text-primary">₹{totalSpentThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockThisMonthSpendingData.length > 0 ? (
                <>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    contentStyle={{ borderRadius: "0.5rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                    labelStyle={{ color: "hsl(var(--foreground))" }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Pie
                                    data={mockThisMonthSpendingData}
                                    dataKey="amount"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    strokeWidth={2}
                                    paddingAngle={2}
                                >
                                {mockThisMonthSpendingData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                                ))}
                                </Pie>
                                <Legend
                                    verticalAlign="bottom"
                                    height={48}
                                    content={({ payload }) => (
                                        <ul className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs mt-3">
                                        {payload?.map((entry, index) => (
                                            <li key={`item-${index}`} className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                            {entry.value} (₹{mockThisMonthSpendingData.find(d => d.category === entry.value)?.amount.toFixed(2)})
                                            </li>
                                        ))}
                                        </ul>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {mockThisMonthSpendingData.map(item => {
                    const percentage = totalSpentThisMonth > 0 ? (item.amount / totalSpentThisMonth) * 100 : 0;
                    const icon = categoryIcons[item.category] || <Package className="w-5 h-5" />;
                    return (
                        <div key={item.category} className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="flex items-center text-sm font-medium text-muted-foreground gap-2">
                            {React.cloneElement(icon, {style: {color: item.color}})}
                            {item.category}
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                            ₹{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            <span className="text-xs text-muted-foreground ml-1">({percentage.toFixed(1)}%)</span>
                            </span>
                        </div>
                        <Progress value={percentage} className="h-2 [&>div]:transition-all" style={{ "--tw-progress-indicator-color": item.color } as React.CSSProperties} />
                        </div>
                    );
                    })}
                </>
                ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <Info size={32} className="mx-auto mb-3"/>
                    No spending data available for this month.
                </div>
                )}
            </CardContent>
            </Card>
        </div>

        {/* Column 2 */}
        <div className="space-y-8">
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Lock size={26} className="text-primary" /> Private Budgeting (FHE)
                    </CardTitle>
                    <CardDescription>
                        Add a transaction securely. Your data is encrypted even on our servers.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleFheSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fhe-amount">Transaction Amount (₹)</Label>
                            <Input
                                id="fhe-amount"
                                type="number"
                                placeholder="e.g., 500"
                                value={fheAmount <= 0 ? '' : fheAmount}
                                onChange={(e) => setFheAmount(Number(e.target.value))}
                                min="1"
                                required
                                disabled={isFheLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fhe-category">Category</Label>
                            <Select
                                value={fheCategory}
                                onValueChange={setFheCategory}
                                required
                                disabled={isFheLoading}
                            >
                                <SelectTrigger id="fhe-category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Grocery">Grocery</SelectItem>
                                    <SelectItem value="Fashion">Fashion</SelectItem>
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="Travel">Travel</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch pt-0">
                        <Button type="submit" disabled={isFheLoading} className="w-full">
                            {isFheLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Encrypted Data...</>
                            ) : (
                                'Add Transaction Securely'
                            )}
                        </Button>
                        {fheError && <p className="text-destructive text-xs mt-2 text-center">{fheError}</p>}
                    </CardFooter>
                </form>

                {fheEncryptedTotal && (
                    <CardContent className="border-t pt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-center mb-2">Your Private Budget Status</h3>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Encrypted Spend / Budget Limit</p>
                            <p className="text-2xl font-bold mt-1">₹{FHE.decrypt(fheEncryptedTotal).toLocaleString()} / ₹{fheBudgetLimit.toLocaleString()}</p>
                            
                            {FHE.decrypt(fheEncryptedAlert) === 1 ? (
                                <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">
                                    <AlertTriangle size={18} />
                                    <span className="font-semibold">Alert: You are over budget!</span>
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-sm">
                                    <ShieldCheck size={18} />
                                    <span className="font-semibold">You are within your budget.</span>
                                </div>
                            )}
                        </div>
                        
                        {fheTransactionHistory.length > 0 && (
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full" onClick={() => setIsFheGraphVisible(!isFheGraphVisible)}>
                                    <BarChart size={18} className="mr-2"/>
                                    {isFheGraphVisible ? 'Hide' : 'Show'} Private Data Visualization
                                </Button>

                                {isFheGraphVisible && (
                                    <div className="space-y-3 p-4 border rounded-md bg-background">
                                        <CardDescription className="text-center text-xs">
                                          This chart is rendered in your browser from decrypted data. The server never saw the individual values.
                                        </CardDescription>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: "0.5rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                                                    />
                                                    <Pie
                                                        data={fheTransactionHistory}
                                                        dataKey="amount"
                                                        nameKey="category"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        labelLine={false}
                                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                                            return (
                                                              <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                                                {`${(percent * 100).toFixed(0)}%`}
                                                              </text>
                                                            );
                                                        }}
                                                    >
                                                        {fheTransactionHistory.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={FHE_CHART_COLORS[index % FHE_CHART_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Note: This was calculated on the server without decrypting your data.
                        </p>
                    </CardContent>
                )}
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Settings size={26} className="text-primary" /> Your Budget Settings
                </CardTitle>
                <CardDescription>
                    Set your monthly budget. This is used for AI forecasts and securely for FHE tracking.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Label htmlFor="budgetLimit" className="block text-sm font-medium text-muted-foreground mb-1">
                        Your Monthly Budget Limit (₹)
                        </Label>
                        <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            id="budgetLimit"
                            value={editingBudgetInput}
                            onChange={(e) => setEditingBudgetInput(e.target.value)}
                            placeholder="e.g., 25000"
                            className="flex-grow"
                            disabled={isSettingBudget}
                        />
                        <Button onClick={handleSetBudget} size="icon" aria-label="Set Budget" disabled={isSettingBudget}>
                            {isSettingBudget ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18}/>}
                        </Button>
                        </div>
                        {userBudgetLimit && <p className="text-xs text-muted-foreground mt-1">Current limit: ₹{userBudgetLimit.toLocaleString()}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Wand2 size={26} className="text-primary" /> AI Budget Prediction (Next Month)
                </CardTitle>
                <CardDescription>
                    Get an AI-powered prediction for your next month's spending.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {!hasPredicted || (isLoadingPrediction && !spendingPrediction) || (errorPrediction && !spendingPrediction && !isLoadingPrediction) ? (
                    <Button
                    onClick={() => fetchSpendingPrediction()}
                    disabled={isLoadingPrediction}
                    className="w-full text-base py-3 bg-primary hover:bg-primary/90"
                    size="lg"
                    >
                    {isLoadingPrediction && !errorPrediction ? (
                        <>
                        <AnimatedLoader size={20} className="mr-2" />
                        Predicting Next Month's Budget...
                        </>
                    ) : (
                        "Predict Next Month's Budget"
                    )}
                    </Button>
                ) : null}

                {isLoadingPrediction && !errorPrediction && !spendingPrediction && (
                    <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                    <AnimatedLoader size={30} />
                    <span>Calculating your AI forecast... This may take a moment.</span>
                    </div>
                )}
                
                {errorPrediction && !isLoadingPrediction && !spendingPrediction?.predictedSpending && (
                    <div className="text-destructive text-center py-6 flex flex-col items-center justify-center gap-2">
                    <AlertTriangle size={28}/>
                    <p className="font-semibold">Error Fetching Prediction</p>
                    <p className="text-sm">{errorPrediction}</p>
                    <Button onClick={() => fetchSpendingPrediction()} variant="outline" className="mt-2">
                        Try Again
                    </Button>
                    </div>
                )}

                {spendingPrediction && hasPredicted && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className={cn("p-4 border-l-4 rounded-md mt-4", predictionStatusStyle)}>
                            <div className="flex items-start gap-3">
                                <PredictionIconComponent size={24} className="mt-0.5 flex-shrink-0"/>
                                <div>
                                <p className="font-bold">{predictionAlertTitle}</p>
                                <p className="text-lg font-semibold">Predicted Spending Next Month: ₹{spendingPrediction.predictedSpending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                <p className="text-sm whitespace-pre-line mt-1">{spendingPrediction.explanation}</p>
                                </div>
                            </div>
                        </div>

                        {budgetComparisonMessage && (
                            <div className={cn("p-3 rounded-md text-sm",
                                userBudgetLimit !== null && spendingPrediction.predictedSpending > userBudgetLimit ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                userBudgetLimit !== null && spendingPrediction.predictedSpending >= userBudgetLimit * 0.9 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300 border' :
                                'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 border'
                            )}>
                                {budgetComparisonMessage}
                            </div>
                        )}

                        <Button onClick={() => fetchSpendingPrediction()} disabled={isLoadingPrediction} variant="outline" className="w-full mt-6">
                            <RefreshCw size={18} className="mr-2"/>
                            {isLoadingPrediction ? 'Refreshing Prediction...' : 'Refresh Next Month Prediction'}
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    This feature uses Genkit with Google AI. Predictions are illustrative.
                </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                    <Bell size={22} className="text-primary" /> Budget Alerts & Settings
                    </CardTitle>
                    <CardDescription>
                    Manage your budget alert preferences and view active notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20 transition-colors">
                        <Label htmlFor="enable-alerts" className="text-base cursor-pointer flex-grow">Enable Budget Alerts</Label>
                        <Switch
                            id="enable-alerts"
                            checked={budgetAlertsEnabled}
                            onCheckedChange={setBudgetAlertsEnabled}
                            aria-label="Enable budget alerts"
                        />
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-md bg-muted/30 text-muted-foreground">
                        <Wand2 size={36} className="text-primary flex-shrink-0" />
                        <span className="text-sm">Generate a budget prediction to enable detailed alerts.</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                    <ShoppingCartIconLucide size={22} className="text-primary" /> Spending Scenario
                    </CardTitle>
                    <CardDescription>
                    Check if a potential purchase fits your AI-predicted budget for next month.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                        <Label htmlFor="scenario-category" className="mb-1 block">Category</Label>
                        <Select value={selectedScenarioCategory} onValueChange={setSelectedScenarioCategory}>
                        <SelectTrigger id="scenario-category">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {mockThisMonthSpendingData.map(item => (
                            <SelectItem key={item.category} value={item.category}>
                                {item.category}
                            </SelectItem>
                            ))}
                             <SelectItem value="New Category">New Category (Not in current spending)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="scenario-amount" className="mb-1 block">Amount (₹)</Label>
                        <Input
                        id="scenario-amount"
                        type="number"
                        value={scenarioAmount}
                        onChange={(e) => setScenarioAmount(e.target.value)}
                        placeholder="e.g., 1500"
                        />
                    </div>
                    </div>
                    <Button
                    className="w-full"
                    onClick={handleCheckBudgetImpact}
                    disabled={!spendingPrediction || isLoadingPrediction || !selectedScenarioCategory || !scenarioAmount}
                    >
                    Check Budget Impact
                    </Button>
                    {(!spendingPrediction && !isLoadingPrediction) && (
                    <p className="text-xs text-center text-muted-foreground">
                        Generate a budget prediction first to use this feature.
                    </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
