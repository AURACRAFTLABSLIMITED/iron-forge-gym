# IronForge Athletics — Gym Website & Management System

**Created by AURA CRAFT LABS LIMITED.**

A complete, production-ready white-label Gym Website, Class Scheduling & Booking Platform, Pro Shop, Member Portal, Admin Management System, and **Firebase Cloud Functions v2 Backend (`/functions`)** built with React (Vite), React Router v6, CSS Modules + Tailwind CSS, and Firebase (Authentication, Cloud Firestore, Firebase Storage, Firebase Hosting, Cloud Functions v2).

---

## 1. Quick Start & Frontend Setup

1. **Install frontend dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase credentials**
   Copy `.env.example` to `.env` and populate your Firebase project keys:
   ```bash
   cp .env.example .env
   ```
   *(If running inside Google AI Studio, `firebase-applet-config.json` is used automatically as a fallback.)*

3. **Enable Authentication providers in Firebase Console**
   - Open **Firebase Console → Authentication → Sign-in method**.
   - Enable **Google** sign-in.
   - Enable **Email/Password** sign-in (required for email registration, login, and password reset).

4. **Deploy Security Rules & Indexes**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

5. **Run locally**
   ```bash
   npm run dev
   ```

---

## 2. Rebranding For A New Gym Client (White-Labeling)

You can customize branding in two ways:
1. **Static Config (`src/config/gymConfig.js`)**: Edit `gymName`, `shortName`, `tagline`, `logoUrl`, `accentColor`, `currencySymbol`, `paymentProvider` (`"cash"` | `"stripe"` | `"custom"`), `phone`, `email`, `address`, `mapEmbedUrl`, `workingHours`, `classCategories`, and `heroSlides`.
2. **Live Admin UI (`/admin/settings`)**: Signed-in admins can update branding, accent hex color, payment provider mode, working hours, categories, and hero slides directly in Firestore without redeploying code.

---

## 3. Stage 8: Cloud Functions Backend Setup (`/functions`)

Cloud Functions v2 (Node.js 20) handle online payments, Stripe/custom webhooks, scheduled membership expiry emails & status sweeps, contact form notifications, member onboarding + default role creation, atomic class capacity checks, and admin role management.

> **Cash-only gyms**: By default `paymentProvider` is `"cash"`, so the app works immediately without deploying Cloud Functions. Follow the steps below when enabling online payments or automated emails.

### Step A — Upgrade to Firebase Blaze Plan
Cloud Functions v2, Cloud Scheduler, and Secret Manager require the **Blaze (pay-as-you-go)** plan:
1. Open **Firebase Console → Usage and billing → Details & settings → Modify plan**.
2. Select **Blaze** (includes a generous free tier for Cloud Functions and Firestore).

### Step B — Install Cloud Functions Dependencies
```bash
npm --prefix functions install
```

### Step C — Configure Secrets (Stripe Keys)
Never put secret keys in client files or commit them to Git. Store them in Firebase Secret Manager:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```
- `STRIPE_SECRET_KEY`: Your Stripe Secret Key (`sk_test_...` or `sk_live_...` from Stripe Dashboard → Developers → API keys).
- `STRIPE_WEBHOOK_SECRET`: Your Stripe Signing Secret (`whsec_...` created in Step F or from `stripe listen`).

*(Optional for non-default Firestore databases)*: Ensure `FIRESTORE_DATABASE_ID` in `functions/.env` matches your Firestore database ID (`ai-studio-60bfb9be-9fe4-4216-adda-771f31e74864` or `(default)`).

### Step D — Install & Configure "Trigger Email from Firestore" Extension
Automatic emails (`onNewUserSignup`, `onNewContactMessage`, `sendExpiryReminders`, `paymentWebhook` receipts) write HTML messages into the `mail` Firestore collection using templates in `functions/src/emails/templates.js`.

1. Open **Firebase Console → Extensions → Explore Extensions Hub** and search for **Trigger Email from Firestore** (`firestore-send-email`), or run:
   ```bash
   firebase ext:install firebase/firestore-send-email --project=<YOUR_PROJECT_ID>
   ```
2. During configuration, set:
   - **Cloud Firestore location**: Match your Firestore database region.
   - **SMTP connection URI**: Your transactional SMTP provider URI (e.g., `smtps://user:pass@smtp.resend.com:465` or SendGrid/Postmark/Gmail App Password).
   - **Email documents collection**: `mail`
   - **Default FROM address**: `IronForge Athletics <noreply@yourgym.com>`
   - **Default REPLY-TO address**: Your gym owner email.
3. Wait ~3 minutes for extension provisioning to complete.

### Step E — Bootstrap Your First Admin User
Run the one-time bootstrap script from `/functions` to assign the `role: "admin"` Auth custom claim AND create the `/admins/{uid}` marker:

