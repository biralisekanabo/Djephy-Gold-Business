"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  ShoppingCart, Zap, X, ShoppingBag, 
  CheckCircle2, Plus, Minus, Trash2, MessageCircle, Box, Search, Star,
  CreditCard, Smartphone, Monitor, Battery,   
} from 'lucide-react';
import { useCart } from '@/src/store/cartContext';

// --- Types ---
interface Produit {
  id: number | string;
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

// Type pour les produits venant de l'API PHP
interface RawDbProduct {
  id: string | number;
  nom: string;
  prix: string;
  image: string;
  cat: "PC" | "Phone" | "Watch" | "Radio";
  stock: string;
  ecran?: string;
  batterie?: string;
  stockage?: string;
}

// --- Configuration ---
const WHATSAPP_NUMBER = "243991098942"; 
const FREE_SHIPPING_THRESHOLD = 100; 

const SHIPPING_COSTS: Record<string, number> = {
  "Butembo": 0,
  "Goma": 5,
  "Beni": 15,
  "Bunia": 20
};

const imagesSlider = [
  "/1665404376883_macbook_pro_jpg.jpg", 
  "/3234ccba938f41e8beebb8044a83d01b.jpg",
  "/dans-la-main-de-la-femme-il-y-a-un-étui-ouvert-avec-des-écouteurs-airpods-pro-2-génération.jpg",
  "/c372e543e32e10aef59d5c5e3f85c75b.jpg",
  "/IMG-20251218-WA0052.jpg",
  "/IMG-20251218-WA0057.jpg"
];

const PROD_DATA: Produit[] = [
  { id: 1, nom: "MacBook Pro M3", prix: 1500, img: "/ordinateur-portable-assis-bureau-bois_1072138-233006.jpg", cat: "PC", stock: 5, tag: "Premium", specs: { ecran: "14' Liquid Retina", batterie: "18h", stockage: "512GB SSD" } },
  { id: 2, nom: "iPhone 13", prix: 350, img: "/iphone_13_128gb_.jpg", cat: "Phone", stock: 3, tag: "Populaire", specs: { ecran: "6.1' OLED", batterie: "3240 mAh", stockage: "128GB" } },
  { id: 3, nom: "Samsung S24 Ultra", prix: 190, img: "/Screenshot_20251218_134502_Google.jpg", cat: "Phone", stock: 8, tag: "Nouveau", specs: { ecran: "6.8' AMOLED", batterie: "5000 mAh", stockage: "256GB" } },
  { id: 4, nom: "Smart Watch Elite", prix: 50, img: "/google-pixel-watch-4-fitbit-today-820x461.jpg", cat: "Watch", stock: 20, specs: { ecran: "1.4' AMOLED", batterie: "48h", stockage: "32GB" } },
  { id: 5, nom: "Smart Watch ", prix: 10, img: "/IMG-20251218-WA0039.jpg", cat: "Watch", stock: 20, specs: { ecran: "1.4' FULL HD", batterie: "72h", stockage: "4GB" } },
];

export default function DjephyGoldBusiness() {
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const { cart, addToCart, buyNow, updateQty, removeItem, clearCart, subtotal, totalItems } = useCart();
  const [compareList, setCompareList] = useState<Produit[]>([]);
  const [recentSale, setRecentSale] = useState<{name: string, city: string} | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({ nom: "", ville: Object.keys(SHIPPING_COSTS)[0], adresse: "" });
  const [isCartWiggling, setIsCartWiggling] = useState(false);
  const [showAddedTooltip, setShowAddedTooltip] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'card'>('whatsapp');
  const [dbProducts, setDbProducts] = useState<Produit[]>([]);

  // Coupon & saved-for-later
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{code: string, percent: number} | null>(() => {
    try { const c = localStorage.getItem('djephy_coupon'); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() => {
    try {
      const s = localStorage.getItem('djephy_saved');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem('djephy_saved', JSON.stringify(savedForLater)); } catch {}
  }, [savedForLater]);

  useEffect(() => {
    try {
      if (coupon) localStorage.setItem('djephy_coupon', JSON.stringify(coupon));
      else localStorage.removeItem('djephy_coupon');
    } catch {}
  }, [coupon]);

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'GOLD10') {
      setCoupon({ code: 'GOLD10', percent: 10 });
      setCouponCode('');
      alert('Coupon appliqué : 10% de réduction');
    } else {
      alert('Code invalide');
    }
  };

  const saveItemForLater = (id: number | string) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    setSavedForLater(prev => [...prev, item]);
    handleRemoveItem(id);
  };

