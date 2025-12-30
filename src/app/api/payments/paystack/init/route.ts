import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    amount,
    email,
    currency = "CDF",
    reference,
    orderId,
    payment_method,
  } = body;

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Missing PAYSTACK_SECRET_KEY" },
      { status: 500 },
    );
  }

  // Paystack expects amount in the smallest currency unit (e.g., cents)
  const payload: Record<string, unknown> = {
    email,
    amount: Math.round(Number(amount) * 100),
    currency,
  };

  // Ensure we have a reference for tracking
  const ref = reference || `ps_${orderId || "unknown"}_${Date.now()}`;
  payload.reference = ref;

  // If this is a mobile money request, add mobile_money object according to Paystack docs
  if (payment_method === "mobile_money") {
    // Expect body to include phone and provider (e.g., "mtn", "vodacom", "orange")
    if (!body.phone || !body.provider)
      return NextResponse.json(
        { error: "Missing phone or provider for mobile money" },
        { status: 400 },
      );
    payload.mobile_money = { phone: body.phone, provider: body.provider };
  }

  // Attach metadata for order linking (helpful on webhook)
  if (orderId) payload.metadata = { orderId };
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok)
    return NextResponse.json({ error: data }, { status: res.status });

  // If an orderId was provided, update the order with reference and status
  if (orderId) {
    // lightweight file-based order update for demo purposes
    try {
      const fs = await import("fs");
      const path = await import("path");
      const DATA_DIR = path.join(process.cwd(), "data");
      const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
      if (fs.existsSync(ORDERS_FILE)) {
        const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
        const orders = JSON.parse(raw || "[]");
        const idx = orders.findIndex(
          (o: { id?: string; reference?: string; status?: string }) =>
            o.id === orderId,
        );
        if (idx !== -1) {
          orders[idx].reference = ref;
          orders[idx].paymentInit = {
            provider: "paystack",
            payload: data.data,
          };
          orders[idx].status = "initiated";
          fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        }
      }
    } catch (err) {
      console.warn("Could not update order file:", err);
    }
  }

  // Return the provider response with the reference for client usage
  return NextResponse.json({ provider: "paystack", reference: ref, data });
}
