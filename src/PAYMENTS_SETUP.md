# Online payments setup (Pakistan)

The checkout supports three online options on top of "Pay at Gym / Cash":

| Option | How it works | Needs |
|---|---|---|
| **Easypaisa / JazzCash / Bank transfer** | Customer sends money to the client's account, enters the transaction ID (TID). Staff verify and click **Mark as Paid** in Admin. | Only the client's account details (Step 1) |
| **Visa / Mastercard** | Customer is redirected to Safepay's secure hosted card page. Order is marked paid automatically by a webhook. | A Safepay merchant account (Step 2) + Firebase Blaze plan |

## Step 1 - Client account details (Easypaisa / JazzCash / Bank)

Open `src/config/gymConfig.js`, find `paymentAccounts`, and fill in the client's details:

```js
easypaisa: { enabled: true, label: 'Easypaisa', accountTitle: 'Client Gym Name', accountNumber: '0345 1234567' },
jazzcash:  { enabled: true, label: 'JazzCash',  accountTitle: 'Client Gym Name', accountNumber: '0300 1234567' },
bank:      { enabled: true, label: 'Bank Transfer', accountTitle: '...', accountNumber: 'PK00XXXX...', bankName: '...' },
```

An option only shows on the site when `enabled` is true **and** `accountNumber` is filled in.
Rebuild + redeploy hosting: `npm run build` then `firebase deploy --only hosting`.

**Verifying payments:** the TID and sender number appear in the order's payment-method line
(Admin > Shop for shop orders, Admin > Members under "Mark as Paid" for memberships).
Check the TID in the client's Easypaisa/JazzCash app/SMS first, then click **Mark as Paid**.

## Step 2 - Visa / Mastercard via Safepay

1. Open a Safepay merchant account (sandbox first, production after approval).
2. In `functions/`, run `npm install @sfpy/node-sdk` (pins the real version in package.json).
3. Set the secrets (values from the Safepay dashboard > Developer):
   ```
   firebase functions:secrets:set SAFEPAY_API_KEY
   firebase functions:secrets:set SAFEPAY_V1_SECRET
   firebase functions:secrets:set SAFEPAY_WEBHOOK_SECRET
   ```
   Stripe secrets are also declared by the functions; if you don't use Stripe, set them to any
   placeholder (e.g. `unused`) when the CLI asks.
4. Copy `functions/.env.example` to `functions/.env`, keep `FIRESTORE_DATABASE_ID=(default)`,
   and set `GYM_SITE_URL` to the live site URL. Keep `SAFEPAY_ENV=sandbox` while testing.
5. Deploy: `firebase deploy --only functions`
6. In the Safepay dashboard > Developer > Webhooks, add the URL of the deployed `paymentWebhook` function
   (shown after deploy, or Firebase Console > Functions).
7. In the site Admin > Site Settings, set **Payment Provider Mode** to
   "Safepay Card Gateway". Currency symbol must be `Rs.` (PKR) or `$` (USD).
8. Test a sandbox payment end-to-end before going live (see checklist).

### Sandbox checklist (please do not skip)
- The amount on Safepay's page equals the order total (e.g. Rs. 5,000 shows as 5,000, not 50 or 500,000).
  If it is 100x off, set `SAFEPAY_AMOUNT_MULTIPLIER` in `functions/.env` and redeploy.
- After paying, the order flips to **paid** (webhook worked). If it stays unpaid, open
  Firebase Console > Functions > Logs and look for `Safepay webhook ignored` - the logged payload
  shows what Safepay sent.
- Pay-then-close-the-tab still marks the order paid (webhook, not the browser redirect).

## Going live
Switch `SAFEPAY_ENV=production`, set the **production** Safepay keys as the secrets, redeploy functions,
and update the webhook URL in the Safepay production dashboard.

## Notes
- Stripe is not available to businesses registered in Pakistan, so it is not used here.
- Orders are always created/priced on the server for card payments; browser-sent prices are never trusted.
