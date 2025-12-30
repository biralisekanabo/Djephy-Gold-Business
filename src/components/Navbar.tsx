"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { User, Search, Menu, X, Zap, ShoppingCart, LogOut, LayoutDashboard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import AuthForm from '../components/AuthForm';
import { useCart } from '@/src/store/cartContext';
import { useAuth } from '@/src/store/authContext';

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
    if (pathname !== '/') return;
    if (latest > 20 && !isScrolled) setIsScrolled(true);
    if (latest <= 20 && isScrolled) setIsScrolled(false);
  });

  useEffect(() => {
    document.body.style.overflow = (isMobileMenuOpen || isAuthOpen) ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isAuthOpen]);

  // Close mobile menu with Escape key; also close on route change
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  // --- FETCH USER ORDERS (COUNT + RECENT) ---
  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      try {
        const storedUser = localStorage.getItem('user') || localStorage.getItem('djephy_user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const userId = user.id_utilisateur || user.id || user.user?.id_utilisateur || user.user?.id;
        if (!userId) return;

        setOrdersLoading(true);
        const response = await fetch(`https://blessing.alwaysdata.net/api/passer_commande.php?id_utilisateur=${userId}`, {
          method: 'GET', headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Erreur serveur');
        const res = await response.json();
        if (mounted && res?.success && Array.isArray(res.orders)) {
          // store orders and keep only latest
          const sorted = res.orders.slice().sort((a: Order, b: Order) => Number(b.id) - Number(a.id));
          // detect new orders compared to last seen id
          const latestId = sorted.length > 0 ? Number(sorted[0].id) : null;
          if (lastOrderIdRef.current == null) {
            // initial load: set last seen id without notifying
            lastOrderIdRef.current = latestId;
          } else if (latestId && lastOrderIdRef.current && latestId > lastOrderIdRef.current) {
            // new order detected
            setToast({ msg: `#CMD-${latestId}`, id: latestId });
            lastOrderIdRef.current = latestId;
          }
          setOrders(sorted);
        }
      } catch (e) {
        console.warn('Impossible de charger les commandes:', e);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 60_000); // refresh every minute
    return () => { mounted = false; clearInterval(interval); };
  }, [user]);

  // auto-dismiss toast after a timeout
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  // --- CONDITION D'AFFICHAGE (APRÈS LES HOOKS) ---
  if (pathname !== '/') {
    return null;
  }

  // --- FONCTIONS HANDLERS ---
  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search');
    if (query) {
      router.push(`/?search=${query}`);
      setIsSearchOpen(false);
    }
  };

  const displayNom = user ? (user.nom || user.name || user.username || "Client") : "";
  const initial = displayNom ? displayNom[0].toUpperCase() : "?";

  const navLinks = [
    { name: 'Nouveautés', href: '#nouveautes' },
    { name: 'iPhone', href: '#iphone' },
    { name: 'MacBook', href: '#macbook' },
    { name: 'Accessoires', href: '#accessoires' },
  ];

  const isHome = pathname === '/';

  return (
    <>
      {/* New order toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="fixed top-6 right-6 z-[400]">
            <div className="relative">
              <motion.button
                onClick={() => { router.push('/mon-espace#orders'); setToast(null); }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-xl hover:shadow-2xl focus:outline-none"
              >
                <ShoppingCart size={18} />
                <div className="text-left">
                  <p className="text-sm font-black leading-none">Nouvelle commande</p>
                  <p className="text-xs opacity-90">{toast.msg}</p>
                </div>
              </motion.button>
              <button onClick={() => setToast(null)} aria-label="Fermer" className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow text-blue-700">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav role="navigation" aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled ? 'py-2' : 'py-6'
      }`}>
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-blue-400 origin-left"
          style={{ scaleX: scrollYProgress }}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div className={`relative flex items-center justify-between px-4 py-2 rounded-none sm:rounded-full transition-all duration-500 ${
            isScrolled || !isHome
            ? 'bg-white/80 dark:bg-blue-900/80 backdrop-blur-xl shadow-2xl border border-white/20' 
            : 'bg-transparent'
          }`}>
            
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"
              >
                <Zap size={20} className="text-white fill-white" />
              </motion.div>
              <div className="flex flex-col">
                 <span className="text-lg font-black tracking-tighter uppercase italic text-blue-900 dark:text-white leading-none">
                   Djephy<span className="text-blue-600">Gold</span>
                 </span>
                 <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-blue-500 mt-0.5">Premium Store</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="relative text-[10px] font-black uppercase tracking-[0.15em] text-blue-400 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                  {hoveredLink === link.name && (
                    <motion.div 
                      layoutId="navUnderline"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-600 rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.input
                      name="search"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 180, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      placeholder="Rechercher..."
                      className="bg-blue-50 dark:bg-blue-800 rounded-full px-4 py-1.5 text-xs outline-none focus:ring-2 ring-blue-500/50 mr-2 text-blue-900 dark:text-white"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
                <button 
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800 rounded-full transition-colors"
                >
                  {isSearchOpen ? <X size={18} /> : <Search size={18} />}
                </button>
              </form>

              {isLoading ? (
                <div className="p-2"><Loader2 size={18} className="animate-spin text-blue-600" /></div>
              ) : (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      {user?.role === 'admin' ? (
                        <Link href="/admin" className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors" aria-label="Admin dashboard">
                          <LayoutDashboard size={14} />
                          <span className="text-[9px] font-black uppercase">Admin</span>
                        </Link>
                      ) : (
                        <Link href="/dashboard" className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors" aria-label="Mon dashboard">
                          <LayoutDashboard size={14} />
                          <span className="text-[9px] font-black uppercase">Dashboard</span>
                        </Link>
                      )}

                      {/* Bouton Mes commandes pour utilisateurs connectés */}
                      {/* Desktop: pill with badge + hover to preview */}
                      <div className="hidden sm:inline-flex relative ml-2">
                        <Link href="/mon-espace#orders" onMouseEnter={() => setOrdersOpen(true)} onMouseLeave={() => setOrdersOpen(false)} className="relative inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors">
                          <ShoppingCart size={14} />
                          <span className="text-[9px] font-black uppercase">Mes commandes</span>
                          {ordersLoading ? (
                            <span className="absolute -top-2 -right-2 bg-white rounded-full p-0.5">
                              <Loader2 size={12} className="animate-spin text-blue-600" />
                            </span>
                          ) : orders.length > 0 ? (
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-blue-900">{orders.length}</span>
                          ) : null}
                        </Link>

                        {/* Desktop preview panel */}
                        <AnimatePresence>
                          {ordersOpen && orders.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-blue-900 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-2xl p-3 z-50">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Dernières commandes</p>
                              <div className="space-y-2">
                                {orders.slice(0,3).map((o) => (
                                  <div key={o.id} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-800 flex items-center justify-between">
                                    <div>
                                      <p className="text-[11px] font-black">#CMD-{o.id} <span className="text-[10px] font-medium text-blue-400">{new Date(o.date_commande).toLocaleDateString()}</span></p>
                                      <p className="text-[10px] text-blue-600 dark:text-blue-300">{o.statut} — {parseFloat(String(o.prix_total || 0)).toFixed(2)} $</p>
                                    </div>
                                    <Link href="/mon-espace#orders" onClick={() => setOrdersOpen(false)} className="text-blue-600 text-[12px] font-black ml-2">Voir</Link>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mobile: visible icon with badge + expandable preview */}
                      <div className="relative sm:hidden">
                        <button aria-label="Mes commandes" onClick={() => setOrdersOpen(!ordersOpen)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <ShoppingCart size={18} />
                        </button>
                        {ordersLoading ? (
                          <span className="absolute -top-1 -right-1 bg-white rounded-full p-0.5"><Loader2 size={12} className="animate-spin text-blue-600" /></span>
                        ) : orders.length > 0 ? (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center">{orders.length}</span>
                        ) : null}

                        <AnimatePresence>
                          {ordersOpen && orders.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-blue-900 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-2xl p-3 z-50">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dernières commandes</p>
                              <div className="space-y-2">
                                {orders.slice(0,3).map((o) => (
                                  <div key={o.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                                    <div>
                                      <p className="text-[11px] font-black">#CMD-{o.id} <span className="text-[10px] font-medium text-slate-500">{new Date(o.date_commande).toLocaleDateString()}</span></p>
                                      <p className="text-[10px] text-slate-600 dark:text-slate-300">{o.statut} — {parseFloat(String(o.prix_total || 0)).toFixed(2)} $</p>
                                    </div>
                                    <Link href="/mon-espace#orders" onClick={() => setOrdersOpen(false)} className="text-green-600 text-[12px] font-black ml-2">Voir</Link>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {initial}
                        </div>
                        <span className="hidden sm:inline text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {displayNom}
                        </span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                        title="Déconnexion"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAuthOpen(true)}
                      className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all"
                    >
                      <User size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Compte</span>
                    </button>
                  )}
                </>
              )}

              <div className="relative">
                <button aria-label="Voir le panier" className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800 rounded-full transition-colors">
                  <ShoppingCart size={18} />
                </button>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>

              <button 
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-blue-900 dark:text-white bg-blue-50 dark:bg-blue-800 rounded-full hover:bg-blue-600 hover:text-white transition-all"
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
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 px-4 mt-2 lg:hidden"
            >
              <div className="bg-white/98 dark:bg-blue-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-800 p-4 space-y-3">
                {user && (
                   <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">{initial}</div>
                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Connecté</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{displayNom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user?.role === 'admin' ? (
                                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} aria-label="Admin dashboard" className="p-3 bg-white dark:bg-blue-800 rounded-xl text-blue-600 w-full flex items-center justify-center">
                            <LayoutDashboard size={20} />
                          </Link>
                        ) : (
                          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} aria-label="Mon dashboard" className="p-3 bg-white dark:bg-blue-800 rounded-xl text-blue-600 w-full flex items-center justify-center">
                            <LayoutDashboard size={20} />
                          </Link>
                        )}
                        <Link href="/mon-espace#orders" onClick={() => setIsMobileMenuOpen(false)} aria-label="Mes commandes" className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 w-full flex items-center justify-center">
                          <ShoppingCart size={18} />
                        </Link>
                      </div>
                   </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                      className="p-4 bg-blue-50 dark:bg-blue-800/50 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors">
                      {link.name}
                    </Link>
                  ))}
                </div>
                {user ? (
                   <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-red-100 dark:border-red-900/20">
                    <LogOut size={16} /> Déconnexion
                  </button>
                ) : (
                  <button onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm">
               <AuthForm onClose={() => setIsAuthOpen(false)} /> 
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}