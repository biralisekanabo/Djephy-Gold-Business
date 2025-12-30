import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

export async function GET() {
  if (!existsSync(ORDERS_FILE)) return NextResponse.json({ orders: [] });
  const ordersRaw = readFileSync(ORDERS_FILE, "utf-8");
  const orders = JSON.parse(ordersRaw);
  return NextResponse.json({ orders });
}
