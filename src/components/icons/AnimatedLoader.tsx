import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedLoaderProps {
  size?: number;
  className?: string;
}

export function AnimatedLoader({ size = 24, className }: AnimatedLoaderProps) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-primary', className)}
      aria-label="Loading..."
    />
  );
}
