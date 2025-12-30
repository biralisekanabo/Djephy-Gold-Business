import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const payload = JSON.parse(raw);

  // If FLUTTERWAVE_SECRET_KEY is set and provider sends a verif-hash header, verify it
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;
  const headerHash =
    req.headers.get("verif-hash") || req.headers.get("verif_hash") || "";
  if (secret && headerHash) {
    try {
      const crypto = await import("crypto");
      const expected = crypto
        .createHmac("sha256", secret)
        .update(raw)
        .digest("hex");
      if (expected !== headerHash) {
        return NextResponse.json({ success: false }, { status: 400 });
      }
    } catch (err) {
      console.warn("Flutterwave webhook signature check failed", err);
    }
  }

  // Try to verify transaction via Flutterwave API if possible
  const data = payload?.data || {};
  const id = data.id;
  const tx_ref = data.tx_ref || data?.meta?.tx_ref || data?.meta?.orderId;

  let verified = false;
  type VerifyResponse = {
    data?: { status?: string; meta?: { orderId?: string } };
    meta?: { orderId?: string };
  } | null;
  let verifyData: VerifyResponse = null;

  try {
    if (id && process.env.FLUTTERWAVE_SECRET_KEY) {
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        },
      );
      verifyData = await verifyRes.json();
      if (
        verifyRes.ok &&
        verifyData &&
        verifyData.data &&
        (verifyData.data.status === "successful" ||
          verifyData.data.status === "success")
      ) {
        verified = true;
      }
    } else if (tx_ref && process.env.FLUTTERWAVE_SECRET_KEY) {
      // best effort: try verifying by tx_ref if supported
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        },
      );
      verifyData = await verifyRes.json();
      if (
        verifyRes.ok &&
        verifyData &&
        verifyData.data &&
        (verifyData.data.status === "successful" ||
          verifyData.data.status === "success")
      ) {
        verified = true;
      }
    } else if (
      data.status === "successful" ||
      data.status === "success" ||
      payload.event === "charge.success"
    ) {
      // fallback: trust the webhook payload (sandbox only)
      verified = true;
      verifyData = data;
    }
  } catch (err) {
    console.error("Flutterwave verify failed", err);
  }

  if (verified) {
    const orderId =
      verifyData?.meta?.orderId || data?.meta?.orderId || tx_ref || null;
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
            (o: { id?: string; reference?: string; status?: string }) =>
              o.id === orderId || o.reference === tx_ref,
          );
          if (idx !== -1 && orders[idx].status !== "paid") {
            orders[idx].status = "paid";
            orders[idx].paidAt = new Date().toISOString();
            orders[idx].payment = { provider: "flutterwave", verifyData };
            fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
            console.log("Order marked as paid by Flutterwave:", orderId);
          }
        }
      } catch (err) {
        console.warn(
          "Could not update order file on Flutterwave webhook:",
          err,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
