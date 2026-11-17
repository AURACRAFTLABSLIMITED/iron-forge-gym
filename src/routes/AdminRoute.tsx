/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/routes/AdminRoute.tsx
 * Purpose: Route guard requiring verified admin role status before rendering /admin workspace.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen label="Checking admin privileges..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/member" replace />;
  }

  return <Outlet />;
}
