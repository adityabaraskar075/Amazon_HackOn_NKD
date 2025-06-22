'use client';

import type * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AnimatedLoader } from '@/components/icons/AnimatedLoader';
import { Send } from 'lucide-react';

interface GraphInputFormProps {
  onSubmit: (jsonData: string) => Promise<void>;
  isLoading: boolean;
  initialJson?: string;
}

const placeholderJson = `{
  "nodes": [
    {"id": "acc1", "type": "account", "properties": {"holder_name": "Alice"}},
    {"id": "acc2", "type": "account", "properties": {"holder_name": "Bob"}},
    {"id": "merch1", "type": "merchant", "properties": {"name": "Shady Deals Inc."}},
    {"id": "ip1", "type": "ip_address", "properties": {"address": "192.168.1.100"}},
    {"id": "ip2", "type": "ip_address", "properties": {"address": "10.0.0.5"}}
  ],
  "edges": [
    {"id": "tx1", "source": "acc1", "target": "merch1", "type": "transaction", "amount": 1500, "timestamp": "2023-10-26T10:00:00Z"},
    {"id": "tx2", "source": "acc2", "target": "merch1", "type": "transaction", "amount": 2500, "timestamp": "2023-10-26T10:05:00Z", "properties": {"isFlagged": true}},
    {"id": "shared_ip1", "source": "acc1", "target": "ip1", "type": "used_ip"},
    {"id": "shared_ip2", "source": "acc2", "target": "ip1", "type": "used_ip"}
  ]
}`;

// This component is no longer used in the primary payment flow of page.tsx
// It is kept in case it's needed for a different feature or manual testing.
export function GraphInputForm({ onSubmit, isLoading, initialJson = placeholderJson }: GraphInputFormProps) {
  const [jsonInput, setJsonInput] = useState<string>(initialJson);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJsonError(null);
    try {
      JSON.parse(jsonInput); // Basic validation for JSON format
      onSubmit(jsonInput);
    } catch (error) {
      setJsonError('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline font-bold text-2xl">Submit Transaction Graph (Manual)</CardTitle>
        <CardDescription>
          This form is for manual graph submission and not part of the main payment flow.
          Paste your transaction graph data in JSON format below to analyze for potential fraud.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="json-input" className="text-base font-medium">
              Transaction Graph (JSON)
            </Label>
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON data here..."
              rows={15}
              className="mt-1 font-code text-sm border-2 focus:border-primary focus:ring-primary"
              aria-describedby={jsonError ? "json-error-message" : undefined}
              aria-invalid={!!jsonError}
              disabled={isLoading}
            />
            {jsonError && (
              <p id="json-error-message" className="mt-2 text-sm text-destructive">
                {jsonError}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-base">
            {isLoading ? (
              <>
                <AnimatedLoader size={20} className="mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Analyze Graph
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
