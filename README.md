This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Payment integration (test mode)

This project now includes demo endpoints and a sample checkout page for Paystack, Flutterwave and PayPal (sandbox/test mode). Set the following environment variables in `.env.local` before testing:

- PAYSTACK_SECRET_KEY=
- PAYSTACK_WEBHOOK_SECRET= # optional, for verifying signatures
- FLUTTERWAVE_SECRET_KEY=
- PAYPAL_CLIENT_ID=
- PAYPAL_SECRET=
- NEXT_PUBLIC_BASE_URL=http://localhost:3000

API routes added:

- `POST /api/orders/create` — create a demo order (used by the checkout page)
- `GET /api/orders/get` — list demo orders
- `POST /api/payments/paystack/init` — initialize Paystack transaction (accepts `orderId` and `reference`; supports `payment_method: 'mobile_money'` with `phone` & `provider`)
- `POST /api/payments/paystack/webhook` — webhook receiver for Paystack (verifies transaction and marks order `paid` in demo orders file)
- `POST /api/payments/flutterwave/init` — initialize Flutterwave payment
- `POST /api/payments/flutterwave/webhook` — Flutterwave webhook receiver
- `POST /api/payments/paypal/create-order` — create PayPal order (sandbox)

Frontend demo page:

- `/checkout` — demo checkout page that creates an order, calls the provider endpoints and redirects to the provider payment pages.

Quick test scripts:

- `node scripts/test-payments.js` — will create an order and call Paystack init (requires your server running and server-side keys configured).
- `node scripts/simulate-paystack-webhook.js` — simulate a Paystack webhook (uses `PAYSTACK_WEBHOOK_SECRET` to sign the payload if present).
- `node scripts/simulate-flutterwave-webhook.js` — simulate a Flutterwave webhook (uses `FLUTTERWAVE_SECRET_KEY` to sign the payload if present).

Notes:

- These endpoints are minimal demos to help you test flows in sandbox. You must implement production hardening: server-side order lookup, verification (transaction/verify), idempotency, retry handling, logging, secure webhook verification and order reconciliation before going to production. Use the simulation scripts to test webhook handling locally while running your server (set `NEXT_PUBLIC_BASE_URL` if not `http://localhost:3000`).
