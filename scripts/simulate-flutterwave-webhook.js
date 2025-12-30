const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

(async () => {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://e-commerce-r1l9.vercel.app";
  const FLUTTER_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || "";

  const fs = await import("fs");
  const path = await import("path");
  const crypto = await import("crypto");

  const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");
  if (!fs.existsSync(ORDERS_FILE)) {
    console.error("No orders found");
    process.exit(1);
  }

  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8") || "[]");
  const order = orders
    .slice()
    .reverse()
    .find((o) => o && o.reference && o.status === "initiated");
  if (!order) {
    console.error("No initiated order found");
    process.exit(1);
  }

  const payload = {
    event: "charge.success",
    data: {
      id: Math.floor(Math.random() * 1000000),
      tx_ref: order.reference,
      status: "successful",
      meta: { orderId: order.id },
    },
  };

  const raw = JSON.stringify(payload);
  const headers = { "Content-Type": "application/json" };
  if (FLUTTER_SECRET) {
    const sig = crypto
      .createHmac("sha256", FLUTTER_SECRET)
      .update(raw)
      .digest("hex");
    headers["verif-hash"] = sig;
  }

  const res = await fetch(base + "/api/payments/flutterwave/webhook", {
    method: "POST",
    headers,
    body: raw,
  });
  console.log("Status", res.status);
  console.log(await res.text());
})();
