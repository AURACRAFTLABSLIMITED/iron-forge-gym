/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/types/models.ts
 * Purpose: Central TypeScript interfaces for all Firestore collections and UI state.
 */

export type MembershipStatus = 'none' | 'active' | 'expired' | 'pending';
export type ClassLevel = 'Beginner' | 'Advanced' | 'Expert';
export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';

export interface MemberProfile {
  id?: string;
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  emergencyContact?: string;
  planId?: string;
  planName?: string;
  planStartDate?: string;
  planExpiryDate?: string;
  membershipStatus: MembershipStatus;
  role?: 'member' | 'admin';
  reminderSent?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GymPackage {
  id: string;
  name: string;
  audience?: string;
  price: number;
  billingCycle: 'Monthly' | 'Quarterly' | 'Yearly' | 'Day Pass';
  durationDays: number;
  badgeText?: string;
  featured?: boolean;
  features: string[];
  description?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GymClass {
  id: string;
  title: string;
  category: string;
  trainerId?: string;
  trainerName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  level: ClassLevel;
  capacity: number;
  bookedCount?: number;
  room?: string;
  description?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClassBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  classId: string;
  classTitle: string;
  dayOfWeek: string;
  startTime: string;
  trainerName?: string;
  status: 'confirmed' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Trainer {
  id: string;
  name: string;
  role: string;
  specialty: string;
  experienceYears?: number;
  bio: string;
  photoUrl?: string;
  certifications?: string;
  instagram?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  authorName: string;
  coverImage?: string;
  readTime?: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption?: string;
  createdAt?: unknown;
}

export interface GymEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  imageUrl?: string;
  price?: number;
  capacity?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  description: string;
  imageUrl?: string;
  featured?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  paymentProvider?: 'cash' | 'stripe' | 'custom';
  paymentStatus?: 'unpaid' | 'paid';
  orderType: 'shop' | 'membership';
  packageId?: string;
  status: OrderStatus;
  notes?: string;
  paidAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  checkedInBy: string;
  notes?: string;
  checkInTime: unknown;
  createdAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt?: unknown;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt?: unknown;
}

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl: string;
}

export interface WorkingHourRow {
  day: string;
  hours: string;
}

export interface SiteSettings {
  gymName: string;
  shortName?: string;
  tagline: string;
  description?: string;
  logoUrl?: string;
  accentColor: string;
  currencySymbol: string;
  paymentProvider?: 'cash' | 'stripe' | 'custom';
  phone: string;
  email: string;
  address: string;
  mapEmbedUrl: string;
  workingHours: WorkingHourRow[];
  heroSlides: HeroSlide[];
  classCategories: string[];
  socialLinks: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    tiktok?: string;
  };
  updatedAt?: unknown;
}
