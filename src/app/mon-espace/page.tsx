"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, LogOut, Search, ShoppingBag,
  ChevronRight, CheckCircle, Loader2, Download 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TYPES ---
interface OrderItem {
  nom_produit: string;
  quantite: number;
  prix_unitaire: string | number;
}

interface Order {
  id: number;
  ville: string;
  date_commande: string;
  statut: string;
  prix_total: string | number;
  items: OrderItem[];
}

interface UserData {
  success: boolean;
  message?: string;
  profile: {
    nom_complet?: string;
    nom?: string;
    email?: string;
  };
  orders: Order[];
}

export default function DashboardPage() {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // --- GÉNÉRATION DE FACTURE PDF ---
  const generatePDF = (order: Order) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("FACTURE", 15, 25);
    
    doc.setFontSize(10);
    doc.text(`Référence : #CMD-${order.id}`, 15, 33);

    // Infos Client & Boutique
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DESTINATAIRE :", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`${data?.profile?.nom_complet || data?.profile?.nom || 'Client'}`, 15, 62);
    doc.text(`${data?.profile?.email || ''}`, 15, 68);
    doc.text(`Ville : ${order.ville || 'Non précisée'}`, 15, 74);

    doc.setFont("helvetica", "bold");
    doc.text("ÉMETTEUR :", 140, 55);
    doc.setFont("helvetica", "normal");
    doc.text("Ma Boutique en Ligne", 140, 62);
    doc.text(`Date : ${order.date_commande}`, 140, 68);

    const tableRows = (order.items || []).map((item) => [
      item.nom_produit,
      item.quantite.toString(),
      `${parseFloat(String(item.prix_unitaire)).toFixed(2)} $`,
      `${(item.quantite * parseFloat(String(item.prix_unitaire))).toFixed(2)} $`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Produit', 'Qté', 'Prix Unitaire', 'Sous-total']],
      body: tableRows,
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
    });

    // Total - Correction du positionnement
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`MONTANT TOTAL : ${parseFloat(String(order.prix_total)).toFixed(2)} $`, 130, finalY);

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Merci pour votre achat ! Ce document est une preuve de transaction.", 105, 285, { align: "center" });

    doc.save(`Facture_Commande_${order.id}.pdf`);
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const storedUser = localStorage.getItem('user') || localStorage.getItem('djephy_user');
        
        if (!storedUser) {
          window.location.replace('/');
          return;
        }

        const user = JSON.parse(storedUser);
        // Extraction robuste de l'ID (Adaptation : gestion des objets imbriqués ou directs)
        const userId = user.id_utilisateur || user.id || user.user?.id_utilisateur || user.user?.id;

        if (!userId) {
          throw new Error("Identifiant utilisateur introuvable.");
        }

        const response = await fetch(`http://127.0.0.1/api/passer_commande.php?id_utilisateur=${userId}`, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
        
        const resData: UserData = await response.json();
        
        if (isMounted) {
          if (resData.success) {
            setData(resData);
          } else {
            setError(resData.message || "Impossible de charger vos données.");
          }
          setLoading(false);
        }
      } catch (e: any) {
        if (isMounted) {
          console.error("Erreur de session:", e);
          setError(e.message || "Session invalide.");
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  // --- FILTRES ---
  const filteredOrders = useMemo(() => {
    if (!data?.orders || !Array.isArray(data.orders)) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return data.orders;

    return data.orders.filter((order) => 
      order.ville?.toLowerCase().includes(query) ||
      order.id.toString().includes(query) ||
      order.statut?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const totalSpent = useMemo(() => {
    if (!data?.orders) return "0.00";
    return data.orders.reduce((acc, cur) => acc + parseFloat(String(cur.prix_total || "0")), 0).toFixed(2);
  }, [data]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Synchronisation...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-xl max-w-md">
           <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <Package size={32} />
           </div>
           <p className="font-black uppercase text-[10px] text-red-600 mb-2">Erreur système</p>
           <p className="text-sm font-bold text-zinc-600 mb-8">{error}</p>
           <button 
             onClick={() => { localStorage.clear(); window.location.href = '/'; }}
             className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs hover:bg-zinc-800 transition-all"
           >
             Retourner à l'accueil
           </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-100">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Package size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Mon<span className="text-blue-600">Espace</span></h1>
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 transition-all">
              <ShoppingBag size={14} /> Boutique
            </button>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-zinc-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition-all w-48 focus:w-64"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 border-l border-zinc-100 pl-5">
                <span className="text-xs font-bold hidden sm:block">
                  {data?.profile?.nom_complet || data?.profile?.nom || 'Client'}
                </span>
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-black uppercase">
                    {(data?.profile?.nom_complet || data?.profile?.nom)?.[0] || 'U'}
                </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10">
          
          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-zinc-50 border border-zinc-100 p-8 rounded-[2.5rem]">
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Profil Utilisateur</p>
                <h2 className="text-3xl font-black leading-tight truncate">
                  {data?.profile?.nom_complet || data?.profile?.nom || 'Utilisateur'}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Email associé</p>
                    <p className="text-sm font-bold truncate">{data?.profile?.email || 'N/A'}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Cumul des achats</p>
                    <p className="text-sm font-black text-blue-600">{totalSpent} $</p>
                </div>
                
                <button 
                    onClick={() => { localStorage.clear(); window.location.href='/'; }} 
                    className="w-full mt-4 py-4 border border-zinc-200 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut size={16} /> Quitter la session
                </button>
              </div>
            </section>
          </aside>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Historique</h3>
                <span className="bg-zinc-900 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">
                    {filteredOrders.length} {filteredOrders.length > 1 ? 'Commandes' : 'Commande'}
                </span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={order.id}
                      className={`bg-white border rounded-[2rem] overflow-hidden transition-all ${
                        expandedOrder === order.id ? 'border-blue-600 shadow-xl shadow-blue-600/5' : 'border-zinc-100'
                      }`}
                    >
                      <div 
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-6 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            expandedOrder === order.id ? 'bg-blue-600 text-white' : 'bg-zinc-50 text-zinc-400'
                          }`}>
                            <ShoppingBag size={22} />
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase">COMMANDE #{order.id}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">
                              {order.ville} • {order.date_commande}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-lg font-black text-blue-600">{parseFloat(String(order.prix_total)).toFixed(2)} $</p>
                            <div className="flex items-center justify-end gap-1 text-green-500">
                              <CheckCircle size={10} />
                              <span className="text-[9px] font-black uppercase">{order.statut}</span>
                            </div>
                          </div>
                          <motion.div animate={{ rotate: expandedOrder === order.id ? 90 : 0 }}>
                            <ChevronRight size={18} className="text-zinc-300" />
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: "auto", opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-50/50 border-t border-zinc-100"
                          >
                            <div className="p-6 space-y-3">
                              <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black uppercase text-zinc-400">Détails des articles</p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); generatePDF(order); }}
                                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all"
                                >
                                  <Download size={14} /> Facture
                                </button>
                              </div>

                              <div className="grid gap-2">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                {item.quantite}x
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-800">{item.nom_produit}</p>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase">Unit: {parseFloat(String(item.prix_unitaire)).toFixed(2)} $</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-zinc-900">{(item.quantite * parseFloat(String(item.prix_unitaire))).toFixed(2)} $</p>
                                    </div>
                                    ))
                                ) : (
                                    <p className="py-4 text-center text-xs text-zinc-400 italic">Aucun détail disponible.</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-zinc-100 rounded-[3rem]">
                    <Search className="mx-auto text-zinc-200 mb-4" size={48} />
                    <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Aucune commande</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}