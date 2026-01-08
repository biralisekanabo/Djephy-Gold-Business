"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, LogOut, Search, ShoppingBag,
  ChevronRight, CheckCircle, Loader2, Download,
  TrendingUp, Award, Copy, Check, Flame, Plus, Bell, Info, Truck, RefreshCcw
} from 'lucide-react';
import { createInvoicePDF } from '../../lib/pdfTemplates';

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

interface Notification {
  id: number;
  titre: string;
  description: string;
  type: 'info' | 'success' | 'shipping';
  date: string;
  read: boolean;
}

// Données fictives pour les recommandations
const MOCK_CATALOG = [
  { id: 101, nom: "Montre Quartz S", prix: 89.00, image: "⌚", tag: "Accessoires" },
  { id: 102, nom: "Casque Sans Fil Pro", prix: 129.99, image: "🎧", tag: "Tech" },
  { id: 103, nom: "Sac à Dos City", prix: 45.00, image: "🎒", tag: "Mode" },
  { id: 104, nom: "Lampe LED Bureau", prix: 25.00, image: "💡", tag: "Maison" },
];

export default function DashboardPage() {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const generatePDF = (order: Order) => {
    createInvoicePDF(order, data?.profile);
  };

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    // CORRECTION : Changement de 'let' en 'const' pour satisfaire ESLint
    const isMounted = true; 

    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('djephy_user');
      if (!storedUser) {
        window.location.replace('/');
        return;
      }
      const user = JSON.parse(storedUser);
      const userId = user.id_utilisateur || user.id || user.user?.id_utilisateur || user.user?.id;

      if (!userId) throw new Error("Identifiant utilisateur introuvable.");

      const response = await fetch(`https://blessing.alwaysdata.net/api/passer_commande.php?id_utilisateur=${userId}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
      const resData: UserData = await response.json();
      
      if (isMounted) {
        if (resData.success) {
          setData(resData);
          setNotifications([
            { id: 1, titre: "Bienvenue", description: "Votre dashboard est à jour.", type: 'info', date: "Maintenant", read: false },
            ...(resData.orders && resData.orders.length > 0 ? [{ 
                id: 2, 
                titre: "Commande suivie", 
                description: `La commande #${resData.orders[0].id} est traitée.`, 
                type: 'shipping' as const, 
                date: "1h", 
                read: false 
            }] : [])
          ]);
        } else {
          setError(resData.message || "Impossible de charger vos données.");
        }
        setLoading(false);
        setRefreshing(false);
      }
    } catch (e) {
      if (isMounted) {
        setError(e instanceof Error ? e.message : "Session invalide.");
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const analytics = useMemo(() => {
    const orders = data?.orders || [];
    const total = orders.reduce((acc, cur) => acc + parseFloat(String(cur.prix_total || "0")), 0);
    let rank = { name: "Bronze", color: "text-orange-500", bg: "bg-orange-50" };
    if (total > 500) rank = { name: "Argent", color: "text-zinc-500", bg: "bg-zinc-100" };
    if (total > 1500) rank = { name: "Or", color: "text-yellow-500", bg: "bg-yellow-50" };
    
    const monthlyData = orders.slice(0, 6).map(o => ({ val: (parseFloat(String(o.prix_total)) / 500) * 100 }));
    return { total, rank, monthlyData };
  }, [data]);

  const recommendations = useMemo(() => {
    return MOCK_CATALOG.slice(0, 4);
  }, []);

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

  const totalSpentFormatted = useMemo(() => {
    if (!data?.orders) return "0.00";
    return data.orders.reduce((acc, cur) => acc + parseFloat(String(cur.prix_total || "0")), 0).toFixed(2);
  }, [data]);

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Chargement...</p>
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
             Retourner à l&apos;accueil
           </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-100">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Package size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Mon<span className="text-blue-600">Espace</span></h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="p-2.5 bg-zinc-100 rounded-full text-zinc-600 hover:bg-zinc-200 relative">
                <Bell size={20} />
                {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 mt-4 w-72 bg-white border border-zinc-100 shadow-2xl rounded-3xl overflow-hidden z-50">
                    <div className="p-4 border-b border-zinc-50 font-black text-[10px] uppercase">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-zinc-50 flex gap-3 hover:bg-zinc-50">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            {n.type === 'shipping' ? <Truck size={14} /> : <Info size={14} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold leading-tight">{n.titre}</p>
                            <p className="text-[9px] text-zinc-500">{n.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-md">
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
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-black uppercase shadow-inner">
                    {(data?.profile?.nom_complet || data?.profile?.nom)?.[0] || 'U'}
                </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-zinc-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase mb-4 ${analytics.rank.bg} ${analytics.rank.color}`}>
                    <Award size={12} /> Membre {analytics.rank.name}
                </div>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Dépenses Totales</p>
                <h2 className="text-4xl font-black mb-6">{totalSpentFormatted} $</h2>
                
                <div className="flex items-end gap-2 h-12 mb-4">
                    {analytics.monthlyData.map((d, i) => (
                        <div key={i} className="flex-1 bg-blue-500/20 rounded-t-sm" style={{ height: `${Math.max(d.val, 15)}%` }} />
                    ))}
                </div>
                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase">
                    <TrendingUp size={14} /> Tendance achats
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-4 px-2 flex items-center gap-2">
                <Flame size={14} className="text-orange-500" /> Recommandé pour vous
              </h4>
              <div className="space-y-3">
                {recommendations.map(prod => (
                  <div key={prod.id} className="bg-zinc-50 border border-zinc-100 p-3 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all group cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">{prod.image}</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none">{prod.tag}</p>
                      <p className="text-xs font-black">{prod.nom}</p>
                      <p className="text-[10px] font-bold">{prod.prix} $</p>
                    </div>
                    <Plus size={16} className="text-zinc-300 group-hover:text-blue-600" />
                  </div>
                ))}
              </div>
            </section>

            <button onClick={() => loadDashboard(true)} className="w-full py-4 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all">
                <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} /> Actualiser les données
            </button>

            <button onClick={() => { localStorage.clear(); window.location.href='/'; }} className="w-full py-4 border border-zinc-100 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <LogOut size={16} /> Déconnexion
            </button>
          </aside>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Historique <span className="text-blue-600">.</span></h3>
                <span className="bg-zinc-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                    {filteredOrders.length} Transactions
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
                        expandedOrder === order.id ? 'border-blue-600 shadow-xl' : 'border-zinc-100 hover:border-zinc-300'
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
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black uppercase">COMMANDE #{order.id}</p>
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(order.id); }} className="text-zinc-300 hover:text-blue-600 transition-colors">
                                    {copiedId === order.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                            </div>
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

                      {expandedOrder !== order.id && order.items && (
                        <div className="px-6 pb-4 flex flex-wrap gap-2">
                           {order.items.slice(0, 3).map((it, i) => (
                             <span key={i} className="text-[8px] font-black uppercase bg-zinc-50 px-2 py-0.5 rounded text-zinc-400">{it.nom_produit}</span>
                           ))}
                        </div>
                      )}

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
                                <p className="text-[10px] font-black uppercase text-zinc-400">Détails de facturation</p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); generatePDF(order); }}
                                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all shadow-lg shadow-blue-200"
                                >
                                  <Download size={14} /> Télécharger PDF
                                </button>
                              </div>

                              <div className="grid gap-2">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
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
                    <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Aucune commande trouvée</p>
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