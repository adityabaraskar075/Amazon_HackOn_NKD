
'use client';

import type * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { ScanSearch } from 'lucide-react';

interface UpiInputFormProps {
  onSubmit: (upiId: string) => Promise<void>;
  isLoading: boolean;
}

// This component is no longer used in the primary payment flow of page.tsx
// It is kept in case it's needed for a different feature or manual testing.
export function UpiInputForm({ onSubmit, isLoading }: UpiInputFormProps) {
  const [upiId, setUpiId] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInputError(null);
    if (!upiId || upiId.trim().length < 3) {
      setInputError('Please enter a valid UPI ID (at least 3 characters).');
      return;
    }
    onSubmit(upiId.trim());
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline font-bold text-2xl">Check UPI Handle Risk (Manual)</CardTitle>
        <CardDescription>
          This form is for manual UPI checks and not part of the main payment flow.
          Enter a UPI ID to check it against our Scam Registry.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="upi-id-input" className="text-base font-medium">
              UPI ID
            </Label>
            <Input
              id="upi-id-input"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g., user@exampleupi"
              className="mt-1 text-sm border-2 focus:border-primary focus:ring-primary"
              aria-describedby={inputError ? "upi-error-message" : undefined}
              aria-invalid={!!inputError}
              disabled={isLoading}
            />
            {inputError && (
              <p id="upi-error-message" className="mt-2 text-sm text-destructive">
                {inputError}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-base">
            {isLoading ? (
              <>
                <AnimatedLoader size={20} className="mr-2" />
                Checking...
              </>
            ) : (
              <>
                <ScanSearch size={18} className="mr-2" />
                Check UPI ID
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
