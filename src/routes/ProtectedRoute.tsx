/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/routes/ProtectedRoute.tsx
 * Purpose: Route guard requiring an authenticated user session before rendering member pages.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen label="Verifying session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
