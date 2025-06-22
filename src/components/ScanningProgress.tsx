'use client';

import type * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { ShieldQuestion } from 'lucide-react';

export function ScanningProgress() {
  return (
    <Card className="w-full max-w-md mx-auto shadow-xl rounded-xl text-center">
      <CardHeader className="p-6">
        <CardTitle className="font-headline text-2xl font-bold text-primary flex flex-col items-center gap-3">
          <ShieldQuestion size={48} className="animate-pulse" />
          Scanning Merchant Safety...
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <AnimatedLoader size={60} />
          <p className="text-muted-foreground text-sm">
            Our GNN is analyzing transaction patterns for potential risks. This will only take a moment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
