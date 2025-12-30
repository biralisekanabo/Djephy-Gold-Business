import { NextResponse } from "next/server";

// Minimal Paystack webhook handler (test mode)
type Order = {
  id?: string;
  reference?: string;
  status?: string;
  [k: string]: unknown;
};

export async function POST(req: Request) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
  const signature = req.headers.get("x-paystack-signature") || "";
  const raw = await req.text();

  // If webhook secret is configured, verify signature
  if (PAYSTACK_SECRET) {
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(raw)
      .digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
  }

  const payload = JSON.parse(raw);
  // Extract reference (transaction reference from Paystack)
  const reference = payload?.data?.reference;

  // We will verify the transaction with Paystack before trusting it
  if (reference && process.env.PAYSTACK_SECRET_KEY) {
    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );
      const verifyData = await verifyRes.json();
      if (
        verifyRes.ok &&
        verifyData.data &&
        verifyData.data.status === "success"
      ) {
        // Mark order as paid if metadata.orderId exists
        const orderId =
          verifyData.data.metadata?.orderId || payload?.data?.metadata?.orderId;
        if (orderId) {
          try {
            const fs = await import("fs");
            const path = await import("path");
            const DATA_DIR = path.join(process.cwd(), "data");
            const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
            if (fs.existsSync(ORDERS_FILE)) {
              const rawOrders = fs.readFileSync(ORDERS_FILE, "utf-8");
              const orders = JSON.parse(rawOrders || "[]");
              const idx = orders.findIndex(
                (o: Order) => o.id === orderId || o.reference === reference,
              );
              if (idx !== -1) {
                orders[idx].status = "paid";
                orders[idx].paidAt = new Date().toISOString();
                orders[idx].payment = {
                  provider: "paystack",
                  reference,
                  verifyData: verifyData.data,
                };
                fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
                console.log("Order marked as paid:", orderId);
              }
            }
          } catch (err) {
            console.warn("Could not update order file on webhook:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error verifying paystack transaction", err);
    }
  }

  console.log("Paystack webhook event:", payload.event, reference);
  return NextResponse.json({ received: true });
}
