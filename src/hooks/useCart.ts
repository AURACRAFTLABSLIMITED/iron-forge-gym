/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/hooks/useCart.ts
 * Purpose: Convenience hook to access shopping cart state and mutations.
 */

import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

export function useCart() {
  return useContext(CartContext);
}
