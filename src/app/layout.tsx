
import type { Metadata } from 'next';
import { Toaster as ShadToaster } from "@/components/ui/toaster"; // Renamed to avoid conflict
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';
import { WagmiProviders } from '@/lib/wagmiProviders'; // Import WagmiProviders
import './globals.css';

export const metadata: Metadata = {
  title: 'Q-SmartPay App',
  description: 'Enhanced payment experiences with Q-SmartPay on Amazon Pay',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* System font stack is preferred, defined in globals.css & tailwind.config.ts */}
      </head>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning> 
        <WagmiProviders> {/* Wrap with WagmiProviders */}
          <NetworkStatusProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <ShadToaster /> {/* Use ShadCN Toaster */}
          </NetworkStatusProvider>
        </WagmiProviders>
      </body>
    </html>
  );
}
