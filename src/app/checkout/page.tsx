"use client";
import React, { useState } from "react";

export default function CheckoutPage() {
  const [amount, setAmount] = useState(10);
  const [email, setEmail] = useState("test@example.com");
  const [method, setMethod] = useState<"paystack" | "flutterwave" | "paypal">(
    "paystack",
  );
  // Paystack mode: 'card' or 'mobile_money'
  const [paystackMethod, setPaystackMethod] = useState<"card" | "mobile_money">(
    "card",
  );
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<"airtel" | "orange" | "vodacom">(
    "airtel",
  );
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);

    try {
      // 1) create an order server-side (demo)
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ name: "Demo product" }],
          amount,
          email,
        }),
      });
      const createData = await createRes.json();
      const orderId = createData?.order?.id;
      if (!orderId) throw new Error("Order creation failed");

      const reference = `ord_${orderId}_${Date.now()}`;

      if (method === "paystack") {
        const payload: Record<string, unknown> = {
          amount,
          email,
          currency: "CDF",
          orderId,
          reference,
          payment_method: paystackMethod,
        };
        if (paystackMethod === "mobile_money") {
          (payload as Record<string, unknown>)["phone"] = phone;
          (payload as Record<string, unknown>)["provider"] = provider;
        }

        const res = await fetch("/api/payments/paystack/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data && data.data && data.data.authorization_url) {
          // store reference locally and redirect
          localStorage.setItem(
            "last_order_reference",
            data.reference || reference,
          );
          window.location.href = data.data.authorization_url;
        } else {
          alert("Paystack init failed: " + JSON.stringify(data));
        }
      }

      if (method === "flutterwave") {
        const res = await fetch("/api/payments/flutterwave/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            tx_ref: `tx-${Date.now()}`,
            customer: { email },
            redirect_url: `${window.location.origin}/checkout/callback`,
            currency: "CDF",
          }),
        });
        const data = await res.json();
        if (data && data.data && data.data.link) {
          window.location.href = data.data.link;
        } else {
          alert("Flutterwave init failed: " + JSON.stringify(data));
        }
      }

      if (method === "paypal") {
        const res = await fetch("/api/payments/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency: "USD",
            return_url: `${window.location.origin}/checkout/success`,
            cancel_url: `${window.location.origin}/checkout/cancel`,
          }),
        });
        const data = await res.json();
        const approve = data?.links?.find(
          (l: { rel?: string; href?: string }) => l.rel === "approve",
        );
        if (approve && approve.href) {
          window.location.href = approve.href;
        } else {
          alert("PayPal create order failed: " + JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error(err);
      alert("Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-xl font-bold">Checkout demo</h1>

      <label className="mb-2 block">Montant (ex: 10)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mb-4 w-full rounded border p-2"
      />

      <label className="mb-2 block">Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded border p-2"
      />

      <div className="mb-4">
        <label className="mb-2 block">Méthode de paiement</label>
        <select
          value={method}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setMethod(e.target.value as "paystack" | "flutterwave" | "paypal")
          }
          className="w-full rounded border p-2"
        >
          <option value="paystack">
            Paystack (cards & mobile money where available)
          </option>
          <option value="flutterwave">Flutterwave (mobile money / card)</option>
          <option value="paypal">PayPal</option>
        </select>

        {method === "paystack" && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={paystackMethod === "card"}
                  onChange={() => setPaystackMethod("card")}
                />
                <span className="text-sm">Carte</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={paystackMethod === "mobile_money"}
                  onChange={() => setPaystackMethod("mobile_money")}
                />
                <span className="text-sm">Mobile Money</span>
              </label>
            </div>

            {paystackMethod === "mobile_money" && (
              <div className="space-y-2">
                <label className="block text-sm">Numéro de téléphone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border p-2"
                  placeholder="e.g. +243812345678"
                />

                <label className="block text-sm">Opérateur</label>
                <select
                  value={provider}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setProvider(
                      e.target.value as "airtel" | "orange" | "vodacom",
                    )
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="airtel">Airtel Money</option>
                  <option value="orange">Orange Money</option>
                  <option value="vodacom">Vodacom</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 text-white"
      >
        {loading ? "Initialisation..." : "Payer"}
      </button>

      <p className="mt-4 text-sm text-slate-500">
        Tester en mode sandbox : configurez les clés dans .env.local et utilisez
        les dashboards sandbox.
      </p>
    </div>
  );
}
