import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    amount,
    currency = "CDF",
    tx_ref,
    redirect_url,
    customer,
    orderId,
    payment_method,
    provider,
  } = body;

  if (!process.env.FLUTTERWAVE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Missing FLUTTERWAVE_SECRET_KEY" },
      { status: 500 },
    );
  }

  // Build payment options
  let payment_options = "card,ussd";
  if (payment_method === "mobile_money") {
    // use Flutterwave mobilemoney option; provider can be passed via meta or in payload if needed
    payment_options = "mobilemoney";
  }

  const payload: Record<string, unknown> = {
    tx_ref: tx_ref || `tx-${Date.now()}`,
    amount: String(amount),
    currency,
    redirect_url:
      redirect_url ||
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/checkout/callback`,
    customer: customer || { email: "test@example.com" },
    payment_options,
    meta: { orderId, provider, payment_method },
  };

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok)
    return NextResponse.json({ error: data }, { status: res.status });

  return NextResponse.json(data);
}
