
'use client';

import { Wifi, WifiOff, ShoppingCart, BarChart2, HomeIcon, Menu, CloudOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';


const navItems = [
  { href: "/", label: "Home", icon: <HomeIcon className="h-5 w-5" />, showLabel: true },
  { href: "/cart", label: "Cart", icon: <ShoppingCart className="h-5 w-5" />, showLabel: true },
  { href: "/budget", label: "Budget Insights", icon: <BarChart2 className="h-5 w-5" />, showLabel: true },
  { href: "/offline-manager", label: "Offline Payments", icon: <CloudOff className="h-5 w-5" />, showLabel: false },
];

export function Header() {
  const { isOnline, toggleSimulatedStatus } = useNetworkStatus();
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="font-headline text-xl font-bold sm:text-2xl">
              Q-SmartPay
            </h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
                {/* Network Status Icon */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary-foreground hover:bg-primary/80"
                          onClick={toggleSimulatedStatus}
                          aria-label={`Current status: ${isOnline ? 'Online' : 'Offline'}. Click to toggle.`}
                        >
                        {!clientReady ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isOnline ? (
                          <Wifi className="h-5 w-5" />
                        ) : (
                          <WifiOff className="h-5 w-5 text-amber-300" />
                        )}
                        <span className="sr-only">{!clientReady ? 'Loading status...' : isOnline ? 'Online' : 'Offline'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>{!clientReady ? 'Checking network status...' : `Status: ${isOnline ? 'Online' : 'Offline'}. Click to simulate going ${isOnline ? 'offline' : 'online'}.`}</p>
                    </TooltipContent>
                </Tooltip>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex gap-1">
                {navItems.map((item) => (
                  item.showLabel ? (
                    <Button key={item.label} variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 px-3">
                      <Link href={item.href} className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </Link>
                    </Button>
                  ) : (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          className={buttonVariants({ variant: "ghost", size: "icon", className: "text-primary-foreground hover:bg-primary/80" })}
                        >
                          {item.icon}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                ))}
              </nav>
            </TooltipProvider>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs bg-background text-foreground p-4">
                  <div className="flex flex-col gap-4 mt-6">
                    {navItems.map((item) => (
                       <Button key={item.label} variant="ghost" asChild className="justify-start text-lg py-3">
                          <Link href={item.href} className="flex items-center gap-3">
                            {item.icon}
                            {item.label}
                          </Link>
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
