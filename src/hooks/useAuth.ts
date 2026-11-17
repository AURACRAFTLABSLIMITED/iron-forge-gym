/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/hooks/useAuth.ts
 * Purpose: Convenience hook to consume AuthContext cleanly in components and route guards.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}