1. Download a **Service Account Key JSON** from **Firebase Console → Project Settings → Service accounts → Generate new private key**.
2. Export the path and run the script:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"
   cd functions
   node scripts/makeFirstAdmin.js admin@yourgym.com
   ```
3. Sign out of the web app and sign back in so Firebase Auth refreshes the `role: "admin"` claim on the user's JWT token.
4. Once promoted, you can grant/revoke admin roles directly in `/admin/members` via the `setUserRole` Cloud Function.

### Step F — Deploy Cloud Functions & Configure Stripe Webhook
1. Deploy functions and updated Firestore security rules:
   ```bash
   firebase deploy --only functions,firestore:rules
   ```
2. Copy the deployed HTTPS URL for `paymentWebhook` printed in the terminal output (e.g., `https://us-central1-<PROJECT_ID>.cloudfunctions.net/paymentWebhook`).
3. In **Stripe Dashboard → Developers → Webhooks → Add endpoint**:
   - **Endpoint URL**: Paste your `paymentWebhook` URL.
   - **Events to listen to**: `checkout.session.completed` (and optionally `checkout.session.async_payment_succeeded`).
   - Copy the **Signing secret (`whsec_...`)** and run:
     ```bash
     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
     firebase deploy --only functions:paymentWebhook
     ```
4. In `/admin/settings` (or `src/config/gymConfig.js`), set **Payment Provider Mode** to `stripe`.

---

## 4. Local Testing With Firebase Emulators & Stripe CLI

1. **Copy `functions/.env.example` to `functions/.env`**.
2. **Create `functions/.secret.local`** with local test keys (never commit this file):
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. **Start Emulators**:
   ```bash
   firebase emulators:start --only functions,firestore,auth
   ```
4. **Forward Stripe webhooks locally in a second terminal**:
   ```bash
   stripe listen --forward-to http://127.0.0.1:5001/<PROJECT_ID>/us-central1/paymentWebhook
   ```
5. **Plugging in a Local Payment Provider (JazzCash, Easypaisa, Safepay, PayFast)**:
   - Open `functions/src/payments/customProvider.example.js`, implement `createCheckout(order)` and `verifyWebhook(request)`, register it in `functions/src/payments/providerFactory.js`, and set `paymentProvider: "custom"` in Site Settings.

---

## 5. Testing Checklist (Stage 8 Verification)

- [ ] **Membership Pay Online**: Sign in as a member, go to `/packages`, click **Pay Online**, complete Stripe test checkout with card `4242 4242 4242 4242` (`12/34`, `424`). Verify redirect to `/checkout/success`, `paymentStatus === "paid"`, and `/member` dashboard shows Active plan + expiry date.
- [ ] **Shop Checkout Choice**: Add a product in `/shop`, test both **Pay at Gym / Cash** (`paymentStatus === "unpaid"`) and **Pay Online** (`paymentStatus === "paid"`).
- [ ] **Webhook Idempotency**: Run `stripe trigger checkout.session.completed` twice for the same session. Confirm `webhookEvents` prevents double activation.
- [ ] **Manual Cash Payment**: In `/admin/shop` (Orders tab) and `/admin/members`, verify unpaid cash orders show **Mark as Paid** and update to `paid`.
- [ ] **Class Capacity Gate**: Open two browsers, book the final spot of a class (`bookedCount === capacity - 1`). Confirm `onNewClassBooking` prevents overbooking (`status: "cancelled"` for the second request).
- [ ] **Contact & Signup Triggers**: Submit `/contact` and register a new user; verify two documents are added to the `mail` collection.
- [ ] **Expiry Reminders & Sweep**: Verify members expiring in 3 days receive a `mail` document and get `reminderSent: true`.
- [ ] **Security Rules**: Attempt from browser devtools console to update `users/{uid}.planExpiryDate` or `orders/{id}.paymentStatus = "paid"` as a non-admin member; verify Firestore rejects with `PERMISSION_DENIED`.

---

## 6. Common Errors & Troubleshooting

| Issue | Likely Cause | Fix |
| :--- | :--- | :--- |
| `Online payments are disabled (paymentProvider is set to "cash")` | Default mode is `"cash"` | Set `paymentProvider` to `"stripe"` in `/admin/settings` and re-save. |
| `Stripe webhook signature verification failed` | Wrong `STRIPE_WEBHOOK_SECRET` or body parsing stripped raw bytes | Re-run `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` using the exact `whsec_...` from Stripe Dashboard / `stripe listen`, and redeploy `paymentWebhook`. |
| `Permission denied` on `/admin` after `makeFirstAdmin.js` | User JWT token still cached without new `role: "admin"` claim | Sign out and sign back in (or call `user.getIdToken(true)`). |
| Cloud Function cannot find Firestore documents | Non-default Firestore database ID mismatch | Confirm `FIRESTORE_DATABASE_ID` in `functions/.env` matches `firebase-applet-config.json`'s `firestoreDatabaseId`. |
| Emails sit in `mail` collection without sending | "Trigger Email from Firestore" extension not installed or wrong SMTP URI | Install `firebase/firestore-send-email` pointing at collection `mail` and verify SMTP credentials in Firebase Console → Extensions. |

---

## 7. Production Build & Firebase Hosting Deployment

```bash
npm run build
firebase deploy
```

See `COMMON_CHANGES.md` for step-by-step instructions on adding pages, adding Firestore fields, changing colors, and adding class categories.

---

*Created by AURA CRAFT LABS LIMITED.*
