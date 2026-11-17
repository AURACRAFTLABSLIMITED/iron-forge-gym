# Common Changes Guide

**Created by AURA CRAFT LABS LIMITED.**

Quick reference showing which files to edit for routine customizations.

---

## 1. Change Brand Colors & Typography
- **Accent Color (1-line change)**: Edit `accentColor` in `src/config/gymConfig.js` (e.g. `'#E11D48'`) or update it live in `/admin/settings`. `src/config/theme.js` automatically recalculates button text contrast (`--accent-ink`) and updates `--accent` globally.
- **Canvas & Surface Shades**: Edit `:root` CSS variables in `src/styles/variables.css` and `themeDefaults` in `src/config/theme.js`.
- **Fonts**: Update the Google Fonts `<link>` in `index.html` and `--font-display` / `--font-body` in `src/styles/variables.css`.

## 2. Add A New Class Category
- **Code default**: Add the category string to `classCategories` in `src/config/gymConfig.js`.
- **No-code live update**: Go to `/admin/settings` and append the category to **Schedule Class Categories** (comma-separated). Both the Schedule filter bar and Admin Class Creator update automatically.

## 3. Add A New Field To An Entity (e.g., Trainer Phone or Package Discount)
1. Update the TypeScript interface in `src/types/models.ts`.
2. Update the Firestore payload mapper in the matching service file inside `src/services/` (e.g., `src/services/trainersService.ts`).
3. Add the form input in the corresponding Admin page inside `src/pages/admin/` and display it in `src/pages/public/`.
4. Whitelist the new field in `firebase-blueprint.json` and the `isValid[Entity]()` helper in `firestore.rules`, then redeploy rules (`firebase deploy --only firestore:rules`).

## 4. Add A New Public, Member, or Admin Page
1. Create your page component in `src/pages/public/`, `src/pages/member/`, or `src/pages/admin/`.
2. Lazy-import and register the `<Route>` inside `src/routes/AppRoutes.tsx`.
3. Add the navigation link in `src/components/layout/Navbar.tsx` (public), `src/pages/member/MemberLayout.tsx` (member), or `src/components/layout/AdminSidebar.tsx` (admin).