  const moveToCartFromSaved = (id: number | string) => {
    const item = savedForLater.find(i => i.id === id);
    if (!item) return;
    addToCart(item, item.quantity || 1);
    setSavedForLater(prev => prev.filter(i => i.id !== id));
  }; 

  // Detecter le mode sombre système et s'adapter en-live
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsDarkMode((e as any).matches);
    setIsDarkMode(mq.matches);
    // addEventListener for modern browsers, fallback to addListener
    if ('addEventListener' in mq) mq.addEventListener('change', handler as any);
    else (mq as any).addListener(handler);
    return () => {
      if ('removeEventListener' in mq) mq.removeEventListener('change', handler as any);
      else (mq as any).removeListener(handler);
    };
  }, []);

  const fetchLiveProducts = async () => {
      try {
        const res = await fetch('https://blessing.alwaysdata.net/api/admin_manage.php?action=list');
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((p: RawDbProduct) => ({
            id: `db-${p.id}`,
            nom: p.nom,
            prix: parseFloat(p.prix),
            img: p.image, 
            cat: p.cat,
            stock: parseInt(p.stock),
            specs: {
              ecran: p.ecran || "",
              batterie: p.batterie || "",
              stockage: p.stockage || ""
            }
          }));
          setDbProducts(formatted);
        }
      } catch { 
        console.error("Erreur chargement produits BDD"); 
      }
    };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const ALL_PRODUCTS = useMemo(() => {
    return [...dbProducts, ...PROD_DATA];
  }, [dbProducts]);

  // Le stockage du panier est géré par `CartProvider` (localStorage centralisé).

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

  const handleAddToCart = (product: Produit) => {
    addToCart(product, 1);
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

  const handleBuyNow = (product: Produit) => {
    buyNow(product);
    setIsCartOpen(true);
  }

  const handleUpdateQty = (id: number | string, delta: number) => {
    updateQty(id, delta);
  };

  const handleRemoveItem = (id: number | string) => removeItem(id);
  
  const subtotalCartPrice = subtotal;
  // totalItems comes from the Cart context (exported as `totalItems`)

  const totalCartPrice = useMemo(() => {
    const shipping = subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? 0 : (SHIPPING_COSTS[deliveryInfo.ville] || 0);
    const discountAmount = coupon ? (subtotalCartPrice * (coupon.percent / 100)) : 0;
    return Math.max(0, subtotalCartPrice - discountAmount + shipping);
  }, [subtotalCartPrice, deliveryInfo.ville, coupon?.percent]);

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(p => { 
      const matchesFilter = filter === "Tous" || p.cat === filter;
      const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery, ALL_PRODUCTS]);

  const saveToDatabase = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const currentUserId = userData?.id_utilisateur || userData?.id || 1;

      const formattedItems = cart.map(item => ({
        nom_produit: item.nom,
        quantite: item.quantity,
        prix_unitaire: item.prix
      }));

      const response = await fetch('https://blessing.alwaysdata.net/api/passer_commande.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_utilisateur: currentUserId,
          nom_destinataire: deliveryInfo.nom, 
          ville_livraison: deliveryInfo.ville,
          total_paye: totalCartPrice, 
          articles: formattedItems 
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Erreur BDD : " + result.message);
        return false;
      }
      fetchLiveProducts();
      return true;
    } catch {
      alert("Erreur de connexion au serveur");
      return false;
    }
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryInfo.nom || !deliveryInfo.adresse) return alert("Veuillez remplir vos infos de livraison");
    
    const saved = await saveToDatabase();
    if (!saved) return; 

    setIsSuccess(true);
    const itemsList = cart.map(item => `• ${item.nom} (x${item.quantity}) : ${item.prix * item.quantity}$`).join('\n');
    const shippingPrice = subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COSTS[deliveryInfo.ville];
    const message = `*Nouvelle commande (Djephy Gold)*\n\n*Client :* ${deliveryInfo.nom}\n*Ville :* ${deliveryInfo.ville}\n*Adresse:* ${deliveryInfo.adresse}\n\n*Articles:*\n${itemsList}\n\n*Sous-total :* ${subtotalCartPrice}$\n*Livraison :* ${shippingPrice === 0 ? "Gratuite" : shippingPrice + "$"}\n*TOTAL : ${totalCartPrice}$*`;
    
    if (paymentMethod === 'whatsapp') {
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
        finalizeOrder();
      }, 1500);
    } else {
      alert("Redirection vers le portail de paiement sécurisé...");
      finalizeOrder();
    }
  };

  const finalizeOrder = () => {
    setIsSuccess(false);
    setIsCartOpen(false);
    clearCart();
  }

  return (
    <div className={`${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#fafafa] text-slate-900'} min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500 selection:text-white`}>
      
      {/* HERO SECTION */}
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
              Vive l&apos;expérience Djephy Gold : Des produits authentiques livrés où que vous soyez.
            </p>
          </motion.div>

          <div className="relative h-64 md:h-[400px] bg-white dark:bg-slate-800 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }} className="absolute inset-0 w-full h-full"
              >
                <Image 
                  src={imagesSlider[index]} 
                  alt="Slider High-Tech" 
                  fill 
                  className="object-cover" 
                  priority={index === 0}
                />
              </motion.div>
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
                <p className="opacity-80 text-sm font-medium">Profitez de la livraison gratuite dès 100$ d&apos;achat</p>
              </div>
              <div className="flex gap-4 relative z-10">
                {['05', '12', '44'].map((v, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="bg-white/20 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg">{v}</span>
                    <span className="text-[8px] font-bold uppercase mt-1">{i===0?'Jours':i===1?'Hrs':'Min'}</span>
                  </div>
                ))}
              </div>
              <Zap size={150} className="absolute -right-10 -top-10 opacity-10 rotate-12" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <h2 className="text-3xl font-black uppercase italic">La <span className="text-blue-500">Collection</span></h2>
            
            <div className="relative w-full md:w-64">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
               <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

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
                    className={`group relative ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} border rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 hover:shadow-2xl transition-all duration-300`}
                  >
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                       {prod.stock <= 0 ? (
                          <span className="bg-gray-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase">Rupture</span>
                       ) : prod.stock < 5 && (
                         <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase animate-pulse">Stock Limité ({prod.stock})</span>
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
                      <Image 
                        src={prod.img} 
                        alt={prod.nom} 
                        fill
                        className={`object-cover group-hover:scale-110 transition-transform duration-700 ${prod.stock <= 0 ? 'grayscale' : ''}`} 
                      />
                      {prod.tag && <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">{prod.tag}</div>}
                      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black shadow-sm text-blue-600">
                        {prod.prix}$
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-1 truncate uppercase tracking-tight">{prod.nom}</h3>
                    
                    <div className="flex gap-3 mb-3 overflow-hidden">
                       {prod.specs?.ecran && (
                         <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase"><Monitor size={10}/> {prod.specs.ecran}</div>
                       )}
                       {prod.specs?.batterie && (
                         <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase"><Battery size={10}/> {prod.specs.batterie}</div>
                       )}
                    </div>

                    <div className="flex items-center gap-2 mb-4 opacity-60">
                      <Star size={12} className="text-yellow-500 fill-yellow-500"/> <span className="text-[10px] font-bold uppercase tracking-widest">Premium Choice</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        aria-label={`Ajouter ${prod.nom} au panier`}
                        disabled={prod.stock <= 0}
                        onClick={() => handleAddToCart(prod)} 
                        className={`flex-1 ${prod.stock <= 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 sm:py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all`}
                      >
                        <Plus size={14} /> Panier
                      </button>
                      <button 
                        aria-label={`Acheter ${prod.nom} maintenant`}
                        disabled={prod.stock <= 0}
                        onClick={() => handleBuyNow(prod)} 
                        className={`p-3 rounded-xl border ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'} ${prod.stock <= 0 ? 'opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                      >
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
                      <div className="relative w-10 h-10 overflow-hidden rounded-lg">
                        <Image src={p.img} alt={p.nom} fill className="object-cover" />
                      </div>
                      <span className="font-bold text-[11px] uppercase truncate">{p.nom}</span>
                    </div>
                    <div className="space-y-1 text-[10px] font-bold uppercase opacity-60">
                       <p className="flex justify-between border-b pb-1 dark:border-slate-700"><span>Ecran:</span> {p.specs?.ecran || "N/A"}</p>
                       <p className="flex justify-between border-b pb-1 dark:border-slate-700"><span>Batterie:</span> {p.specs?.batterie || "N/A"}</p>
                       <p className="flex justify-between border-b pb-1 dark:border-slate-700"><span>Stockage:</span> {p.specs?.stockage || "N/A"}</p>
                    </div>
                  </div>
                ))}
                {compareList.length === 1 && <div className="border-2 border-dashed rounded-2xl flex items-center justify-center text-[10px] font-black opacity-30 uppercase text-center">Ajoutez un 2e produit</div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION VENTE RÉCENTE */}
      <AnimatePresence>
        {recentSale && (
          <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 20, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="fixed bottom-10 left-0 z-[100] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border dark:border-slate-700 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full text-white"><ShoppingBag size={16}/></div>
            <div>
              <p className="text-[10px] font-bold leading-tight">Vendu à l&apos;instant !</p>
              <p className="text-[9px] opacity-60 uppercase">{recentSale.name} expédié à {recentSale.city}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANIER MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25 }}
              role="dialog" aria-modal="true" aria-label="Panier" className={`relative w-full max-w-md sm:max-w-sm md:max-w-md max-h-[92vh] sm:rounded-t-3xl md:rounded-l-3xl ${isDarkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white'} shadow-2xl flex flex-col overflow-hidden`}
            >
              <div className="px-4 py-4 sm:px-6 sm:py-6 border-b dark:border-slate-800 flex justify-between items-center">
                <span className="text-base sm:text-lg font-black flex items-center gap-2 uppercase italic tracking-tighter">
                  <ShoppingBag size={18} className="text-blue-600" /> Mon Panier <span className="text-blue-600">({totalItems})</span>
                </span>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button aria-label="Vider le panier" onClick={() => { if (confirm('Vider le panier ?')) clearCart(); }} className="text-[10px] font-bold text-red-500 uppercase focus:outline-none focus:ring-2 focus:ring-red-400">Vider</button>
                  )}
                  <button aria-label="Fermer le panier" onClick={() => setIsCartOpen(false)} className="p-2 hover:rotate-90 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"><X /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Votre panier est vide</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className={`flex gap-3 p-3 sm:p-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl border dark:border-slate-800 items-start`}>
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 overflow-hidden rounded-lg">
                            <Image src={item.img} alt={item.nom} fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm uppercase mb-1">{item.nom}</h4>
                            <p className="text-blue-600 font-black text-sm mb-2">{item.prix}$</p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg overflow-hidden">
                                <button onClick={() => handleUpdateQty(item.id, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><Minus size={12}/></button>
                                <span className="px-2 text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => handleUpdateQty(item.id, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><Plus size={12}/></button>
                              </div>
                              <button onClick={() => saveItemForLater(item.id)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors mr-2 text-[11px] font-bold">Sauver</button>
                              <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {savedForLater.length > 0 && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Articles sauvegardés</p>
                        <div className="space-y-3">
                          {savedForLater.map(s => (
                            <div key={s.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 overflow-hidden rounded-lg"><Image src={s.img} alt="" fill className="object-cover"/></div>
                                <div className="text-sm font-bold uppercase">{s.nom}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => moveToCartFromSaved(s.id)} className="text-green-600 font-bold text-[13px]">Remettre</button>
                                <button onClick={() => setSavedForLater(prev => prev.filter(i => i.id !== s.id))} className="text-red-500 font-bold text-[13px]">Suppr.</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                      <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-blue-700 dark:text-blue-400">
                        <span>{subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? "Livraison offerte !" : `Encore ${FREE_SHIPPING_THRESHOLD - subtotalCartPrice}$ pour la livraison gratuite`}</span>
                        <span>{Math.min(100, (subtotalCartPrice / FREE_SHIPPING_THRESHOLD) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 h-1.5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (subtotalCartPrice / FREE_SHIPPING_THRESHOLD) * 100)}%` }} className="h-full bg-blue-600" />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Informations de livraison</p>
                      <input required placeholder="Nom complet" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={deliveryInfo.nom} onChange={(e) => setDeliveryInfo({...deliveryInfo, nom: e.target.value})} />
                      <select className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none" value={deliveryInfo.ville} onChange={(e) => setDeliveryInfo({...deliveryInfo, ville: e.target.value})}>
                        {Object.keys(SHIPPING_COSTS).map(v => <option key={v} value={v}>{v} {subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? "(Gratuit)" : `(+${SHIPPING_COSTS[v]}$)`}</option>)}
                      </select>
                      <textarea required placeholder="Adresse exacte" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none h-20 resize-none" value={deliveryInfo.adresse} onChange={(e) => setDeliveryInfo({...deliveryInfo, adresse: e.target.value})} />
                    </div>

                    <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Code promo</p>
                      <div className="flex gap-3">
                        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="CODE (ex: GOLD10)" className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none" />
                        <button onClick={applyCoupon} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold">Appliquer</button>
                      </div>
                      {coupon && <p className="text-[11px] font-bold text-green-600">{coupon.code} appliqué ({coupon.percent}% )</p>}

                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Moyen de paiement</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('whatsapp')}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'whatsapp' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}
                        >
                          <MessageCircle size={18} />
                          <span className="text-[9px] font-bold uppercase">WhatsApp</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}
                        >
                          <CreditCard size={18} />
                          <span className="text-[9px] font-bold uppercase">Carte/Mobile</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className={`p-6 border-t ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm font-bold"><span>Sous-total</span><span>{subtotalCartPrice.toLocaleString()}$</span></div>
                    {coupon && (
                      <div className="flex justify-between text-sm font-bold text-green-600"><span>Remise ({coupon.code})</span><span>-{(subtotalCartPrice * (coupon.percent/100)).toFixed(2)}$</span></div>
                    )}
                    <div className="flex justify-between text-sm font-bold"><span>Livraison</span><span>{subtotalCartPrice >= FREE_SHIPPING_THRESHOLD ? 'Gratuite' : (SHIPPING_COSTS[deliveryInfo.ville] || 0) + '$'}</span></div>
                  </div>

                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total à payer</p>
                      <p className="text-3xl font-black">{totalCartPrice.toLocaleString()}$</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleWhatsAppCheckout} 
                    disabled={isSuccess} 
                    className={`w-full ${paymentMethod === 'whatsapp' ? 'bg-[#25D366]' : 'bg-blue-600'} text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs`}
                  >
                    {isSuccess ? <CheckCircle2 size={20} className="animate-bounce" /> : (
                      paymentMethod === 'whatsapp' ? 
                      <><MessageCircle size={20} fill="white" /> Commander sur WhatsApp</> :
                      <><Smartphone size={20} /> Payer Maintenant</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOUTON FLOTTANT PANIER */}
      {!isCartOpen && cart.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center">
          <AnimatePresence>
            {showAddedTooltip && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: -4 }} exit={{ opacity: 0 }} className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full mb-2 shadow-xl uppercase tracking-widest">
                Ajouté !
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsCartOpen(true)} className={`p-3 sm:p-4 rounded-full bg-blue-600 text-white shadow-2xl relative transition-all active:scale-90 ${isCartWiggling ? 'animate-wiggle' : 'hover:scale-110'}`}>
            <ShoppingCart size={18} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold border-2 border-white">{totalItems}</span>
          </button>
        </div>
      )}
    </div>
  );
}