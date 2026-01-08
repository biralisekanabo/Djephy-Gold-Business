import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

type OrderItem = {
  nom_produit: string;
  quantite: number;
  prix_unitaire: string | number;
};

type Order = {
  id: number;
  ville?: string;
  date_commande?: string;
  statut?: string;
  prix_total?: string | number;
  items?: OrderItem[];
};

type Product = {
  id: number | string;
  nom: string;
  prix?: number | string;
  cat?: string;
  stock?: number | string;
};

const BRAND_RGB: [number, number, number] = [37, 99, 235]; // blue

export function createInvoicePDF(order: Order, profile?: { nom_complet?: string; nom?: string; email?: string }) {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  // Header
  doc.setFillColor(BRAND_RGB[0], BRAND_RGB[1], BRAND_RGB[2]);
  doc.rect(0, 0, 210, 48, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Djephy Gold — Facture', 14, 28);

  doc.setFontSize(9);
  doc.text(`Réf : #CMD-${order.id}`, 14, 36);
  const dateStr = order.date_commande || new Date().toLocaleString();
  doc.text(`Date : ${dateStr}`, 14, 42);

  // Destinataire / Émetteur boxes
  doc.setDrawColor(220);
  doc.setFillColor(250, 250, 250);
  doc.rect(14, 50, 85, 30, 'F');
  doc.rect(111, 50, 85, 30, 'F');

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATAIRE', 16, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(profile?.nom_complet || profile?.nom || 'Client', 16, 64);
  if (profile?.email) doc.text(profile.email, 16, 70);
  doc.text(`Ville: ${order.ville || '—'}`, 16, 76);

  doc.setFont('helvetica', 'bold');
  doc.text('ENTREPRISE', 113, 58);
  doc.setFont('helvetica', 'normal');
  doc.text('Djephy Gold Business', 113, 64);
  doc.text(`Date facture: ${dateStr}`, 113, 70);

  // Table of items
  const rows = (order.items || []).map((it) => [
    it.nom_produit,
    it.quantite.toString(),
    `${parseFloat(String(it.prix_unitaire)).toFixed(2)} $`,
    `${(it.quantite * parseFloat(String(it.prix_unitaire))).toFixed(2)} $`,
  ]);

  autoTable(doc, {
    startY: 88,
    head: [['Produit', 'Qté', 'Prix Unitaire', 'Sous-total']],
    body: rows,
    headStyles: { fillColor: BRAND_RGB, textColor: 255 },
    styles: { fontSize: 9 },
    theme: 'striped',
  });

  // Total
  const finalY = doc.lastAutoTable?.finalY || 140;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`MONTANT TOTAL : ${(parseFloat(String(order.prix_total || '0'))).toFixed(2)} $`, 130, finalY + 12);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Merci pour votre confiance — Djephy Gold Business', 105, 285, { align: 'center' });

  doc.save(`Facture_Commande_${order.id}.pdf`);
}

type OrderReport = {
  id: string | number;
  client_name?: string;
  items_details?: string;
  total_price?: string | number;
  status?: string;
};

export function createReportPDF(products: Product[], orders: OrderReport[], opts?: { title?: string }) {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const title = opts?.title || 'Rapport Global Djephy Gold';

  // Header band
  doc.setFillColor(BRAND_RGB[0], BRAND_RGB[1], BRAND_RGB[2]);
  doc.rect(0, 0, 210, 48, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(title, 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Généré le : ${new Date().toLocaleString()}`, 14, 38);

  // Summary boxes
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`Produits: ${products.length}`, 14, 60);
  const totalStock = products.reduce((acc, p) => {
    const s = typeof p.stock === 'string' ? parseInt(String(p.stock)) : (p.stock || 0);
    return acc + (isNaN(s) ? 0 : s);
  }, 0);
  doc.text(`Unités en stock: ${totalStock}`, 14, 68);

  // Products table
  autoTable(doc, {
    startY: 78,
    head: [['ID', 'Nom', 'Catégorie', 'Prix', 'Stock']],
    body: products.map((p) => [String(p.id), p.nom, p.cat || '-', `${p.prix || '-'} $`, String(p.stock || '-')]),
    headStyles: { fillColor: BRAND_RGB, textColor: 255 },
    styles: { fontSize: 9 },
  });

  const finalY = doc.lastAutoTable?.finalY || 140;
  doc.text('Commandes récentes', 14, finalY + 12);

  autoTable(doc, {
    startY: finalY + 18,
    head: [['ID', 'Client', 'Articles', 'Total', 'Statut']],
    body: orders.map((o: OrderReport) => [String(o.id), o.client_name || '-', o.items_details || '-', `${o.total_price || '-'} $`, o.status || '-']),
    headStyles: { fillColor: [80, 80, 80], textColor: 255 },
    styles: { fontSize: 9 },
  });
  doc.save(`Rapport_Global_Djephy_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
}

const pdfTemplates = { createInvoicePDF, createReportPDF };
export default pdfTemplates;
