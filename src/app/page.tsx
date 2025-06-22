
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart, CreditCard, BarChart2, WifiOff, ShieldCheck, BadgeCheck, Lock } from 'lucide-react';

export default function HomePage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Features Section */}
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="my-8 md:my-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-10 md:mb-12 tracking-tight">
                Discover What Q-SmartPay Offers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
                icon={<ShoppingCart className="w-10 h-10 text-primary mb-4" />}
                title="Seamless Shopping Cart"
                description="Manage your items and proceed to a smart checkout experience, optimized for you."
                linkHref="/cart"
                linkText="Go to Cart"
            />
            <FeatureCard
                icon={<CreditCard className="w-10 h-10 text-primary mb-4" />}
                title="AI Payment Suggestions"
                description="Get intelligent recommendations for the best payment method at checkout, maximizing your benefits."
                linkHref="/checkout"
                linkText="Try Smart Checkout"
            />
            <FeatureCard
                icon={<BarChart2 className="w-10 h-10 text-primary mb-4" />}
                title="Insightful Budget Tracking"
                description="Track your spending habits and get AI-powered budget forecasts to manage your finances effectively."
                linkHref="/budget"
                linkText="View Budget Insights"
            />
            <FeatureCard
                icon={<WifiOff className="w-10 h-10 text-primary mb-4" />}
                title="Offline Payment Manager"
                description="Manage your offline payment queue and history with DAG-based integrity, ensuring reliability."
                linkHref="/offline-manager"
                linkText="Manage Offline Payments"
            />
            <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-primary mb-4" />}
                title="FraudGNN Shield"
                description="Simulate high-risk payment scenarios and see our GNN-based fraud detection in action, keeping you safe."
                linkHref="/payment-simulation"
                linkText="Run Security Simulation"
            />
            <FeatureCard
                icon={<BadgeCheck className="w-10 h-10 text-primary mb-4" />}
                title="Transparent Smart Rewards"
                description="Q-SmartPay uses Ethereum-compatible smart contracts for fast, fair, and transparent cashback on eligible transactions."
                linkHref="/smart-rewards" 
                linkText="Explore Smart Rewards"
            />
             <FeatureCard
                icon={<Lock className="w-10 h-10 text-primary mb-4" />}
                title="Total Privacy with FHE"
                description="Uses Fully Homomorphic Encryption (FHE) to analyze encrypted data, keeping your raw transaction details private from servers."
                linkHref="/fhe-privacy"
                linkText="Learn about FHE"
            />
            </div>
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
}

function FeatureCard({ icon, title, description, linkHref, linkText }: FeatureCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] flex flex-col bg-card dark:bg-gray-800/70 rounded-xl overflow-hidden">
      <CardHeader className="items-center text-center p-6 bg-primary/5 dark:bg-gray-800/50">
        {icon}
        <CardTitle className="font-headline text-2xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow text-center p-6">
        <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
      </CardContent>
      <div className="p-6 pt-0 text-center mt-auto">
        <Button asChild className="w-full">
          <Link href={linkHref}>{linkText}</Link>
        </Button>
      </div>
    </Card>
  );
}
