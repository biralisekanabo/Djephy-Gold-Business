import { NextResponse } from "next/server";

async function fetchPayPalToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("Missing PayPal credentials");

  const tokenRes = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );

  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "USD", return_url, cancel_url } = body;

    const token = await fetchPayPalToken();

    const createRes = await fetch(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            { amount: { currency_code: currency, value: String(amount) } },
          ],
          application_context: {
            return_url:
              return_url ||
              `${process.env.NEXT_PUBLIC_BASE_URL || ""}/checkout/success`,
            cancel_url:
              cancel_url ||
              `${process.env.NEXT_PUBLIC_BASE_URL || ""}/checkout/cancel`,
          },
        }),
      },
    );

    const data = await createRes.json();
    if (!createRes.ok)
      return NextResponse.json({ error: data }, { status: createRes.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("PayPal create order error", err);
    return NextResponse.json({ error: "PayPal error" }, { status: 500 });
  }
}
