"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
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
import { useCart } from "@/src/store/cartContext";

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
  Butembo: 0,
  Goma: 5,
  Beni: 15,
  Bunia: 20,
};

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
  const {
    cart,
    addToCart,
    buyNow,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
  } = useCart();
  const [compareList, setCompareList] = useState<Produit[]>([]);
  const [recentSale, setRecentSale] = useState<{
    name: string;
    city: string;
  } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
  const [dbProducts, setDbProducts] = useState<Produit[]>([]);

  // Coupon & saved-for-later
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    percent: number;
  } | null>(() => {
    try {
      const c = localStorage.getItem("djephy_coupon");
      return c ? JSON.parse(c) : null;
    } catch {
      return null;
    }
  });
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() => {
    try {
      const s = localStorage.getItem("djephy_saved");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("djephy_saved", JSON.stringify(savedForLater));
    } catch {}
  }, [savedForLater]);

  useEffect(() => {
    try {
      if (coupon) localStorage.setItem("djephy_coupon", JSON.stringify(coupon));
      else localStorage.removeItem("djephy_coupon");
    } catch {}
  }, [coupon]);

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "GOLD10") {
      setCoupon({ code: "GOLD10", percent: 10 });
      setCouponCode("");
      alert("Coupon appliqué : 10% de réduction");
    } else {
      alert("Code invalide");
    }
  };

  const saveItemForLater = (id: number | string) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    setSavedForLater((prev) => [...prev, item]);
    handleRemoveItem(id);
  };

  const moveToCartFromSaved = (id: number | string) => {
    const item = savedForLater.find((i) => i.id === id);
    if (!item) return;
    addToCart(item, item.quantity || 1);
    setSavedForLater((prev) => prev.filter((i) => i.id !== id));
  };

  // Detecter le mode sombre système et s'adapter en-live
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    // Handler for modern browsers (receives MediaQueryListEvent)
    const handleEvent = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    // Legacy handler for older browsers that call the listener without an event
    const legacyHandler = () => setIsDarkMode(mq.matches);

    setIsDarkMode(mq.matches);

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleEvent);
      return () => mq.removeEventListener("change", handleEvent);
    }

    // Fallback for older browsers using addListener/removeListener (no explicit `any` usage)
    if ("addListener" in mq) {
      (
        mq as unknown as { addListener: (listener: () => void) => void }
      ).addListener(legacyHandler);
      return () =>
        (
          mq as unknown as { removeListener: (listener: () => void) => void }
        ).removeListener(legacyHandler);
    }
  }, []);

  const fetchLiveProducts = async () => {
    try {
      const res = await fetch(
        "https://blessing.alwaysdata.net/api/admin_manage.php?action=list",
      );
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
            stockage: p.stockage || "",
          },
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
      { name: "Smart Watch", city: "Bunia" },
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
    setTimeout(() => {
      setIsCartWiggling(false);
      setShowAddedTooltip(false);
    }, 1500);
  };

  const toggleCompare = (product: Produit) => {
    setCompareList((prev) => {
      if (prev.find((p) => p.id === product.id))
        return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 2) return [prev[1], product];
      return [...prev, product];
    });
  };

  const handleBuyNow = (product: Produit) => {
    buyNow(product);
    setIsCartOpen(true);
  };

  const handleUpdateQty = (id: number | string, delta: number) => {
    updateQty(id, delta);
  };

  const handleRemoveItem = (id: number | string) => removeItem(id);

  const subtotalCartPrice = subtotal;
  // totalItems comes from the Cart context (exported as `totalItems`)

  const totalCartPrice = useMemo(() => {
    const shipping =
      subtotalCartPrice >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_COSTS[deliveryInfo.ville] || 0;
    const discountAmount = coupon
      ? subtotalCartPrice * (coupon.percent / 100)
      : 0;
    return Math.max(0, subtotalCartPrice - discountAmount + shipping);
  }, [subtotalCartPrice, deliveryInfo.ville, coupon]);

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((p) => {
      const matchesFilter = filter === "Tous" || p.cat === filter;
      const matchesSearch = p.nom
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchQuery, ALL_PRODUCTS]);

  const saveToDatabase = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const currentUserId = userData?.id_utilisateur || userData?.id || 1;

      const formattedItems = cart.map((item) => ({
        nom_produit: item.nom,
        quantite: item.quantity,
        prix_unitaire: item.prix,
      }));

      const response = await fetch(
        "https://blessing.alwaysdata.net/api/passer_commande.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_utilisateur: currentUserId,
            nom_destinataire: deliveryInfo.nom,
            ville_livraison: deliveryInfo.ville,
            total_paye: totalCartPrice,
            articles: formattedItems,
          }),
        },
      );

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
    if (!deliveryInfo.nom || !deliveryInfo.adresse)
      return alert("Veuillez remplir vos infos de livraison");

    const saved = await saveToDatabase();
    if (!saved) return;

    setIsSuccess(true);
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
      setTimeout(() => {
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
          "_blank",
        );
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
  };

  return (
    <div
      className={`${isDarkMode ? "bg-blue-900 text-white" : "bg-white text-blue-900"} min-h-screen font-sans transition-colors duration-500 selection:bg-blue-500 selection:text-white`}
    >
      {/* HERO SECTION */}
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
            <p className="mb-10 max-w-sm text-lg leading-relaxed font-medium text-blue-400 dark:text-blue-400">
              Vive l&apos;expérience Djephy Gold : Des produits authentiques
              livrés où que vous soyez.
            </p>
          </motion.div>

          <div className="relative h-64 overflow-hidden rounded-[3rem] border-8 border-white bg-white shadow-2xl md:h-[400px] dark:border-blue-800 dark:bg-blue-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 h-full w-full"
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
      <section
        id="catalog"
        className={`px-8 py-20 ${isDarkMode ? "bg-blue-900" : "bg-white"}`}
      >
        <div className="mx-auto max-w-7xl">
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
              {["05", "12", "44"].map((v, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-lg font-black backdrop-blur-md">
                    {v}
                  </span>
                  <span className="mt-1 text-[8px] font-bold uppercase">
                    {i === 0 ? "Jours" : i === 1 ? "Hrs" : "Min"}
                  </span>
                </div>
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

            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="absolute top-1/2 left-4 -translate-y-1/2 text-blue-400"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full rounded-xl bg-blue-50 py-2 pr-4 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl bg-blue-50 p-1 dark:bg-blue-800">
              {["Tous", "PC", "Phone", "Watch"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`rounded-lg px-6 py-2 text-xs font-bold whitespace-nowrap uppercase transition-all ${filter === cat ? "bg-white text-blue-600 shadow-sm dark:bg-blue-700" : "text-blue-400 hover:text-blue-900 dark:hover:text-white"}`}
                >
                  {cat}
                </button>
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group relative ${isDarkMode ? "border-blue-700 bg-blue-800" : "border-blue-100 bg-white"} rounded-[1.5rem] border p-3 transition-all duration-300 hover:shadow-2xl sm:rounded-[2rem] sm:p-4`}
                  >
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                      {prod.stock <= 0 ? (
                        <span className="rounded-md bg-gray-500 px-2 py-1 text-[8px] font-black text-white uppercase">
                          Rupture
                        </span>
                      ) : (
                        prod.stock < 5 && (
                          <span className="animate-pulse rounded-md bg-red-500 px-2 py-1 text-[8px] font-black text-white uppercase">
                            Stock Limité ({prod.stock})
                          </span>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => toggleCompare(prod)}
                      className={`absolute top-6 right-6 z-10 rounded-xl border p-2 backdrop-blur-md transition-all ${compareList.find((p) => p.id === prod.id) ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-white/80 dark:border-blue-700 dark:bg-blue-900/80"}`}
                    >
                      <div className="flex flex-col items-center">
                        <Box size={14} />
                        <span className="text-[7px] font-black">Détail</span>
                      </div>
                    </button>

                    <div className="relative mb-4 h-52 overflow-hidden rounded-2xl bg-blue-50 dark:bg-blue-700">
                      <Image
                        src={prod.img}
                        alt={prod.nom}
                        fill
                        className={`object-cover transition-transform duration-700 group-hover:scale-110 ${prod.stock <= 0 ? "grayscale" : ""}`}
                      />
                      {prod.tag && (
                        <div className="absolute bottom-3 left-3 rounded-md bg-blue-600 px-2 py-1 text-[9px] font-black tracking-widest text-white uppercase">
                          {prod.tag}
                        </div>
                      )}
                      <div className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-blue-600 shadow-sm backdrop-blur-sm dark:bg-blue-900/90">
                        {prod.prix}$
                      </div>
                    </div>

                    <h3 className="mb-1 truncate text-lg font-bold tracking-tight uppercase">
                      {prod.nom}
                    </h3>

                    <div className="mb-3 flex gap-3 overflow-hidden">
                      {prod.specs?.ecran && (
                        <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400 uppercase">
                          <Monitor size={10} /> {prod.specs.ecran}
                        </div>
                      )}
                      {prod.specs?.batterie && (
                        <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400 uppercase">
                          <Battery size={10} /> {prod.specs.batterie}
                        </div>
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
                      <button
                        aria-label={`Ajouter ${prod.nom} au panier`}
                        disabled={prod.stock <= 0}
                        onClick={() => handleAddToCart(prod)}
                        className={`flex-1 ${prod.stock <= 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none active:scale-95 sm:py-3`}
                      >
                        <Plus size={14} /> Panier
                      </button>
                      <button
                        aria-label={`Acheter ${prod.nom} maintenant`}
                        disabled={prod.stock <= 0}
                        onClick={() => handleBuyNow(prod)}
                        className={`rounded-xl border p-3 ${isDarkMode ? "border-blue-700 hover:bg-blue-700" : "border-blue-100 hover:bg-blue-50"} ${prod.stock <= 0 ? "opacity-50" : ""} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
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
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed right-0 bottom-0 left-0 z-[70] flex justify-center p-4"
          >
            <div
              className={`${isDarkMode ? "border-blue-700 bg-blue-800" : "border-blue-100 bg-white"} w-full max-w-4xl rounded-t-[2.5rem] border p-6 shadow-2xl`}
            >
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-xs font-black tracking-widest uppercase italic">
                  Comparateur Gold ({compareList.length}/2)
                </h4>
                <button
                  onClick={() => setCompareList([])}
                  className="text-[10px] font-bold text-red-500 uppercase"
                >
                  Fermer
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {compareList.map((p) => (
                  <div key={p.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                        <Image
                          src={p.img}
                          alt={p.nom}
                          fill
                          className="object-cover"
                        />
                      </div>
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
                  </div>
                ))}
                {compareList.length === 1 && (
                  <div className="flex items-center justify-center rounded-2xl border-2 border-dashed text-center text-[10px] font-black uppercase opacity-30">
                    Ajoutez un 2e produit
                  </div>
                )}
              </div>
            </div>
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
            className="fixed bottom-10 left-0 z-[100] flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-2xl dark:border-blue-700 dark:bg-blue-800"
          >
            <div className="rounded-full bg-blue-600 p-2 text-white">
              <ShoppingBag size={16} />
            </div>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              role="dialog"
              aria-modal="true"
              aria-label="Panier"
              className={`relative max-h-[92vh] w-full max-w-md sm:max-w-sm sm:rounded-t-3xl md:max-w-md md:rounded-l-3xl ${isDarkMode ? "border-l border-blue-800 bg-blue-900" : "bg-white"} flex flex-col overflow-hidden shadow-2xl`}
            >
              <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6 sm:py-6 dark:border-slate-800">
                <span className="flex items-center gap-2 text-base font-black tracking-tighter uppercase italic sm:text-lg">
                  <ShoppingBag size={18} className="text-blue-600" /> Mon Panier{" "}
                  <span className="text-blue-600">({totalItems})</span>
                </span>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      aria-label="Vider le panier"
                      onClick={() => {
                        if (confirm("Vider le panier ?")) clearCart();
                      }}
                      className="text-[10px] font-bold text-red-500 uppercase focus:ring-2 focus:ring-red-400 focus:outline-none"
                    >
                      Vider
                    </button>
                  )}
                  <button
                    aria-label="Fermer le panier"
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 transition-transform hover:rotate-90 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    <X />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-blue-400">
                    <ShoppingBag
                      size={48}
                      strokeWidth={1}
                      className="mb-4 opacity-20"
                    />
                    <p className="text-xs font-black tracking-widest uppercase">
                      Votre panier est vide
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className={`flex gap-3 p-3 sm:p-4 ${isDarkMode ? "bg-blue-800/50" : "bg-blue-50"} items-start rounded-2xl border dark:border-blue-800`}
                        >
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg sm:h-16 sm:w-16">
                            <Image
                              src={item.img}
                              alt={item.nom}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-1 text-sm font-bold uppercase">
                              {item.nom}
                            </h4>
                            <p className="mb-2 text-sm font-black text-blue-600">
                              {item.prix}$
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center overflow-hidden rounded-lg border bg-white dark:border-blue-700 dark:bg-blue-900">
                                <button
                                  onClick={() => handleUpdateQty(item.id, -1)}
                                  className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-800"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-2 text-xs font-bold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQty(item.id, 1)}
                                  className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-800"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <button
                                onClick={() => saveItemForLater(item.id)}
                                className="mr-2 rounded-lg p-1.5 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                              >
                                Sauver
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {savedForLater.length > 0 && (
                      <div className="rounded-2xl border bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                        <p className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Articles sauvegardés
                        </p>
                        <div className="space-y-3">
                          {savedForLater.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                                  <Image
                                    src={s.img}
                                    alt=""
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="text-sm font-bold uppercase">
                                  {s.nom}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => moveToCartFromSaved(s.id)}
                                  className="text-[13px] font-bold text-green-600"
                                >
                                  Remettre
                                </button>
                                <button
                                  onClick={() =>
                                    setSavedForLater((prev) =>
                                      prev.filter((i) => i.id !== s.id),
                                    )
                                  }
                                  className="text-[13px] font-bold text-red-500"
                                >
                                  Suppr.
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
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
                    </div>

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

                    <div className="space-y-3 border-t pt-4 dark:border-slate-800">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Code promo
                      </p>
                      <div className="flex gap-3">
                        <input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="CODE (ex: GOLD10)"
                          className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm outline-none dark:bg-slate-800"
                        />
                        <button
                          onClick={applyCoupon}
                          className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                        >
                          Appliquer
                        </button>
                      </div>
                      {coupon && (
                        <p className="text-[11px] font-bold text-green-600">
                          {coupon.code} appliqué ({coupon.percent}% )
                        </p>
                      )}

                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Moyen de paiement
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentMethod("whatsapp")}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${paymentMethod === "whatsapp" ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20" : "border-slate-200 bg-transparent dark:border-slate-700"}`}
                        >
                          <MessageCircle size={18} />
                          <span className="text-[9px] font-bold uppercase">
                            WhatsApp
                          </span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod("card")}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "border-slate-200 bg-transparent dark:border-slate-700"}`}
                        >
                          <CreditCard size={18} />
                          <span className="text-[9px] font-bold uppercase">
                            Carte/Mobile
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div
                  className={`border-t p-6 ${isDarkMode ? "border-slate-800 bg-slate-900" : "bg-white"}`}
                >
                  <div className="mb-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Sous-total</span>
                      <span>{subtotalCartPrice.toLocaleString()}$</span>
                    </div>
                    {coupon && (
                      <div className="flex justify-between text-sm font-bold text-green-600">
                        <span>Remise ({coupon.code})</span>
                        <span>
                          -
                          {(subtotalCartPrice * (coupon.percent / 100)).toFixed(
                            2,
                          )}
                          $
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold">
                      <span>Livraison</span>
                      <span>
                        {subtotalCartPrice >= FREE_SHIPPING_THRESHOLD
                          ? "Gratuite"
                          : (SHIPPING_COSTS[deliveryInfo.ville] || 0) + "$"}
                      </span>
                    </div>
                  </div>

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
                  <button
                    onClick={handleWhatsAppCheckout}
                    disabled={isSuccess}
                    className={`w-full ${paymentMethod === "whatsapp" ? "bg-[#25D366]" : "bg-blue-600"} flex items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all active:scale-95`}
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
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOUTON FLOTTANT PANIER */}
      {!isCartOpen && cart.length > 0 && (
        <div className="fixed right-4 bottom-4 z-50 flex flex-col items-center">
          <AnimatePresence>
            {showAddedTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: -4 }}
                exit={{ opacity: 0 }}
                className="mb-2 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-xl"
              >
                Ajouté !
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative rounded-full bg-blue-600 p-3 text-white shadow-2xl transition-all active:scale-90 sm:p-4 ${isCartWiggling ? "animate-wiggle" : "hover:scale-110"}`}
          >
            <ShoppingCart size={18} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold sm:h-6 sm:w-6">
              {totalItems}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
