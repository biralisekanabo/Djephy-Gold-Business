// Simple test script to exercise order creation and Paystack init (requires PAYSTACK_SECRET_KEY)
// Usage: node scripts/test-payments.js

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

(async () => {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://e-commerce-r1l9.vercel.app";
    console.log("Using base URL", base);

    // Create order
    const create = await fetch(base + "/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ name: "Test" }],
        amount: 10,
        email: "test@example.com",
      }),
    });
    const createData = await create.json();
    console.log("Create order response", createData);
    const orderId = createData?.order?.id;
    if (!orderId) throw new Error("order creation failed");

    // Init Paystack (requires PAYSTACK_SECRET_KEY on server)
    const init = await fetch(base + "/api/payments/paystack/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 10,
        email: "test@example.com",
        currency: "CDF",
        orderId,
        reference: `ord_${orderId}_${Date.now()}`,
      }),
    });
    const initData = await init.json();
    console.log("Paystack init", initData);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
