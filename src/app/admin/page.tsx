"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // Importation pour l'optimisation des images
import { 
  PlusCircle, LayoutDashboard, Image as ImageIcon, Loader2, 
  Sparkles, Menu, X, Upload, Trash2, Edit3, 
  LogOut, ShoppingBag, User, Phone, MapPin, Package, TrendingUp,
  Monitor, Battery, Cpu, FileText, Download, CheckCircle2 
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Interfaces pour la robustesse du code ---
interface Product {
  id: number;
  nom: string;
  prix: number | string;
  cat: string;
  stock: number | string;
  image: string;
  ecran?: string;
  batterie?: string;
  stockage?: string;
}

interface Order {
  id: number;
  client_name: string;
  phone: string;
  address: string;
  items_count: number;
  items_details: string;
  total_price: string;
  status: string;
  created_at?: string;
}

// Extension du type jsPDF pour inclure la propriété ajoutée par autotable
interface jsPDFWithAutotable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [, setFetching] = useState(true); // Suppression de l'avertissement 'fetching' inutilisé
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); 
  const [view, setView] = useState('products'); 
  
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newProduct, setNewProduct] = useState({
    nom: '', prix: '', cat: 'Phone', stock: '', image: '', 
    ecran: '', batterie: '', stockage: ''
  });

  // --- Calculs globaux ---
  const CA = orders
    .filter(o => o.status === 'Livré')
    .reduce((acc, curr) => acc + parseFloat(curr.total_price || "0"), 0);
    
  const totalStock = products.reduce((acc, curr) => {
    const val = typeof curr.stock === 'string' ? parseInt(curr.stock) : curr.stock;
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const generateGlobalReport = () => {
    const doc = new jsPDF() as jsPDFWithAutotable;
    const dateStr = new Date().toLocaleDateString();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("DJEPHY DIGITAL - RAPPORT GLOBAL", 14, 25);
    doc.setFontSize(10);
    doc.text(`Généré le : ${dateStr}`, 14, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Résumé de l'Activité", 14, 55);
    doc.setFontSize(11);
    doc.text(`Chiffre d'Affaires Total (Livré): ${CA.toLocaleString()} $`, 14, 65);
    doc.text(`Total produits en catalogue: ${products.length}`, 14, 72);
    doc.text(`Unités totales en stock: ${totalStock}`, 14, 79);

    doc.text("État détaillé du Stock", 14, 95);
    autoTable(doc, {
      startY: 100,
      head: [['ID', 'Nom', 'Catégorie', 'Prix Unit.', 'Stock']],
      body: products.map(p => [p.id, p.nom, p.cat, `${p.prix} $`, p.stock]),
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Utilisation du type étendu au lieu de 'any'
    const finalY = doc.lastAutoTable?.finalY || 150;
    const lastY = finalY + 15;
    doc.text("Historique des Commandes Récentes", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [['ID', 'Client', 'Articles', 'Total', 'Statut']],
      body: orders.map(o => [o.id, o.client_name, o.items_details || 'Aucun détail', `${o.total_price} $`, o.status]),
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save(`Rapport_Global_Djephy_${dateStr.replace(/\//g, '-')}.pdf`);
  };

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
    } catch {
      window.location.href = '/';
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost/api/admin_manage.php?action=list');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
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
    } catch {
      console.error("Erreur de chargement commandes");
      setOrders([]);
    }
  };

  const prepareEdit = (p: Product) => {
    setEditingId(p.id);
    setNewProduct({
      nom: p.nom, 
      prix: p.prix.toString(), 
      cat: p.cat, 
      stock: p.stock.toString(), 
      image: p.image, 
      ecran: p.ecran || '', 
      batterie: p.batterie || '', 
      stockage: p.stockage || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateOrderStatus = async (orderId: number) => {
    try {
      const res = await fetch('http://localhost/api/admin_manage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'update_status', 
            id: orderId, 
            status: 'Livré' 
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(); 
      }
    } catch {
      alert("Erreur de mise à jour");
    }
  };

  const deleteOrder = async (orderId: number) => {
    if(!confirm("Supprimer définitivement cette commande et son historique ?")) return;
    try {
      const res = await fetch('http://localhost/api/admin_manage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'delete_order', 
            id: orderId 
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(); 
      }
    } catch {
      alert("Erreur lors de la suppression de la commande");
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
    const actionType = editingId ? 'update' : 'add';
    try {
      const res = await fetch('http://localhost/api/admin_manage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionType, 
          id: editingId, 
          ...newProduct,
          prix: parseFloat(newProduct.prix),
          stock: parseInt(newProduct.stock)
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewProduct({ nom: '', prix: '', cat: 'Phone', stock: '', image: '', ecran: '', batterie: '', stockage: '' });
        setEditingId(null);
        fetchProducts();
        alert(editingId ? "Produit mis à jour !" : "Produit ajouté à la boutique !");
      }
    } catch {
      alert("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Supprimer ce produit ?")) return;
    try {
        const res = await fetch('http://localhost/api/admin_manage.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        });
        const data = await res.json();
        if (data.success) {
            fetchProducts();
        }
    } catch {
        alert("Erreur lors de la suppression");
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-black">
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-black p-8 flex flex-col transition-transform md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static shadow-2xl`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Djephy Admin</h2>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            type="button"
            onClick={() => { setView('products'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'products' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}>
            <PlusCircle size={18} /> Catalogue
          </button>
          
          <button 
            type="button"
            onClick={() => { setView('orders'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'orders' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}>
            <ShoppingBag size={18} /> Commandes
          </button>

          <button 
            type="button"
            onClick={() => { setView('reports'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${view === 'reports' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900'}`}>
            <FileText size={18} /> Rapports
          </button>

          <button type="button" onClick={() => { window.location.href = '/'; }} className="flex items-center gap-3 w-full p-4 rounded-2xl text-zinc-400 hover:bg-zinc-900 font-bold text-xs uppercase tracking-widest transition-all">
            <LayoutDashboard size={18} /> Boutique Live
          </button>
        </nav>

        <button type="button" onClick={() => { localStorage.clear(); window.location.href='/'; }} className="flex items-center gap-3 p-4 text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-950/20 rounded-2xl transition-all">
          <LogOut size={16} /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-12 overflow-y-auto bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight italic text-black">
                {view === 'products' ? 'Gestion Catalogue' : view === 'orders' ? 'Suivi des Commandes' : 'Rapports Business'}
              </h1>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mt-1">Djephy Digital Premium</p>
            </div>

            <div className="flex gap-4">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={16}/></div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Ventes Livrées</p>
                    <p className="font-bold text-sm text-orange-600">{CA.toLocaleString()} $</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 text-black rounded-lg"><Package size={16}/></div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Articles Stock</p>
                    <p className="font-bold text-sm">{totalStock} unités</p>
                  </div>
               </div>
               <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 bg-white rounded-xl shadow-sm border border-zinc-200">
                {isMobileMenuOpen ? <X /> : <Menu />}
               </button>
            </div>
          </header>

          {view === 'products' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 space-y-8">
                {editingId && (
                  <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase">Mode Édition Activé</p>
                    <button type="button" onClick={() => {setEditingId(null); setNewProduct({nom:'', prix:'', cat:'Phone', stock:'', image:'', ecran:'', batterie:'', stockage:''});}} className="text-[10px] font-bold text-red-500 uppercase underline">Annuler</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Désignation</label>
                    <input required placeholder="iPhone 15 Pro..." value={newProduct.nom} onChange={e => setNewProduct({...newProduct, nom: e.target.value})} className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Prix HT ($)</label>
                    <input required type="number" step="0.01" value={newProduct.prix} onChange={e => setNewProduct({...newProduct, prix: e.target.value})} className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-sm text-orange-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1"><Monitor size={10}/> Écran</label>
                     <input placeholder="6.7' OLED" value={newProduct.ecran} onChange={e => setNewProduct({...newProduct, ecran: e.target.value})} className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 outline-none text-xs font-bold" />
                    </div>
                    <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1"><Battery size={10}/> Batterie</label>
                     <input placeholder="5000 mAh" value={newProduct.batterie} onChange={e => setNewProduct({...newProduct, batterie: e.target.value})} className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 outline-none text-xs font-bold" />
                    </div>
                    <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-1"><Cpu size={10}/> Stockage</label>
                     <input placeholder="256 GB" value={newProduct.stockage} onChange={e => setNewProduct({...newProduct, stockage: e.target.value})} className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 outline-none text-xs font-bold" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Catégorie</label>
                    <select value={newProduct.cat} onChange={e => setNewProduct({...newProduct, cat: e.target.value})} className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-sm cursor-pointer">
                      <option value="Phone">Phone</option>
                      <option value="PC">PC</option>
                      <option value="Watch">Watch</option>
                      <option value="Accessoires">Accessoires</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Quantité Stock</label>
                    <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Image Produit</label>
                  <div className="relative group">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full p-8 border-2 border-dashed border-zinc-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:border-blue-600 transition-all">
                      {newProduct.image ? (
                        <Image 
                          src={newProduct.image} 
                          width={80} 
                          height={80} 
                          className="object-contain rounded-lg shadow-md" 
                          alt="Preview" 
                        />
                      ) : (
                        <Upload size={24} className="text-zinc-300 group-hover:text-blue-600" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cliquez pour ajouter/modifier</span>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-xl transition-all flex items-center justify-center gap-3 ${editingId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-black text-white hover:bg-zinc-800'}`}>
                  {loading ? <Loader2 className="animate-spin" /> : editingId ? "Enregistrer les modifications" : "Publier sur la boutique"}
                </button>
              </form>
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white p-4 rounded-[2.5rem] border border-zinc-200 shadow-sm flex items-center justify-center aspect-square overflow-hidden relative">
                  {newProduct.image ? (
                    <Image src={newProduct.image} fill className="object-contain p-4" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={48} className="text-zinc-100 mx-auto" />
                      <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mt-2">Aperçu direct</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-2">Liste du Catalogue</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 overflow-x-hidden">
                    <AnimatePresence>
                      {products.map((p) => (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={p.id} className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Image 
                              src={p.image} 
                              width={40} 
                              height={40} 
                              className="rounded-lg object-cover bg-zinc-50" 
                              alt={p.nom} 
                            />
                            <div>
                              <p className="text-xs font-black truncate max-w-[120px]">{p.nom}</p>
                              <p className="text-[10px] font-bold text-orange-600">{p.prix} $</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => prepareEdit(p)} className="p-2 text-zinc-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                              <Edit3 size={16} />
                            </button>
                            <button type="button" onClick={() => handleDelete(p.id)} className="p-2 text-zinc-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'orders' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="p-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100">Profil Client</th>
                      <th className="p-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 text-center">Articles</th>
                      <th className="p-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100">Total</th>
                      <th className="p-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100">Action Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {orders.length > 0 ? orders.map((order) => (
                      <tr key={order.id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <User size={20} />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-sm">{order.client_name || 'Inconnu'}</p>
                              <div className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold"><Phone size={10}/> {order.phone || 'N/A'}</span>
                                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400"><MapPin size={10}/> {order.address || 'Non spécifiée'}</span>
                                <span className="text-[9px] text-blue-300 italic uppercase">ID Commande: #{order.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center justify-center h-8 w-8 bg-black text-white rounded-full text-[10px] font-black mb-1">
                               {order.items_count}
                            </span>
                            <p className="text-[10px] text-zinc-400 font-bold max-w-[150px] text-center italic">
                               {order.items_details || 'Détails indisponibles'}
                            </p>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-black text-orange-600">{order.total_price} $</p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-center ${
                              order.status === 'Livré' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {order.status || 'En attente'}
                            </span>
                            
                            {order.status !== 'Livré' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id)}
                                className="flex items-center justify-center gap-2 py-1 text-[9px] font-black uppercase text-blue-600 hover:underline"
                              >
                                <CheckCircle2 size={12}/> Confirmer Livraison
                              </button>
                            )}

                            <button 
                              onClick={() => deleteOrder(order.id)}
                              className="flex items-center justify-center gap-2 py-1 text-[9px] font-black uppercase text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={12}/> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <ShoppingBag size={48} className="text-zinc-100 mx-auto mb-4" />
                          <p className="text-zinc-300 font-bold uppercase text-xs tracking-widest">Aucune commande</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
               <div className="bg-white p-12 rounded-[3rem] border border-zinc-200 text-center space-y-6">
                  <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <FileText size={40} />
                  </div>
                  <h2 className="text-2xl font-black italic">Centre de Rapports Analytiques</h2>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto font-medium">
                    Générez un document PDF complet incluant l&apos;état de votre inventaire, votre chiffre d&apos;affaires et l&apos;historique complet des transactions livrées.
                  </p>
                  <button 
                    onClick={generateGlobalReport}
                    className="flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full mx-auto font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                  >
                    <Download size={16}/> Télécharger le Rapport Global (.pdf)
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Top Performance</p>
                    <p className="text-xs font-bold text-zinc-400 uppercase">Produit le plus en stock :</p>
                    <p className="text-xl font-black italic mt-1">
                        {products.length > 0 ? [...products].sort((a,b) => {
                           const stockA = typeof a.stock === 'string' ? parseInt(a.stock) : a.stock;
                           const stockB = typeof b.stock === 'string' ? parseInt(b.stock) : b.stock;
                           return stockB - stockA;
                        })[0].nom : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Volume d&apos;activité</p>
                    <p className="text-xs font-bold text-zinc-400 uppercase">Commandes traitées :</p>
                    <p className="text-xl font-black italic mt-1">{orders.length} transactions</p>
                  </div>
               </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}