import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ordersPath = path.join(process.cwd(), 'store', 'orders.json');
    let orders: any[] = [];

    try {
      const raw = fs.readFileSync(ordersPath, 'utf8');
      orders = JSON.parse(raw || '[]');
    } catch (e) {
      // file may not exist yet
      orders = [];
    }

    const id = Date.now();
    const order = { id, ...body };
    orders.push(order);

    // Ensure folder exists and write
    try {
      fs.mkdirSync(path.dirname(ordersPath), { recursive: true });
      fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');
    } catch (writeErr) {
      console.error('Failed to write orders file', writeErr);
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Order API error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const ordersPath = path.join(process.cwd(), 'store', 'orders.json');
    const raw = fs.readFileSync(ordersPath, 'utf8');
    const orders = JSON.parse(raw || '[]');
    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json({ success: true, orders: [] });
  }
}