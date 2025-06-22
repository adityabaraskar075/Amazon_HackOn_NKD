'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme as rainbowDarkTheme,
  lightTheme as rainbowLightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

// Ensure NEXT_PUBLIC_RPC is used if available
const rpcUrl = process.env.NEXT_PUBLIC_RPC;

const chainsToUse = [
  {
    ...polygonMumbai,
    ...(rpcUrl ? { rpcUrls: { default: { http: [rpcUrl] } } } : {}),
  },
] as const;


const wagmiConfig = getDefaultConfig({
  appName: 'Q-SmartPay Rewards',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID", // Fallback if env var is not set
  chains: chainsToUse,
  ssr: true,
});

export function WagmiProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: rainbowLightTheme({ accentColor: 'hsl(var(--primary))', accentColorForeground: 'hsl(var(--primary-foreground))' }),
            darkMode: rainbowDarkTheme({ accentColor: 'hsl(var(--primary))', accentColorForeground: 'hsl(var(--primary-foreground))' }),
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}