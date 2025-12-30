"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  User,
  Search,
  Menu,
  X,
  Zap,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import AuthForm from "../components/AuthForm";
import { useCart } from "@/src/store/cartContext";
import { useAuth } from "@/src/store/authContext";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // --- ORDERS TYPES & STATE ---
  interface OrderItem {
    nom_produit: string;
    quantite: number;
    prix_unitaire: string | number;
  }

  interface Order {
    id: number;
    date_commande: string;
    statut: string;
    prix_total: string | number;
    items?: OrderItem[];
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  // last seen order id to detect new orders
  const lastOrderIdRef = useRef<number | null>(null);
  // toast for new order notification
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  const { user, logout, isLoading } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();
  const { scrollY, scrollYProgress } = useScroll();

  // --- LOGIQUE DES HOOKS (DOIT ÊTRE AVANT LE RETURN NULL) ---

  useMotionValueEvent(scrollY, "change", (latest) => {
    // On n'exécute la logique de scroll que si on est sur l'accueil
    if (pathname !== "/") return;
    if (latest > 20 && !isScrolled) setIsScrolled(true);
    if (latest <= 20 && isScrolled) setIsScrolled(false);
  });

  useEffect(() => {
    document.body.style.overflow =
      isMobileMenuOpen || isAuthOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen, isAuthOpen]);

  // Close mobile menu with Escape key; also close on route change
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // --- FETCH USER ORDERS (COUNT + RECENT) ---
  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      try {
        const storedUser =
          localStorage.getItem("user") || localStorage.getItem("djephy_user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const userId =
          user.id_utilisateur ||
          user.id ||
          user.user?.id_utilisateur ||
          user.user?.id;
        if (!userId) return;

        setOrdersLoading(true);
        const response = await fetch(
          `https://blessing.alwaysdata.net/api/passer_commande.php?id_utilisateur=${userId}`,
          {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
              Accept: "application/json",
            },
          },
        );
        if (!response.ok) throw new Error("Erreur serveur");
        const res = await response.json();
        if (mounted && res?.success && Array.isArray(res.orders)) {
          // store orders and keep only latest
          const sorted = res.orders
            .slice()
            .sort((a: Order, b: Order) => Number(b.id) - Number(a.id));
          // detect new orders compared to last seen id
          const latestId = sorted.length > 0 ? Number(sorted[0].id) : null;
          if (lastOrderIdRef.current == null) {
            // initial load: set last seen id without notifying
            lastOrderIdRef.current = latestId;
          } else if (
            latestId &&
            lastOrderIdRef.current &&
            latestId > lastOrderIdRef.current
          ) {
            // new order detected
            setToast({ msg: `#CMD-${latestId}`, id: latestId });
            lastOrderIdRef.current = latestId;
          }
          setOrders(sorted);
        }
      } catch (e) {
        console.warn("Impossible de charger les commandes:", e);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 60_000); // refresh every minute
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // auto-dismiss toast after a timeout
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  // --- CONDITION D'AFFICHAGE (APRÈS LES HOOKS) ---
  if (pathname !== "/") {
    return null;
  }

  // --- FONCTIONS HANDLERS ---
  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search");
    if (query) {
      router.push(`/?search=${query}`);
      setIsSearchOpen(false);
    }
  };

  const displayNom = user
    ? user.nom || user.name || user.username || "Client"
    : "";
  const initial = displayNom ? displayNom[0].toUpperCase() : "?";

  const navLinks = [
    { name: "Nouveautés", href: "#nouveautes" },
    { name: "iPhone", href: "#iphone" },
    { name: "MacBook", href: "#macbook" },
    { name: "Accessoires", href: "#accessoires" },
  ];

  const isHome = pathname === "/";

  return (
    <>
      {/* New order toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-6 right-6 z-[400]"
          >
            <div className="relative">
              <motion.button
                onClick={() => {
                  router.push("/mon-espace#orders");
                  setToast(null);
                }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-xl hover:shadow-2xl focus:outline-none"
              >
                <ShoppingCart size={18} />
                <div className="text-left">
                  <p className="text-sm leading-none font-black">
                    Nouvelle commande
                  </p>
                  <p className="text-xs opacity-90">{toast.msg}</p>
                </div>
              </motion.button>
              <button
                onClick={() => setToast(null)}
                aria-label="Fermer"
                className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-blue-700 shadow"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 right-0 left-0 z-[100] transition-all duration-500 ${
          isScrolled ? "py-2" : "py-6"
        }`}
      >
        <motion.div
          className="absolute top-0 right-0 left-0 h-[3px] origin-left bg-gradient-to-r from-blue-600 to-blue-400"
          style={{ scaleX: scrollYProgress }}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div
            className={`relative flex items-center justify-between rounded-none px-4 py-2 transition-all duration-500 sm:rounded-full ${
              isScrolled || !isHome
                ? "border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-blue-900/80"
                : "bg-transparent"
            }`}
          >
            <Link href="/" className="group flex shrink-0 items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200"
              >
                <Zap size={20} className="fill-white text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg leading-none font-black tracking-tighter text-blue-900 uppercase italic dark:text-white">
                  Djephy<span className="text-blue-600">Gold</span>
                </span>
                <span className="mt-0.5 text-[7px] font-bold tracking-[0.3em] text-blue-500 uppercase">
                  Premium Store
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="relative text-[10px] font-black tracking-[0.15em] text-blue-400 uppercase transition-colors hover:text-blue-600"
                >
                  {link.name}
                  {hoveredLink === link.name && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute right-0 -bottom-1 left-0 h-[2px] rounded-full bg-blue-600"
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <form
                onSubmit={handleSearch}
                className="relative flex items-center"
              >
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.input
                      name="search"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 180, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      placeholder="Rechercher..."
                      className="mr-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs text-blue-900 ring-blue-500/50 outline-none focus:ring-2 dark:bg-blue-800 dark:text-white"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-800"
                >
                  {isSearchOpen ? <X size={18} /> : <Search size={18} />}
                </button>
              </form>

              {isLoading ? (
                <div className="p-2">
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      {user?.role === "admin" ? (
                        <Link
                          href="/admin"
                          className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-100 sm:flex dark:border-blue-800 dark:bg-blue-900/20"
                          aria-label="Admin dashboard"
                        >
                          <LayoutDashboard size={14} />
                          <span className="text-[9px] font-black uppercase">
                            Admin
                          </span>
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-100 sm:flex dark:border-blue-800 dark:bg-blue-900/20"
                          aria-label="Mon dashboard"
                        >
                          <LayoutDashboard size={14} />
                          <span className="text-[9px] font-black uppercase">
                            Dashboard
                          </span>
                        </Link>
                      )}

                      {/* Bouton Mes commandes pour utilisateurs connectés */}
                      {/* Desktop: pill with badge + hover to preview */}
                      <div className="relative ml-2 hidden sm:inline-flex">
                        <Link
                          href="/mon-espace#orders"
                          onMouseEnter={() => setOrdersOpen(true)}
                          onMouseLeave={() => setOrdersOpen(false)}
                          className="relative inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20"
                        >
                          <ShoppingCart size={14} />
                          <span className="text-[9px] font-black uppercase">
                            Mes commandes
                          </span>
                          {ordersLoading ? (
                            <span className="absolute -top-2 -right-2 rounded-full bg-white p-0.5">
                              <Loader2
                                size={12}
                                className="animate-spin text-blue-600"
                              />
                            </span>
                          ) : orders.length > 0 ? (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-blue-900">
                              {orders.length}
                            </span>
                          ) : null}
                        </Link>

                        {/* Desktop preview panel */}
                        <AnimatePresence>
                          {ordersOpen && orders.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="absolute top-full right-0 z-50 mt-3 w-80 rounded-2xl border border-blue-100 bg-white p-3 shadow-2xl dark:border-blue-800 dark:bg-blue-900"
                            >
                              <p className="mb-2 text-[10px] font-black tracking-widest text-blue-400 uppercase">
                                Dernières commandes
                              </p>
                              <div className="space-y-2">
                                {orders.slice(0, 3).map((o) => (
                                  <div
                                    key={o.id}
                                    className="flex items-center justify-between rounded-xl bg-blue-50 p-2 dark:bg-blue-800"
                                  >
                                    <div>
                                      <p className="text-[11px] font-black">
                                        #CMD-{o.id}{" "}
                                        <span className="text-[10px] font-medium text-blue-400">
                                          {new Date(
                                            o.date_commande,
                                          ).toLocaleDateString()}
                                        </span>
                                      </p>
                                      <p className="text-[10px] text-blue-600 dark:text-blue-300">
                                        {o.statut} —{" "}
                                        {parseFloat(
                                          String(o.prix_total || 0),
                                        ).toFixed(2)}{" "}
                                        $
                                      </p>
                                    </div>
                                    <Link
                                      href="/mon-espace#orders"
                                      onClick={() => setOrdersOpen(false)}
                                      className="ml-2 text-[12px] font-black text-blue-600"
                                    >
                                      Voir
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mobile: visible icon with badge + expandable preview */}
                      <div className="relative sm:hidden">
                        <button
                          aria-label="Mes commandes"
                          onClick={() => setOrdersOpen(!ordersOpen)}
                          className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <ShoppingCart size={18} />
                        </button>
                        {ordersLoading ? (
                          <span className="absolute -top-1 -right-1 rounded-full bg-white p-0.5">
                            <Loader2
                              size={12}
                              className="animate-spin text-blue-600"
                            />
                          </span>
                        ) : orders.length > 0 ? (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                            {orders.length}
                          </span>
                        ) : null}

                        <AnimatePresence>
                          {ordersOpen && orders.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="absolute top-full right-0 z-50 mt-3 w-72 rounded-2xl border border-blue-100 bg-white p-3 shadow-2xl dark:border-blue-800 dark:bg-blue-900"
                            >
                              <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Dernières commandes
                              </p>
                              <div className="space-y-2">
                                {orders.slice(0, 3).map((o) => (
                                  <div
                                    key={o.id}
                                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2 dark:bg-slate-800"
                                  >
                                    <div>
                                      <p className="text-[11px] font-black">
                                        #CMD-{o.id}{" "}
                                        <span className="text-[10px] font-medium text-slate-500">
                                          {new Date(
                                            o.date_commande,
                                          ).toLocaleDateString()}
                                        </span>
                                      </p>
                                      <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                        {o.statut} —{" "}
                                        {parseFloat(
                                          String(o.prix_total || 0),
                                        ).toFixed(2)}{" "}
                                        $
                                      </p>
                                    </div>
                                    <Link
                                      href="/mon-espace#orders"
                                      onClick={() => setOrdersOpen(false)}
                                      className="ml-2 text-[12px] font-black text-green-600"
                                    >
                                      Voir
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-[10px] font-bold text-white uppercase">
                          {initial}
                        </div>
                        <span className="hidden text-[10px] font-black tracking-tight text-slate-900 uppercase sm:inline dark:text-white">
                          {displayNom}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="rounded-full p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"
                        title="Déconnexion"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/20 dark:bg-blue-600"
                    >
                      <User size={16} />
                      <span className="hidden text-[10px] font-black tracking-widest uppercase sm:inline">
                        Compte
                      </span>
                    </button>
                  )}
                </>
              )}

              <div className="relative">
                <button
                  aria-label="Voir le panier"
                  className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-800"
                >
                  <ShoppingCart size={18} />
                </button>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>

              <button
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-full bg-blue-50 p-2 text-blue-900 transition-all hover:bg-blue-600 hover:text-white lg:hidden dark:bg-blue-800 dark:text-white"
                aria-label="Ouvrir le menu mobile"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              role="menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 left-0 mt-2 px-4 lg:hidden"
            >
              <div className="space-y-3 rounded-2xl border border-blue-100 bg-white/98 p-4 shadow-2xl backdrop-blur-2xl dark:border-blue-800 dark:bg-blue-900/95">
                {user && (
                  <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                        {initial}
                      </div>
                      <div>
                        <p className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
                          Connecté
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {displayNom}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.role === "admin" ? (
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="Admin dashboard"
                          className="flex w-full items-center justify-center rounded-xl bg-white p-3 text-blue-600 dark:bg-blue-800"
                        >
                          <LayoutDashboard size={20} />
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-label="Mon dashboard"
                          className="flex w-full items-center justify-center rounded-xl bg-white p-3 text-blue-600 dark:bg-blue-800"
                        >
                          <LayoutDashboard size={20} />
                        </Link>
                      )}
                      <Link
                        href="/mon-espace#orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Mes commandes"
                        className="flex w-full items-center justify-center rounded-xl bg-green-50 p-3 text-green-600 dark:bg-green-900/20"
                      >
                        <ShoppingCart size={18} />
                      </Link>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-2xl bg-blue-50 p-4 text-center text-[10px] font-black tracking-widest text-blue-600 uppercase transition-colors hover:bg-blue-50 hover:text-blue-600 dark:bg-blue-800/50 dark:text-blue-300 dark:hover:bg-blue-900/20"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-4 text-xs font-black tracking-widest text-red-500 uppercase dark:border-red-900/20 dark:bg-red-900/10"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full rounded-2xl bg-blue-600 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/30"
                  >
                    Espace Client
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm"
            >
              <AuthForm onClose={() => setIsAuthOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
