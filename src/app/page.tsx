"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/src/store/cartContext';
import { useAuth } from '@/src/store/authContext';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  ShoppingCart, Zap, X, ShoppingBag, 
  CheckCircle2, Plus, Minus, Trash2, MessageCircle, Box, Moon, Sun, Search, Star,
  CreditCard, Smartphone, Banknote, Globe
} from 'lucide-react';

// --- Types ---
interface Produit {
  id: number;
  nom: string;
  prix: number;
  img: string; 
  cat: "PC" | "Phone" | "Watch" | "Radio";
  stock: number;
  tag?: string;
  specs?: {
    ecran: string;
    batterie: string;
    stockage: string;
  };
}

interface CartItem extends Produit {
  quantity: number;
}

// --- Données ---
const PROD_DATA: Produit[] = [
  { id: 1, nom: "MacBook Pro M3", prix: 1500, img: "/ordinateur-portable-assis-bureau-bois_1072138-233006.jpg", cat: "PC", stock: 5, tag: "Premium", specs: { ecran: "14' Liquid Retina", batterie: "18h", stockage: "512GB SSD" } },
  { id: 2, nom: "iPhone 13", prix: 350, img: "/iphone_13_128gb_.jpg", cat: "Phone", stock: 3, tag: "Populaire", specs: { ecran: "6.1' OLED", batterie: "3240 mAh", stockage: "128GB" } },
  { id: 3, nom: "Samsung S24 Ultra", prix: 190, img: "/Screenshot_20251218_134502_Google.jpg", cat: "Phone", stock: 8, tag: "Nouveau", specs: { ecran: "6.8' AMOLED", batterie: "5000 mAh", stockage: "256GB" } },
  { id: 4, nom: "Smart Watch Elite", prix: 50, img: "/google-pixel-watch-4-fitbit-today-820x461.jpg", cat: "Watch", stock: 20, specs: { ecran: "1.4' AMOLED", batterie: "48h", stockage: "32GB" } },
  { id: 5, nom: "Smart Watch ", prix: 10, img: "/IMG-20251218-WA0039.jpg", cat: "Watch", stock: 20, specs: { ecran: "1.4' FULL HD", batterie: "72h", stockage: "4GB" } },
];

const imagesSlider = [
  "/1665404376883_macbook_pro_jpg.jpg", 
  "/3234ccba938f41e8beebb8044a83d01b.jpg",
  "/dans-la-main-de-la-femme-il-y-a-un-étui-ouvert-avec-des-écouteurs-airpods-pro-2-génération.jpg",
  "/c372e543e32e10aef59d5c5e3f85c75b.jpg",
  "/IMG-20251218-WA0052.jpg",
  "/IMG-20251218-WA0057.jpg"
];

const WHATSAPP_NUMBER = "243991098942"; 
const FREE_SHIPPING_THRESHOLD = 100; 

const SHIPPING_COSTS: Record<string, number> = {
  "Butembo": 0,
  "Goma": 5,
  "Beni": 15,
  "Bunia": 20
};

const LOGOS = {
  mpesa: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png",
  airtel: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Airtel_logo_2010.svg/512px-Airtel_logo_2010.svg.png",
  orange: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/512px-Orange_logo.svg.png",
  visa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/512px-Visa_Inc._logo.svg.png",
  mastercard: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
};

