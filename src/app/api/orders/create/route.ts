import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureData() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);
  if (!existsSync(ORDERS_FILE)) writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

export async function POST(req: Request) {
  ensureData();
  const body = await req.json();
  const { items = [], amount, email } = body;
  if (!amount || !email)
    return NextResponse.json(
      { error: "Missing amount or email" },
      { status: 400 },
    );

  const ordersRaw = readFileSync(ORDERS_FILE, "utf-8");
  const orders = JSON.parse(ordersRaw);
  const id = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const order = {
    id,
    items,
    amount: Number(amount),
    email,
    status: "pending",
    createdAt: new Date().toISOString(),
    reference: null,
  };
  orders.push(order);
  writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

  return NextResponse.json({ order });
}
