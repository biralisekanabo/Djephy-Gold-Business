"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, LayoutDashboard, Image as ImageIcon, Loader2, 
  Sparkles, Menu, X, Upload, Trash2, 
  LogOut, ShoppingBag, Calendar, User, DollarSign,
  CheckCircle2, Phone, MapPin, Package, TrendingUp
} from 'lucide-react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]); 
  const [view, setView] = useState('products'); 
  
  const [newProduct, setNewProduct] = useState({
    nom: '', prix: '', cat: 'Phone', stock: '', image: '', 
    ecran: '', batterie: '', stockage: ''
  });

  useEffect(() => {
    const raw = localStorage.getItem('djephy_user') || localStorage.getItem('user');
    if (!raw) {
      window.location.href = '/';
      return;
    }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'admin') {
        window.location.href = '/mon-espace';
        return;
      }
      setAuthorized(true);
      fetchProducts();
      fetchOrders(); 
    } catch (e) {
      window.location.href = '/';
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost/api/admin_manage.php?action=list');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur de chargement produits");
      setProducts([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost/api/admin_manage.php?action=list_orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur de chargement commandes");
      setOrders([]);
    }
  };

  // NOUVELLE FONCTION : Mise à jour du statut
  const updateOrderStatus = async (orderId: number) => {
    try {
      const res = await fetch('http://localhost/api/admin_manage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id: orderId, status: 'Livré' })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(); // Rafraîchir la liste
      }
    } catch (e) {
      alert("Erreur de mise à jour");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost/api/admin_manage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          ...newProduct,
          prix: parseFloat(newProduct.prix),
          stock: parseInt(newProduct.stock)
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewProduct({ nom: '', prix: '', cat: 'Phone', stock: '', image: '', ecran: '', batterie: '', stockage: '' });
        fetchProducts();
        alert("Produit ajouté à la boutique !");
      }
    } catch (error) {
      alert("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Supprimer ce produit ?")) return;
    try {
        await fetch('http://localhost/api/admin_manage.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        });
        fetchProducts();
    } catch (e) {
        alert("Erreur lors de la suppression");
    }
  };

  // Calculs pour les statistiques utiles
  const CA = orders.filter(o => o.status === 'Livré').reduce((acc, curr) => acc + parseFloat(curr.total_price), 0);
  const totalStock = products.reduce((acc, curr) => acc + parseInt(curr.stock), 0);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col md:flex-row font-sans text-stone-900">
      
      {/* --- SIDEBAR (Couleurs Gold & Dark) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1c1917] p-8 flex flex-col transition-transform md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static shadow-2xl`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-[#d4af37] p-2 rounded-xl shadow-lg shadow-yellow-900/20">
            <Sparkles size={20} className="text-[#1c1917]" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-[#d4af37]">Gold Admin</h2>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            type="button"
            onClick={() => { setView('products'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'products' ? 'bg-[#d4af37] text-[#1c1917]' : 'text-stone-500 hover:bg-stone-800'}`}>
            <PlusCircle size={18} /> Catalogue
          </button>
          
          <button 
            type="button"
            onClick={() => { setView('orders'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'orders' ? 'bg-[#d4af37] text-[#1c1917]' : 'text-stone-500 hover:bg-stone-800'}`}>
            <ShoppingBag size={18} /> Commandes
          </button>

          <button type="button" onClick={() => window.location.href = '/'} className="flex items-center gap-3 w-full p-4 rounded-2xl text-stone-500 hover:bg-stone-800 font-bold text-xs uppercase tracking-widest transition-all">
            <LayoutDashboard size={18} /> Boutique Live
          </button>
        </nav>

        <button type="button" onClick={() => { localStorage.clear(); window.location.href='/'; }} className="flex items-center gap-3 p-4 text-red-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-900/20 rounded-2xl transition-all">
          <LogOut size={16} /> Déconnexion
        </button>
      </aside>

      {/* --- CONTENU --- */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight italic">
                {view === 'products' ? 'Gestion Catalogue' : 'Suivi des Commandes'}
              </h1>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Djephy Digital Premium</p>
            </div>

            {/* Widgets de Statistiques */}
            <div className="flex gap-4">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={16}/></div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Ventes Livrées</p>
                    <p className="font-bold text-sm text-[#d4af37]">{CA.toLocaleString()} $</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3">
                  <div className="p-2 bg-stone-50 text-stone-600 rounded-lg"><Package size={16}/></div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Articles Stock</p>
                    <p className="font-bold text-sm">{totalStock} unités</p>
                  </div>
               </div>
               <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 bg-white rounded-xl shadow-sm border border-stone-100">
                {isMobileMenuOpen ? <X /> : <Menu />}
               </button>
            </div>
          </header>

          {view === 'products' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* FORMULAIRE */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Désignation</label>
                    <input required placeholder="iPhone 15 Pro..." value={newProduct.nom} onChange={e => setNewProduct({...newProduct, nom: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-[#d4af37] outline-none transition-all font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Prix HT ($)</label>
                    <input required type="number" step="0.01" value={newProduct.prix} onChange={e => setNewProduct({...newProduct, prix: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-[#d4af37] outline-none transition-all font-bold text-sm text-[#d4af37]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Catégorie</label>
                    <select value={newProduct.cat} onChange={e => setNewProduct({...newProduct, cat: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-[#d4af37] outline-none transition-all font-bold text-sm cursor-pointer">
                      <option value="Phone">Phone</option>
                      <option value="PC">PC</option>
                      <option value="Watch">Watch</option>
                      <option value="Accessoires">Accessoires</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Quantité Stock</label>
                    <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-[#d4af37] outline-none transition-all font-bold text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Image Produit</label>
                  <div className="relative group">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full p-8 border-2 border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 group-hover:bg-yellow-50 group-hover:border-[#d4af37] transition-all">
                      <Upload size={24} className="text-stone-300 group-hover:text-[#d4af37]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Cliquez pour ajouter</span>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-[#1c1917] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-[#d4af37] hover:text-[#1c1917] transition-all flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : "Publier sur la boutique"}
                </button>
              </form>

              {/* LISTE & PREVIEW */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white p-4 rounded-[2.5rem] border border-stone-100 shadow-sm flex items-center justify-center aspect-square overflow-hidden relative">
                  {newProduct.image ? (
                    <img src={newProduct.image} className="w-full h-full object-contain p-4" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={48} className="text-stone-100 mx-auto" />
                      <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest mt-2">Aperçu direct</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 px-2">Derniers ajouts</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence>
                      {products.map((p: any) => (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={p.id} className="bg-white p-3 rounded-2xl border border-stone-50 shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-stone-50" alt="" />
                            <div>
                              <p className="text-xs font-black truncate max-w-[120px]">{p.nom}</p>
                              <p className="text-[10px] font-bold text-[#d4af37]">{p.prix} $</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleDelete(p.id)} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- VUE COMMANDES AVEC PROFIL CLIENT --- */
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50">
                      <th className="p-6 text-[10px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-100">Profil Client</th>
                      <th className="p-6 text-[10px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-100 text-center">Articles</th>
                      <th className="p-6 text-[10px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-100">Total</th>
                      <th className="p-6 text-[10px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-100">Action Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {orders.length > 0 ? orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 transition-all group">
                        <td className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 group-hover:bg-[#d4af37] group-hover:text-[#1c1917] transition-all">
                              <User size={20} />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-sm">{order.client_name || 'Inconnu'}</p>
                              <div className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1.5 text-[10px] text-stone-500 font-bold"><Phone size={10}/> {order.phone || '00 00 00 00'}</span>
                                <span className="flex items-center gap-1.5 text-[10px] text-stone-400"><MapPin size={10}/> {order.address || 'Non spécifiée'}</span>
                                <span className="text-[9px] text-stone-300 italic uppercase">ID Commande: #{order.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className="inline-flex items-center justify-center h-8 w-8 bg-[#1c1917] text-white rounded-full text-[10px] font-black">
                            {order.items_count}
                          </span>
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-black text-[#d4af37]">{order.total_price} $</p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-center ${
                              order.status === 'Livré' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {order.status || 'En attente'}
                            </span>
                            {order.status !== 'Livré' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id)}
                                className="flex items-center justify-center gap-2 py-1 text-[9px] font-black uppercase text-green-600 hover:underline"
                              >
                                <CheckCircle2 size={12}/> Confirmer Livraison
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <ShoppingBag size={48} className="text-stone-100 mx-auto mb-4" />
                          <p className="text-stone-300 font-bold uppercase text-xs tracking-widest">Aucune commande</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}