export default function DjephyGoldBusiness() {
  // --- États ---
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [compareList, setCompareList] = useState<Produit[]>([]);
  const [recentSale, setRecentSale] = useState<{name: string, city: string} | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({ nom: "", ville: Object.keys(SHIPPING_COSTS)[0], adresse: "" });
  const [isCartWiggling, setIsCartWiggling] = useState(false);
  const [showAddedTooltip, setShowAddedTooltip] = useState(false);
  const [user, setUser] = useState<{id: number, nom: string} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'mobile_money' | 'card' | 'cod'>('whatsapp');
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3); 
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({
        days: days < 10 ? `0${days}` : `${days}`,
        hours: hours < 10 ? `0${hours}` : `${hours}`,
        minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
        seconds: seconds < 10 ? `0${seconds}` : `${seconds}`
      });
      if (difference < 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('djephy_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('djephy_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const sales = [
      { name: "iPhone 13", city: "Goma" },
      { name: "MacBook Pro", city: "Butembo" },
      { name: "Smart Watch", city: "Bunia" }
    ];
    const interval = setInterval(() => {
      setRecentSale(sales[Math.floor(Math.random() * sales.length)]);
      setTimeout(() => setRecentSale(null), 5000);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev === imagesSlider.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (product: Produit) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartWiggling(true);
    setShowAddedTooltip(true);
    setTimeout(() => { setIsCartWiggling(false); setShowAddedTooltip(false); }, 1500);
  };

  const toggleCompare = (product: Produit) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 2) return [prev[1], product];
      return [...prev, product];
    });
  };

  const buyNow = (product: Produit) => {
    setCart([{ ...product, quantity: 1 }]);
    setIsCartOpen(true);
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeItem = (id: number) => setCart(prev => prev.filter(item => item.id !== id));
  
  const subtotalCartPrice = cart.reduce((acc, item) => acc + (item.prix * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const totalCartPrice = useMemo(() => {
    const shipping = subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? 0 : (SHIPPING_COSTS[deliveryInfo.ville] || 0);
    return subtotalCartPrice + shipping;
  }, [subtotalCartPrice, deliveryInfo.ville]);

  const filteredProducts = useMemo(() => {
    return PROD_DATA.filter(p => {
      const matchesFilter = filter === "Tous" || p.cat === filter;
      const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery]);

  const saveToDatabase = async (orderID: string) => {
    try {
      const response = await fetch('http://localhost/api/admin_manage.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place_order',
          user_id: user ? user.id : 1, 
          total_price: totalCartPrice,
          items_count: totalItems,
          client_info: `${deliveryInfo.nom} - ${deliveryInfo.ville} - ${deliveryInfo.adresse}`
        }),
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Erreur BDD:", error);
      return false;
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("Attention : Vous devez être connecté pour passer une commande.");
        return;
    }
    if (!deliveryInfo.nom || !deliveryInfo.adresse) return alert("Veuillez remplir vos infos de livraison");
    setIsSuccess(true);
    const orderID = `DG-${Math.floor(Math.random() * 9000) + 1000}`;
    await saveToDatabase(orderID);
    const itemsList = cart.map(item => `   📦 ${item.nom} (x${item.quantity}) : ${item.prix * item.quantity}$`).join('\n');
    const shippingPrice = subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COSTS[deliveryInfo.ville];
    const methodLabel = {
      whatsapp: '🟢 WhatsApp Direct',
      mobile_money: '📲 Mobile Money (M-Pesa/Airtel/Orange)',
      card: '💳 Carte Bancaire (Visa/Mastercard)',
      cod: '💵 Cash à la livraison'
    }[paymentMethod];

    const message = `*⚡ DJEPHY GOLD - COMMANDE ${orderID}*\n---------------------------------------\n👤 *CLIENT :* ${deliveryInfo.nom.toUpperCase()}\n📍 *VILLE :* ${deliveryInfo.ville}\n🏠 *ADRESSE :* ${deliveryInfo.adresse}\n💳 *PAIEMENT :* ${methodLabel}\n\n*🛒 ARTICLES :*\n${itemsList}\n\n---------------------------------------\n💰 *SOUS-TOTAL :* ${subtotalCartPrice}$\n🚚 *FRAIS LIVRAISON :* ${shippingPrice === 0 ? "GRATUIT" : shippingPrice + "$"}\n🔥 *TOTAL À PAYER : ${totalCartPrice}$*\n---------------------------------------\n_Veuillez confirmer ma commande, je suis prêt pour la réception._`;
    
    setTimeout(() => {
      if (paymentMethod === 'whatsapp' || paymentMethod === 'cod') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      } else if (paymentMethod === 'mobile_money') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, je souhaite payer par Mobile Money (M-Pesa/Airtel) :\n\n" + message)}`, '_blank');
      } else if (paymentMethod === 'card') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, je souhaite payer par Carte Visa/Mastercard :\n\n" + message)}`, '_blank');
      }
      finalizeOrder();
    }, 1500);
  };

  const finalizeOrder = () => {
    setIsSuccess(false);
    setIsCartOpen(false);
    setCart([]);
    localStorage.removeItem('djephy_cart');
  }

  return (
    <div className={`${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#fafafa] text-slate-900'} min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500 selection:text-white`}>
    
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-4 py-2 rounded-full mb-6">
              <Zap size={14} className="fill-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">Gold High-Tech</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-none mb-6 tracking-tighter uppercase">
              Le futur <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">à votre portée.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-sm mb-10 leading-relaxed font-medium">
              Vive l'expérience Djephy Gold : Des produits authentiques livrés où que vous soyez.
            </p>
          </motion.div>

          <div className="relative h-[400px] bg-white dark:bg-slate-800 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white dark:border-slate-800">
            <AnimatePresence mode="wait">
              <motion.img
                key={index} src={imagesSlider[index]}
                initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }} className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section id="catalog" className={`py-20 px-8 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-12 p-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
             <div className="relative z-10 text-center md:text-left">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Offres Gold de la semaine</h3>
                <p className="opacity-80 text-sm font-medium">Profitez de la livraison gratuite dès 100$ d'achat</p>
             </div>
             <div className="flex gap-4 relative z-10">
                {[
                  { label: 'Jours', val: timeLeft.days },
                  { label: 'Hrs', val: timeLeft.hours },
                  { label: 'Min', val: timeLeft.minutes },
                  { label: 'Sec', val: timeLeft.seconds }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="bg-white/20 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg">{item.val}</span>
                    <span className="text-[8px] font-bold uppercase mt-1">{item.label}</span>
                  </div>
                ))}
             </div>
             <Zap size={150} className="absolute -right-10 -top-10 opacity-10 rotate-12" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <h2 className="text-3xl font-black uppercase italic">La <span className="text-blue-500">Collection</span></h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 overflow-x-auto">
              {["Tous", "PC", "Phone", "Watch"].map((cat) => (
                <button 
                  key={cat} onClick={() => setFilter(cat)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${filter === cat ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <LayoutGroup>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode='popLayout'>
                {filteredProducts.map((prod) => (
                  <motion.div 
                    layout key={prod.id} 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                    className={`group relative ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} border rounded-[2rem] p-4 hover:shadow-2xl transition-all duration-300`}
                  >
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                       {prod.stock < 5 && (
                         <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase animate-pulse">Stock Limité</span>
                       )}
                    </div>
                    
                    <button 
                      onClick={() => toggleCompare(prod)}
                      className={`absolute top-6 right-6 z-10 p-2 rounded-xl border backdrop-blur-md transition-all ${compareList.find(p => p.id === prod.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700'}`}
                    >
                      <div className="flex flex-col items-center">
                        <Box size={14} />
                        <span className="text-[7px] font-black">Détail</span>
                      </div>
                    </button>

                    <div className="relative overflow-hidden rounded-2xl h-52 mb-4 bg-slate-200 dark:bg-slate-700">
                      <img 
                        src={prod.img} alt={prod.nom} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      {prod.tag && <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">{prod.tag}</div>}
                      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black shadow-sm text-blue-600">
                        {prod.prix}$
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-1 truncate uppercase tracking-tight">{prod.nom}</h3>
                    <div className="flex items-center gap-2 mb-4 opacity-60">
                      <Star size={12} className="text-yellow-500 fill-yellow-500"/> <span className="text-[10px] font-bold uppercase tracking-widest">Premium Choice</span>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => addToCart(prod)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                        <Plus size={14} /> Panier
                      </button>
                      <button onClick={() => buyNow(prod)} className={`p-3 rounded-xl border ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                         <Zap size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </div>
      </section>

      {/* COMPARATEUR FLOTTANT */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-[70] p-4 flex justify-center">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border shadow-2xl rounded-t-[2.5rem] w-full max-w-4xl p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-black uppercase italic tracking-widest">Comparateur Gold ({compareList.length}/2)</h4>
                <button onClick={() => setCompareList([])} className="text-[10px] font-bold text-red-500 uppercase">Fermer</button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {compareList.map(p => (
                  <div key={p.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={p.img} className="w-10 h-10 object-cover rounded-lg" />
                      <span className="font-bold text-[11px] uppercase truncate">{p.nom}</span>
                    </div>
                    <div className="space-y-1 text-[10px] font-bold uppercase opacity-60">
                       <p className="flex justify-between border-b pb-1 dark:border-slate-700"><span>Ecran:</span> {p.specs?.ecran || "N/A"}</p>
                       <p className="flex justify-between border-b pb-1 dark:border-slate-700"><span>Batterie:</span> {p.specs?.batterie || "N/A"}</p>
                       <p className="flex justify-between border-b pb-1 dark:border-slate-700"><span>Stockage:</span> {p.specs?.stockage || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANIER MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25 }}
              className={`relative w-full max-w-md h-screen ${isDarkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white'} shadow-2xl flex flex-col`}
            >
              <div className="px-6 py-6 border-b dark:border-slate-800 flex justify-between items-center">
                <span className="text-lg font-black flex items-center gap-2 uppercase italic tracking-tighter">
                  <ShoppingBag size={20} className="text-blue-600" /> Mon Panier <span className="text-blue-600">({totalItems})</span>
                </span>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:rotate-90 transition-transform"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Votre panier est vide</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className={`flex gap-4 p-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl border dark:border-slate-800`}>
                          <img src={item.img} className="w-16 h-16 object-cover rounded-xl" />
                          <div className="flex-1">
                            <h4 className="font-bold text-sm uppercase mb-1">{item.nom}</h4>
                            <p className="text-blue-600 font-black text-sm mb-2">{item.prix}$</p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg overflow-hidden">
                                <button onClick={() => updateQty(item.id, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><Minus size={12}/></button>
                                <span className="px-2 text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><Plus size={12}/></button>
                              </div>
                              <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Livraison</p>
                      <input required placeholder="Nom complet" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={deliveryInfo.nom} onChange={(e) => setDeliveryInfo({...deliveryInfo, nom: e.target.value})} />
                      <select className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none" value={deliveryInfo.ville} onChange={(e) => setDeliveryInfo({...deliveryInfo, ville: e.target.value})}>
                        {Object.keys(SHIPPING_COSTS).map(v => <option key={v} value={v}>{v} {subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? "(Gratuit)" : `(+${SHIPPING_COSTS[v]}$)`}</option>)}
                      </select>
                      <textarea required placeholder="Adresse exacte" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none h-20 resize-none" value={deliveryInfo.adresse} onChange={(e) => setDeliveryInfo({...deliveryInfo, adresse: e.target.value})} />
                    </div>

                    <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Paiement</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setPaymentMethod('whatsapp')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'whatsapp' ? 'bg-green-50 border-green-500 text-green-600' : 'border-slate-200 dark:border-slate-700'}`}>
                          <MessageCircle size={20} className="text-green-500" />
                          <span className="text-[9px] font-black uppercase">WhatsApp</span>
                        </button>
                        <button onClick={() => setPaymentMethod('mobile_money')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'mobile_money' ? 'bg-yellow-50 border-yellow-500 text-yellow-600' : 'border-slate-200 dark:border-slate-700'}`}>
                          <div className="flex gap-2 h-6 items-center justify-center">
                             <img src={LOGOS.mpesa} className="h-full w-auto object-contain" alt="M-Pesa"/>
                             <img src={LOGOS.airtel} className="h-full w-auto object-contain" alt="Airtel"/>
                          </div>
                          <span className="text-[9px] font-black uppercase">M-Money</span>
                        </button>
                        <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 dark:border-slate-700'}`}>
                          <div className="flex gap-1 h-4 items-center">
                             <img src={LOGOS.visa} className="h-full object-contain" alt="Visa"/>
                             <img src={LOGOS.mastercard} className="h-full object-contain" alt="Mastercard"/>
                          </div>
                          <span className="text-[9px] font-black uppercase">Carte</span>
                        </button>
                        <button onClick={() => setPaymentMethod('cod')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cod' ? 'bg-slate-50 border-slate-500 text-slate-600' : 'border-slate-200 dark:border-slate-700'}`}>
                          <Banknote size={20} className="text-slate-500" />
                          <span className="text-[9px] font-black uppercase">Cash</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className={`p-6 border-t ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total à payer</p>
                      <p className="text-3xl font-black">{totalCartPrice.toLocaleString()}$</p>
                    </div>
                  </div>
                  <button onClick={handleCheckout} disabled={isSuccess} className={`w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs ${paymentMethod === 'whatsapp' ? 'bg-[#25D366]' : paymentMethod === 'mobile_money' ? 'bg-yellow-600' : paymentMethod === 'card' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    {isSuccess ? <CheckCircle2 size={20} className="animate-bounce" /> : (user ? "Confirmer l'achat" : "Connectez-vous pour commander")}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOUTON FLOTTANT PANIER */}
      {!isCartOpen && cart.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
          <motion.button
            onClick={() => setIsCartOpen(true)}
            animate={isCartWiggling ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
            className="bg-blue-600 p-5 rounded-3xl text-white shadow-2xl relative group overflow-hidden"
          >
            <ShoppingCart size={28} className="relative z-10" />
            <span className="absolute top-2 right-2 bg-red-600 text-[10px] font-black rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-lg z-10">{totalItems}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}