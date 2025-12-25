"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Produit, CartItem as CartItemType } from '@/src/types';

interface CartContextType {
  cart: CartItemType[];
  addToCart: (product: Produit, quantity?: number) => void;
  buyNow: (product: Produit) => void;
  updateQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItemType[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('djephy_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('djephy_cart', JSON.stringify(cart)); } catch (e) {}
  }, [cart]);

  const addToCart = (product: Produit, quantity = 1) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
  };

  const buyNow = (product: Produit) => setCart([{ ...product, quantity: 1 }]);

  const updateQty = (id: number, delta: number) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));

  const removeItem = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  const clearCart = () => setCart([]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.prix * item.quantity), 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, buyNow, updateQty, removeItem, clearCart, subtotal, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};