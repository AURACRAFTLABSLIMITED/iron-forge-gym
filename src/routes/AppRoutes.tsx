/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/routes/AppRoutes.tsx
 * Purpose: Central router mapping all public, member, and admin routes with React.lazy + Suspense
 *          code splitting for optimal mobile Lighthouse load speed.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { Loader } from '../components/common/Loader';

// Public pages (code-split per page)
const HomePage = lazy(() => import('../pages/public/HomePage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const PackagesPage = lazy(() => import('../pages/public/PackagesPage'));
const SchedulePage = lazy(() => import('../pages/public/SchedulePage'));
const TrainersPage = lazy(() => import('../pages/public/TrainersPage'));
const BlogPage = lazy(() => import('../pages/public/BlogPage'));
const BlogPostPage = lazy(() => import('../pages/public/BlogPostPage'));
const GalleryPage = lazy(() => import('../pages/public/GalleryPage'));
const EventsPage = lazy(() => import('../pages/public/EventsPage'));
const ShopPage = lazy(() => import('../pages/public/ShopPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const AuthPage = lazy(() => import('../pages/public/AuthPage'));
const PaymentSuccessPage = lazy(() => import('../pages/public/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('../pages/public/PaymentCancelPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));

// Member pages (code-split per page)
const MemberLayout = lazy(() => import('../pages/member/MemberLayout'));
const MemberDashboard = lazy(() => import('../pages/member/MemberDashboard'));
const MemberBookingsPage = lazy(() => import('../pages/member/MemberBookingsPage'));
const MemberOrdersPage = lazy(() => import('../pages/member/MemberOrdersPage'));
const MemberProfilePage = lazy(() => import('../pages/member/MemberProfilePage'));

// Admin pages (code-split per page)
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminMembersPage = lazy(() => import('../pages/admin/AdminMembersPage'));
const AdminAttendancePage = lazy(() => import('../pages/admin/AdminAttendancePage'));
const AdminPackagesPage = lazy(() => import('../pages/admin/AdminPackagesPage'));
const AdminClassesPage = lazy(() => import('../pages/admin/AdminClassesPage'));
const AdminTrainersPage = lazy(() => import('../pages/admin/AdminTrainersPage'));
const AdminShopPage = lazy(() => import('../pages/admin/AdminShopPage'));
const AdminBlogPage = lazy(() => import('../pages/admin/AdminBlogPage'));
const AdminGalleryPage = lazy(() => import('../pages/admin/AdminGalleryPage'));
const AdminEventsPage = lazy(() => import('../pages/admin/AdminEventsPage'));
const AdminMessagesPage = lazy(() => import('../pages/admin/AdminMessagesPage'));
const AdminNewsletterPage = lazy(() => import('../pages/admin/AdminNewsletterPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullScreen label="Loading view..." />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/trainers" element={<TrainersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<AuthPage defaultMode="login" />} />
          <Route path="/register" element={<AuthPage defaultMode="register" />} />
          <Route path="/forgot-password" element={<AuthPage defaultMode="reset" />} />
          <Route path="/checkout/success" element={<PaymentSuccessPage />} />
          <Route path="/checkout/cancel" element={<PaymentCancelPage />} />

          {/* Member Area */}
          <Route element={<ProtectedRoute />}>
            <Route path="/member" element={<MemberLayout />}>
              <Route index element={<MemberDashboard />} />
              <Route path="bookings" element={<MemberBookingsPage />} />
              <Route path="orders" element={<MemberOrdersPage />} />
              <Route path="profile" element={<MemberProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Workspace */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="packages" element={<AdminPackagesPage />} />
            <Route path="classes" element={<AdminClassesPage />} />
            <Route path="trainers" element={<AdminTrainersPage />} />
            <Route path="shop" element={<AdminShopPage />} />
            <Route path="blog" element={<AdminBlogPage />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="messages" element={<AdminMessagesPage />} />
            <Route path="newsletter" element={<AdminNewsletterPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
