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

export async function GET(req: Request) {
  try {
    const ordersPath = path.join(process.cwd(), 'store', 'orders.json');
    const raw = fs.readFileSync(ordersPath, 'utf8');
    const orders = JSON.parse(raw || '[]');

    const url = new URL(req.url);
    const format = url.searchParams.get('format');

    if (format === 'pdf') {
      try {
        const mod = await import('pdfkit');
        const PDFDocument = (mod as any).default ?? mod;
        return await new Promise((resolve, reject) => {
          const doc = new PDFDocument({ margin: 30 });
          const chunks: any[] = [];
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          doc.on('end', () => {
            const result = Buffer.concat(chunks);
            resolve(new NextResponse(result, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="orders_report.pdf"'
              }
            }));
          });

          doc.fontSize(18).text('Rapport des commandes', { align: 'center' });
          doc.moveDown();

          orders.forEach((o: any) => {
            doc.fontSize(12).text(`ID: ${o.id} | ${o.client_name || 'Inconnu'} | ${o.phone || ''}`);
            doc.text(`${o.items_count} articles • Total: ${o.total_price} $ • Statut: ${o.status || 'En attente'}`);
            if (o.address) doc.text(`Adresse: ${o.address}`);
            doc.moveDown();
          });

          doc.end();
        });
      } catch (e) {
        console.error('PDF generation failed, pdfkit missing or errored', e);
        return NextResponse.json({ success: false, error: 'PDF generation unavailable. Install pdfkit.' }, { status: 500 });
      }
    }

    if (format === 'csv') {
      const headers = ['id','client_name','phone','address','items_count','total_price','status','created_at'];
      const csv = [headers.join(','),
        ...orders.map((o: any) => headers.map(h => {
          const v = o[h] ?? '';
          return `"${String(v).replace(/"/g, '""')}"`;
        }).join(','))
      ].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="orders_report.csv"'
        }
      });
    }

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json({ success: true, orders: [] });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let idParam = url.searchParams.get('id');
    let id: number | null = idParam ? parseInt(idParam, 10) : null;

    // Fallback to JSON body if not provided in query
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id ? parseInt(body.id, 10) : null;
      } catch (e) {
        id = null;
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const ordersPath = path.join(process.cwd(), 'store', 'orders.json');
    let orders: any[] = [];
    try {
      const raw = fs.readFileSync(ordersPath, 'utf8');
      orders = JSON.parse(raw || '[]');
    } catch (e) {
      orders = [];
    }

    const newOrders = orders.filter(o => o.id !== id);

    try {
      fs.writeFileSync(ordersPath, JSON.stringify(newOrders, null, 2), 'utf8');
    } catch (writeErr) {
      console.error('Failed to write orders file', writeErr);
      return NextResponse.json({ success: false, error: String(writeErr) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete order error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}  