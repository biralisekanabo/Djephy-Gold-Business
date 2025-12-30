"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ShoppingCart,
  Zap,
  X,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Box,
  Search,
  Star,
  CreditCard,
  Smartphone,
  Monitor,
  Battery,
} from "lucide-react";
import Image from "next/image";

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

interface DbProduct {
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

interface CartItem extends Produit {
  quantity: number;
}

interface Notification {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  read: boolean;
}

// --- Configuration ---
const WHATSAPP_NUMBER = "243991098942";
const FREE_SHIPPING_THRESHOLD = 100;

const SHIPPING_COSTS: Record<string, number> = {
  Butembo: 0,
  Goma: 5,
  Beni: 15,
  Bunia: 20,
};

// --- Données Statiques Originales ---
const imagesSlider = [
  "/1665404376883_macbook_pro_jpg.jpg",
  "/3234ccba938f41e8beebb8044a83d01b.jpg",
  "/dans-la-main-de-la-femme-il-y-a-un-étui-ouvert-avec-des-écouteurs-airpods-pro-2-génération.jpg",
  "/c372e543e32e10aef59d5c5e3f85c75b.jpg",
  "/IMG-20251218-WA0052.jpg",
  "/IMG-20251218-WA0057.jpg",
];

const PROD_DATA: Produit[] = [
  {
    id: 1,
    nom: "MacBook Pro M3",
    prix: 1500,
    img: "/ordinateur-portable-assis-bureau-bois_1072138-233006.jpg",
    cat: "PC",
    stock: 5,
    tag: "Premium",
    specs: {
      ecran: "14' Liquid Retina",
      batterie: "18h",
      stockage: "512GB SSD",
    },
  },
  {
    id: 2,
    nom: "iPhone 13",
    prix: 350,
    img: "/iphone_13_128gb_.jpg",
    cat: "Phone",
    stock: 3,
    tag: "Populaire",
    specs: { ecran: "6.1' OLED", batterie: "3240 mAh", stockage: "128GB" },
  },
  {
    id: 3,
    nom: "Samsung S24 Ultra",
    prix: 190,
    img: "/Screenshot_20251218_134502_Google.jpg",
    cat: "Phone",
    stock: 8,
    tag: "Nouveau",
    specs: { ecran: "6.8' AMOLED", batterie: "5000 mAh", stockage: "256GB" },
  },
  {
    id: 4,
    nom: "Smart Watch Elite",
    prix: 50,
    img: "/google-pixel-watch-4-fitbit-today-820x461.jpg",
    cat: "Watch",
    stock: 20,
    specs: { ecran: "1.4' AMOLED", batterie: "48h", stockage: "32GB" },
  },
  {
    id: 5,
    nom: "Smart Watch ",
    prix: 10,
    img: "/IMG-20251218-WA0039.jpg",
    cat: "Watch",
    stock: 20,
    specs: { ecran: "1.4' FULL HD", batterie: "72h", stockage: "4GB" },
  },
];

export default function DjephyGoldBusiness() {
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [compareList, setCompareList] = useState<Produit[]>([]);
  const [recentSale, setRecentSale] = useState<{
    name: string;
    city: string;
  } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    nom: "",
    ville: Object.keys(SHIPPING_COSTS)[0],
    adresse: "",
  });
  const [isCartWiggling, setIsCartWiggling] = useState(false);
  const [showAddedTooltip, setShowAddedTooltip] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "card">(
    "whatsapp",
  );

  // --- NOUVEAU ÉTAT POUR LE MINUTEUR ---
  const [timeLeft, setTimeLeft] = useState({
    days: "05",
    hours: "12",
    minutes: "44",
    seconds: "00"
  });

  // --- ÉTAT POUR LES PRODUITS DE LA BDD ---
  const [dbProducts, setDbProducts] = useState<Produit[]>([]);

  // --- FONCTION POUR AJOUTER DES NOTIFICATIONS ---
  const addNotification = useCallback((type: Notification['type'], message: string) => {
    console.log(`Notification: [${type}] ${message}`);
  }, []);

  // --- CHARGEMENT DES PRODUITS ---
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        const res = await fetch(
          "https://blessing.alwaysdata.net/api/admin_manage.php?action=list",
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted: Produit[] = data.map((p: DbProduct) => ({
            id: `db-${p.id}`,
            nom: p.nom,
            prix: parseFloat(p.prix),
            img: p.image,
            cat: p.cat,
            stock: parseInt(p.stock),
            specs: {
              ecran: p.ecran || "",
              batterie: p.batterie || "",
              stockage: p.stockage || "",
            },
          }));
          setDbProducts(formatted);
        }
      } catch (error) {
        console.error("Erreur chargement produits BDD", error);
        addNotification('error', "Erreur de chargement des produits");
      }
    };
    fetchLiveProducts();
  }, [addNotification]);

  // --- FUSION ---
  const ALL_PRODUCTS = useMemo(() => {
    return [...dbProducts, ...PROD_DATA];
  }, [dbProducts]);

  useEffect(() => {
    const savedCart = localStorage.getItem("djephy_cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("djephy_cart", JSON.stringify(cart));
  }, [cart]);

  // Logic pour les ventes récentes
  useEffect(() => {
    const sales = [
      { name: "iPhone 13", city: "Goma" },
      { name: "MacBook Pro", city: "Butembo" },
      { name: "Smart Watch", city: "Bunia" },
    ];
    const interval = setInterval(() => {
      const sale = sales[Math.floor(Math.random() * sales.length)];
      setRecentSale(sale);
      
      addNotification('info', `${sale.name} vendu à ${sale.city}`);
      
      setTimeout(() => setRecentSale(null), 5000);
    }, 20000);
    return () => clearInterval(interval);
  }, [addNotification]);

  // Logic pour le slider
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev === imagesSlider.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // --- MINUTEUR TEMPS RÉEL ---
  useEffect(() => {
    const countDownDate = new Date();
    countDownDate.setDate(countDownDate.getDate() + 3);
    countDownDate.setHours(12, 0, 0, 0);

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = countDownDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00"
        });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (product: Produit) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists)
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartWiggling(true);
    setShowAddedTooltip(true);
    
    addNotification('success', `${product.nom} ajouté au panier`);
    
    setTimeout(() => {
      setIsCartWiggling(false);
      setShowAddedTooltip(false);
    }, 1500);
  };

  const toggleCompare = (product: Produit) => {
    setCompareList((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        addNotification('info', `${product.nom} retiré du comparateur`);
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 2) {
        addNotification('info', `${prev[1].nom} remplacé par ${product.nom} dans le comparateur`);
        return [prev[1], product];
      }
      addNotification('info', `${product.nom} ajouté au comparateur`);
      return [...prev, product];
    });
  };

  const buyNow = (product: Produit) => {
    setCart([{ ...product, quantity: 1 }]);
    setIsCartOpen(true);
    addNotification('success', `Préparation de commande pour ${product.nom}`);
  };

  const updateQty = (id: number | string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const removeItem = (id: number | string) => {
    const item = cart.find(item => item.id === id);
    setCart((prev) => prev.filter((item) => item.id !== id));
    
    if (item) {
      addNotification('warning', `${item.nom} retiré du panier`);
    }
  };

  const subtotalCartPrice = cart.reduce(
    (acc, item) => acc + item.prix * item.quantity,
    0,
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const totalCartPrice = useMemo(() => {
    const shipping =
      subtotalCartPrice >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_COSTS[deliveryInfo.ville] || 0;
    return subtotalCartPrice + shipping;
  }, [subtotalCartPrice, deliveryInfo.ville]);

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((p) => {
      const matchesFilter = filter === "Tous" || p.cat === filter;
      const matchesSearch = p.nom
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery, ALL_PRODUCTS]);

  // --- SAUVEGARDE EN BDD (ADAPTÉ POUR id_utilisateur) ---
  const saveToDatabase = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;

      const formattedItems = cart.map((item) => ({
        produit_id:
          typeof item.id === "string" ? item.id.replace("db-", "") : item.id,
        nom_produit: item.nom,
        quantite: item.quantity,
        prix_unitaire: item.prix,
      }));

      const response = await fetch("https://blessing.alwaysdata.net/api/passer_commande.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_utilisateur: userData?.id_utilisateur,
          nom_destinataire: deliveryInfo.nom,
          ville_livraison: deliveryInfo.ville,
          total_paye: totalCartPrice,
          articles: formattedItems,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        addNotification('success', 'Commande enregistrée avec succès');
      } else {
        addNotification('error', 'Erreur lors de l\'enregistrement de la commande');
      }
      
      return result.success;
    } catch (error) {
      console.error("Erreur BDD:", error);
      addNotification('error', 'Erreur de connexion au serveur');
      return false;
    }
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryInfo.nom || !deliveryInfo.adresse) {
      addNotification('error', 'Veuillez remplir vos informations de livraison');
      return;
    }

    setIsSuccess(true);
    const saved = await saveToDatabase();

    if (!saved) {
      setIsSuccess(false);
      addNotification('error', 'Échec de l\'enregistrement de la commande');
      return;
    }

    const itemsList = cart
      .map(
        (item) =>
          `• ${item.nom} (x${item.quantity}) : ${item.prix * item.quantity}$`,
      )
      .join("\n");
    const shippingPrice =
      subtotalCartPrice >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_COSTS[deliveryInfo.ville];
    const message = `*Nouvelle commande (Djephy Gold)*\n\n*Client :* ${deliveryInfo.nom}\n*Ville :* ${deliveryInfo.ville}\n*Adresse:* ${deliveryInfo.adresse}\n\n*Articles:*\n${itemsList}\n\n*Sous-total :* ${subtotalCartPrice}$\n*Livraison :* ${shippingPrice === 0 ? "Gratuite" : shippingPrice + "$"}\n*TOTAL : ${totalCartPrice}$*`;

    if (paymentMethod === "whatsapp") {
      addNotification('success', 'Redirection vers WhatsApp...');
      setTimeout(() => {
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
          "_blank",
        );
        finalizeOrder();
      }, 1500);
    } else {
      addNotification('info', 'Redirection vers le portail de paiement sécurisé...');
      setTimeout(() => {
        addNotification('success', 'Paiement simulé avec succès');
        finalizeOrder();
      }, 2000);
    }
  };

  const finalizeOrder = () => {
    setIsSuccess(false);
    setIsCartOpen(false);
    setCart([]);
    localStorage.removeItem("djephy_cart");
  };

  // Animation pour les images de produits
  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        duration: 0.6
      }
    },
    hover: {
      scale: 1.05,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Animation pour le slider
  const sliderVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <div
      className={`${isDarkMode ? "bg-slate-900 text-white" : "bg-[#fafafa] text-slate-900"} min-h-screen font-sans transition-colors duration-500 selection:bg-blue-500 selection:text-white`}
    >
     
      {/* HERO SECTION AVEC SLIDER ANIMÉ */}
      <section className="relative px-8 pt-32 pb-20">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-600 dark:bg-blue-900/30">
              <Zap size={14} className="fill-blue-600" />
              <span className="text-[10px] font-black tracking-widest uppercase">
                Gold High-Tech
              </span>
            </div>
            <h1 className="mb-6 text-5xl leading-none font-black tracking-tighter uppercase lg:text-7xl">
              Le futur <br />{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                à votre portée.
              </span>
            </h1>
            <p className="mb-10 max-w-sm text-lg leading-relaxed font-medium text-slate-500 dark:text-slate-400">
              Vive l&apos;expérience Djephy Gold : Des produits authentiques
              livrés où que vous soyez.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-[400px] overflow-hidden rounded-[3rem] border-[8px] border-white bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-800"
          >
            <AnimatePresence mode="wait" custom={1}>
              <motion.div
                key={index}
                custom={1}
                variants={sliderVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.4 }
                }}
                className="absolute inset-0"
              >
                <Image
                  src={imagesSlider[index]}
                  alt={`Produit promotionnel ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="transition-transform duration-700 hover:scale-105"
                  priority={index === 0}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </motion.div>
            </AnimatePresence>
            
            {/* Indicateurs de slider */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {imagesSlider.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-white w-6' : 'bg-white/50'}`}
                  aria-label={`Voir l'image ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section
        id="catalog"
        className={`px-8 py-20 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}
      >
        <div className="mx-auto max-w-7xl">
          {/* BANNIERE PROMO AVEC MINUTEUR ACTIF */}
          <div className="relative mb-12 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white md:flex-row">
            <div className="relative z-10 text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tighter uppercase italic">
                Offres Gold de la semaine
              </h3>
              <p className="text-sm font-medium opacity-80">
                Profitez de la livraison gratuite dès 100$ d&apos;achat
              </p>
            </div>
            <div className="relative z-10 flex gap-4">
              {[
                { value: timeLeft.days, label: "Jours" },
                { value: timeLeft.hours, label: "Hrs" },
                { value: timeLeft.minutes, label: "Min" },
                { value: timeLeft.seconds, label: "Sec" },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  className="flex flex-col items-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-lg font-black backdrop-blur-md">
                    {item.value}
                  </div>
                  <span className="mt-1 text-[8px] font-bold uppercase">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
            <Zap
              size={150}
              className="absolute -top-10 -right-10 rotate-12 opacity-10"
            />
          </div>

          <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
            <h2 className="text-3xl font-black uppercase italic">
              La <span className="text-blue-500">Collection</span>
            </h2>

            {/* SEARCH BAR */}
            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full rounded-xl bg-slate-100 py-2 pr-4 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {["Tous", "PC", "Phone", "Watch"].map((cat) => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(cat)}
                  className={`rounded-lg px-6 py-2 text-xs font-bold whitespace-nowrap uppercase transition-all ${filter === cat ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          <LayoutGroup>
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((prod) => (
                  <motion.div
                    layout
                    key={prod.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -8 }}
                    className={`group relative ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-gray-100 bg-white"} rounded-[2rem] border p-4 transition-all duration-300 hover:shadow-2xl`}
                  >
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                      {prod.stock < 5 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="animate-pulse rounded-md bg-red-500 px-2 py-1 text-[8px] font-black text-white uppercase"
                        >
                          Stock Limité
                        </motion.span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCompare(prod)}
                      className={`absolute top-6 right-6 z-10 rounded-xl border p-2 backdrop-blur-md transition-all ${compareList.find((p) => p.id === prod.id) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80"}`}
                    >
                      <div className="flex flex-col items-center">
                        <Box size={14} />
                        <span className="text-[7px] font-black">Détail</span>
                      </div>
                    </motion.button>

                    <motion.div 
                      className="relative mb-4 h-52 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700"
                      variants={imageVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={prod.img}
                          alt={`${prod.nom} - ${prod.cat}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="transition-transform duration-700"
                        />
                      </div>
                      {prod.tag && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="absolute bottom-3 left-3 rounded-md bg-blue-600 px-2 py-1 text-[9px] font-black tracking-widest text-white uppercase"
                        >
                          {prod.tag}
                        </motion.div>
                      )}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-blue-600 shadow-sm backdrop-blur-sm dark:bg-slate-900/90"
                      >
                        {prod.prix}$
                      </motion.div>
                    </motion.div>

                    <h3 className="mb-1 truncate text-lg font-bold tracking-tight uppercase">
                      {prod.nom}
                    </h3>

                    <div className="mb-3 flex gap-3 overflow-hidden">
                      {prod.specs?.ecran && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase"
                        >
                          <Monitor size={10} /> {prod.specs.ecran}
                        </motion.div>
                      )}
                      {prod.specs?.batterie && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase"
                        >
                          <Battery size={10} /> {prod.specs.batterie}
                        </motion.div>
                      )}
                    </div>

                    <div className="mb-4 flex items-center gap-2 opacity-60">
                      <Star
                        size={12}
                        className="fill-yellow-500 text-yellow-500"
                      />{" "}
                      <span className="text-[10px] font-bold tracking-widest uppercase">
                        Premium Choice
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(prod)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition-all hover:bg-blue-700"
                      >
                        <Plus size={14} /> Panier
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => buyNow(prod)}
                        className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        <Zap size={14} />
                      </motion.button>
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
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed right-0 bottom-0 left-0 z-[70] flex justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"} w-full max-w-4xl rounded-t-[2.5rem] border p-6 shadow-2xl`}
            >
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-xs font-black tracking-widest uppercase italic">
                  Comparateur Gold ({compareList.length}/2)
                </h4>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCompareList([])}
                  className="text-[10px] font-bold text-red-500 uppercase"
                >
                  Fermer
                </motion.button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {compareList.map((p) => (
                  <motion.div 
                    key={p.id} 
                    className="space-y-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="relative h-10 w-10 rounded-lg overflow-hidden"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Image
                          src={p.img}
                          alt={`Miniature ${p.nom}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="40px"
                        />
                      </motion.div>
                      <span className="truncate text-[11px] font-bold uppercase">
                        {p.nom}
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] font-bold uppercase opacity-60">
                      <p className="flex justify-between border-b pb-1 dark:border-slate-700">
                        <span>Ecran:</span> {p.specs?.ecran || "N/A"}
                      </p>
                      <p className="flex justify-between border-b pb-1 dark:border-slate-700">
                        <span>Batterie:</span> {p.specs?.batterie || "N/A"}
                      </p>
                      <p className="flex justify-between border-b pb-1 dark:border-slate-700">
                        <span>Stockage:</span> {p.specs?.stockage || "N/A"}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {compareList.length === 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center rounded-2xl border-2 border-dashed text-center text-[10px] font-black uppercase opacity-30"
                  >
                    Ajoutez un 2e produit
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION VENTE RÉCENTE */}
      <AnimatePresence>
        {recentSale && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 20, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="fixed bottom-10 left-0 z-[100] flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
          >
            <motion.div 
              className="rounded-full bg-blue-600 p-2 text-white"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <ShoppingBag size={16} />
            </motion.div>
            <div>
              <p className="text-[10px] leading-tight font-bold">
                Vendu à l&apos;instant !
              </p>
              <p className="text-[9px] uppercase opacity-60">
                {recentSale.name} expédié à {recentSale.city}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANIER MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className={`relative h-screen w-full max-w-md ${isDarkMode ? "border-l border-slate-800 bg-slate-900" : "bg-white"} flex flex-col shadow-2xl`}
            >
              <div className="flex items-center justify-between border-b px-6 py-6 dark:border-slate-800">
                <span className="flex items-center gap-2 text-lg font-black tracking-tighter uppercase italic">
                  <ShoppingBag size={20} className="text-blue-600" /> Mon Panier{" "}
                  <span className="text-blue-600">({totalItems})</span>
                </span>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 transition-transform"
                >
                  <X />
                </motion.button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-full flex-col items-center justify-center text-slate-400"
                  >
                    <ShoppingBag
                      size={48}
                      strokeWidth={1}
                      className="mb-4 opacity-20"
                    />
                    <p className="text-xs font-black tracking-widest uppercase">
                      Votre panier est vide
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex gap-4 p-4 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"} rounded-2xl border dark:border-slate-800`}
                        >
                          <motion.div 
                            className="relative h-16 w-16 rounded-xl overflow-hidden"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Image
                              src={item.img}
                              alt={`Miniature ${item.nom}`}
                              fill
                              style={{ objectFit: 'cover' }}
                              sizes="64px"
                            />
                          </motion.div>
                          <div className="flex-1">
                            <h4 className="mb-1 text-sm font-bold uppercase">
                              {item.nom}
                            </h4>
                            <p className="mb-2 text-sm font-black text-blue-600">
                              {item.prix}$
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center overflow-hidden rounded-lg border bg-white dark:border-slate-700 dark:bg-slate-900">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateQty(item.id, -1)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Minus size={12} />
                                </motion.button>
                                <span className="px-2 text-xs font-bold">
                                  {item.quantity}
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateQty(item.id, 1)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Plus size={12} />
                                </motion.button>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItem(item.id)}
                                className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* BARRE DE PROGRESSION LIVRAISON */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
                    >
                      <div className="mb-2 flex justify-between text-[10px] font-black text-blue-700 uppercase dark:text-blue-400">
                        <span>
                          {subtotalCartPrice >= FREE_SHIPPING_THRESHOLD
                            ? "Livraison offerte !"
                            : `Encore ${FREE_SHIPPING_THRESHOLD - subtotalCartPrice}$ pour la livraison gratuite`}
                        </span>
                        <span>
                          {Math.min(
                            100,
                            (subtotalCartPrice / FREE_SHIPPING_THRESHOLD) * 100,
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (subtotalCartPrice / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                          }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                    </motion.div>

                    {/* INFOS CLIENT */}
                    <div className="space-y-3 border-t pt-4 dark:border-slate-800">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Informations de livraison
                      </p>
                      <input
                        required
                        placeholder="Nom complet"
                        className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                        value={deliveryInfo.nom}
                        onChange={(e) =>
                          setDeliveryInfo({
                            ...deliveryInfo,
                            nom: e.target.value,
                          })
                        }
                      />
                      <select
                        className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm outline-none dark:bg-slate-800"
                        value={deliveryInfo.ville}
                        onChange={(e) =>
                          setDeliveryInfo({
                            ...deliveryInfo,
                            ville: e.target.value,
                          })
                        }
                      >
                        {Object.keys(SHIPPING_COSTS).map((v) => (
                          <option key={v} value={v}>
                            {v}{" "}
                            {subtotalCartPrice >= FREE_SHIPPING_THRESHOLD
                              ? "(Gratuit)"
                              : `(+${SHIPPING_COSTS[v]}$)`}
                          </option>
                        ))}
                      </select>
                      <textarea
                        required
                        placeholder="Adresse exacte"
                        className="h-20 w-full resize-none rounded-xl bg-slate-100 px-4 py-3 text-sm outline-none dark:bg-slate-800"
                        value={deliveryInfo.adresse}
                        onChange={(e) =>
                          setDeliveryInfo({
                            ...deliveryInfo,
                            adresse: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* MOYEN DE PAIEMENT */}
                    <div className="space-y-3 border-t pt-4 dark:border-slate-800">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Moyen de paiement
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPaymentMethod("whatsapp")}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${paymentMethod === "whatsapp" ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20" : "border-slate-200 bg-transparent dark:border-slate-700"}`}
                        >
                          <MessageCircle size={18} />
                          <span className="text-[9px] font-bold uppercase">
                            WhatsApp
                          </span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPaymentMethod("card")}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "border-slate-200 bg-transparent dark:border-slate-700"}`}
                        >
                          <CreditCard size={18} />
                          <span className="text-[9px] font-bold uppercase">
                            Carte/Mobile
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-t p-6 ${isDarkMode ? "border-slate-800 bg-slate-900" : "bg-white"}`}
                >
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Total à payer
                      </p>
                      <p className="text-3xl font-black">
                        {totalCartPrice.toLocaleString()}$
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWhatsAppCheckout}
                    disabled={isSuccess}
                    className={`w-full ${paymentMethod === "whatsapp" ? "bg-[#25D366]" : "bg-blue-600"} flex items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 size={20} className="animate-bounce" />
                    ) : paymentMethod === "whatsapp" ? (
                      <>
                        <MessageCircle size={20} fill="white" /> Commander sur
                        WhatsApp
                      </>
                    ) : (
                      <>
                        <Smartphone size={20} /> Payer Maintenant
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOUTON FLOTTANT PANIER */}
      {!isCartOpen && cart.length > 0 && (
        <div className="fixed right-8 bottom-8 z-50 flex flex-col items-center">
          <AnimatePresence>
            {showAddedTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -5, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mb-2 rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl"
              >
                Ajouté !
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            className={`relative rounded-full bg-blue-600 p-5 text-white shadow-2xl ${isCartWiggling ? "animate-wiggle" : ""}`}
          >
            <ShoppingCart size={24} />
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold"
            >
              {totalItems}
            </motion.span>
          </motion.button>
        </div>
      )}
    </div>
  );
}