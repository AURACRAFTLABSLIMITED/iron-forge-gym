/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/config/gymConfig.js
 * Purpose: Central white-label branding configuration for the entire gym platform.
 *          Every public page, navbar, footer, invoice, and fallback reads from this file
 *          unless overridden by the admin in Site Settings (stored in Firestore).
 */

import heroStrengthImg from '../assets/images/hero_strength_floor_1794554851655.webp';
import heroBoxingImg from '../assets/images/hero_boxing_conditioning_1794554852458.webp';
import heroYogaImg from '../assets/images/hero_yoga_recovery_1794554852046.webp';
import trainerCoachImg from '../assets/images/trainer_strength_coach_1794554852406.webp';
import shopWheyImg from '../assets/images/shop_whey_supplement_1794554852538.webp';

// CUSTOMIZE: Edit any value below to rebrand this platform for a new gym client.
// If you change/remove exported keys here, components reading gymConfig will fall back
// to defaults or throw undefined errors, so keep all property names intact.
export const gymConfig = {
  // CUSTOMIZE: Primary gym name shown in navbar, footer, browser title, and receipts
  gymName: 'IRONFORGE ATHLETICS',
  shortName: 'IRONFORGE',
  tagline: 'Strength, Conditioning & Performance Club',
  description:
    'Architectural strength floor, coached conditioning classes, olympic lifting platforms, and recovery suites built for measurable progress.',

  // CUSTOMIZE: Optional logo image URL. Leave empty ('') to render the crisp typographic wordmark.
  logoUrl: '',

  // CUSTOMIZE: Primary brand accent color (hex). Default lime green #A4D614.
  // If you change this value, theme.js automatically updates all buttons, highlights, and active borders.
  accentColor: '#A4D614',

  // CUSTOMIZE: Currency symbol displayed on packages, shop products, events, and orders
  currencySymbol: 'Rs.',

  // CUSTOMIZE: Contact details shown in TopBar, Footer, and Contact page
  phone: '+92 300 0000000',
  email: 'hello@ironforgeathletics.com',
  address: 'Your Gym Address, City, Pakistan',
  // CUSTOMIZE: Google Maps embed URL used on the Contact page iframe
  mapEmbedUrl:
    'https://www.google.com/maps?q=Pakistan&output=embed',

  // CUSTOMIZE: Social media URLs (leave empty string '' to hide a specific icon)
  socialLinks: {
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    facebook: 'https://facebook.com',
    tiktok: 'https://tiktok.com',
  },

  // CUSTOMIZE: Weekly operating hours shown on Home banner, Footer, and Contact page
  workingHours: [
    { day: 'Monday – Friday', hours: '05:00 AM – 10:30 PM' },
    { day: 'Saturday', hours: '06:30 AM – 09:00 PM' },
    { day: 'Sunday', hours: '07:30 AM – 07:00 PM' },
  ],

  // CUSTOMIZE: Default class categories for the schedule filter and admin class creator
  // Admin can add extra categories dynamically in Site Settings without editing code.
  classCategories: [
    'Warmup',
    'Fitness',
    'Body Building',
    'Yoga',
    'Weight Lifting',
    'Boxing',
    'Workout',
  ],

  // CUSTOMIZE: Default gallery filter categories
  galleryCategories: [
    'Strength Floor',
    'Boxing Studio',
    'Recovery & Yoga',
    'Community',
  ],

  // CUSTOMIZE: Hero slider slides (also editable live by Admin in Site Settings)
  heroSlides: [
    {
      id: 'slide-1',
      eyebrow: 'Strength & Performance Club',
      title: 'Built For Raw Strength And Daily Discipline',
      subtitle:
        'Calibrated power racks, turf conditioning lanes, and small-group coaching led by certified strength specialists.',
      ctaLabel: 'Explore Packages',
      ctaLink: '/packages',
      imageUrl: heroStrengthImg,
    },
    {
      id: 'slide-2',
      eyebrow: 'Boxing & Metabolic Lab',
      title: 'High-Output Conditioning Every Single Round',
      subtitle:
        'Heavy-bag boxing intervals, erg sprints, and heart-rate tracked metabolic blocks designed to build engine capacity.',
      ctaLabel: 'View Schedule',
      ctaLink: '/schedule',
      imageUrl: heroBoxingImg,
    },
    {
      id: 'slide-3',
      eyebrow: 'Mobility & Restoration',
      title: 'Recover Harder So You Can Lift Heavier',
      subtitle:
        'Heated stone mobility studio, guided breathwork, and athletic yoga classes included in all unlimited memberships.',
      ctaLabel: 'Book A Class',
      ctaLink: '/schedule',
      imageUrl: heroYogaImg,
    },
  ],

  // CUSTOMIZE: Bundled local media assets used by seedData.js and image fallbacks
  defaultMedia: {
    heroStrength: heroStrengthImg,
    heroBoxing: heroBoxingImg,
    heroYoga: heroYogaImg,
    trainerCoach: trainerCoachImg,
    shopProduct: shopWheyImg,
  },

  // CUSTOMIZE: Club statistics shown on the About page
  stats: [
    { value: '18,500', label: 'Square Feet Training Floor' },
    { value: '42+', label: 'Weekly Coached Classes' },
    { value: '14', label: 'Certified Performance Coaches' },
    { value: '96%', label: 'Member 12-Month Retention' },
  ],

  // CUSTOMIZE: Card gateway mode: "cash" (default, no functions needed) | "stripe" | "custom"
  //   "custom" = Safepay (Pakistan) Visa / Mastercard hosted checkout via Cloud Functions.
  //   "stripe" is NOT available to businesses registered in Pakistan.
  // Admins can also change this in Admin > Site Settings.
  paymentProvider: 'cash',

  // CUSTOMIZE: CLIENT PAYMENT DETAILS for manual mobile-wallet / bank payments.
  // Customers send money to these accounts, then enter the transaction ID (TID) at checkout.
  // Staff verify the payment and click "Mark as Paid" in the Admin panel.
  // An option only appears on the website when `enabled` is true AND `accountNumber` is filled in.
  paymentAccounts: {
    easypaisa: {
      enabled: true,
      label: 'Easypaisa',
      accountTitle: 'MUHAMMAD IMRAN ANJUM',
      accountNumber: '0333 4273930',
    },
    jazzcash: {
      enabled: true,
      label: 'JazzCash',
      accountTitle: 'Muhammad Imran Anjum',
      accountNumber: 'PK22JCMA1403923334273930',
    },
    bank: {
      enabled: false,
      label: 'Bank Transfer',
      accountTitle: '',
      accountNumber: '',
      bankName: '',
    },
  },

  // CUSTOMIZE: Payment methods available at Shop checkout
  paymentMethods: [
    'Pay at gym / Cash on delivery',
    'Card at front desk pickup',
  ],
};

export default gymConfig;
