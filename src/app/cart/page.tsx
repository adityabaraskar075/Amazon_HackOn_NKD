
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, Trash2, ShoppingCart, Lock } from 'lucide-react';
import type { CartItem, Product } from '@/types';

const initialProducts: Product[] = [
  { id: 'prod_1', name: 'Stylish Smartwatch', price: 2999, image: 'https://placehold.co/100x100.png', dataAiHint: 'smartwatch tech' },
  { id: 'prod_2', name: 'Wireless Headphones', price: 1499, image: 'https://placehold.co/100x100.png', dataAiHint: 'headphones audio' },
  { id: 'prod_3', name: 'Yoga Mat Premium', price: 899, image: 'https://placehold.co/100x100.png', dataAiHint: 'yoga fitness' },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(
    initialProducts.map(p => ({ product: p, quantity: 1 }))
  );

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) newQuantity = 0;
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      ).filter(item => item.quantity > 0) // Remove if quantity is 0
    );
  };

  const removeItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/10 p-6">
          <CardTitle className="font-headline text-3xl font-bold text-primary flex items-center gap-3">
            <ShoppingCart size={32} /> Your Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">Your cart is empty.</p>
              <Button asChild className="mt-6">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map(item => (
                <div key={item.product.id} className="flex flex-col sm:flex-row items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <Image 
                    src={item.product.image} 
                    alt={item.product.name} 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover"
                    data-ai-hint={item.product.dataAiHint}
                  />
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-lg font-semibold">{item.product.name}</h3>
                    <p className="text-muted-foreground">₹{item.product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <MinusCircle size={20} />
                    </Button>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value, 10) || 0)}
                      className="w-16 text-center h-9"
                    />
                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <PlusCircle size={20} />
                    </Button>
                  </div>
                  <div className="font-semibold text-lg sm:min-w-[100px] text-right">
                    ₹{(item.product.price * item.quantity).toLocaleString()}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => removeItem(item.product.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-bold text-primary">
              Total: ₹{totalAmount.toLocaleString()}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link href={{ pathname: "/checkout", query: { amount: totalAmount } }}>Proceed to Checkout</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                  <Link href={{ pathname: "/fhe-privacy", query: { fromCart: totalAmount } }}>
                    <Lock className="mr-2 h-4 w-4" /> Test with FHE Privacy
                  </Link>
                </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
