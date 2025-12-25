"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { User, Search, Menu, X, Zap, ShoppingCart, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import AuthForm from '../components/AuthForm';
import { useCart } from '@/src/store/cartContext';
import { useAuth } from '@/src/store/authContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  
  const { user, logout, isLoading } = useAuth(); 
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY, scrollYProgress } = useScroll();

  // 1. Correction Performance : Utilisation de useMotionValueEvent pour un scroll ultra-fluide
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 20 && !isScrolled) setIsScrolled(true);
    if (latest <= 20 && isScrolled) setIsScrolled(false);
  });

  // 2. Correction UX : Bloquer le défilement de la page quand un menu est ouvert
  useEffect(() => {
    document.body.style.overflow = (isMobileMenuOpen || isAuthOpen) ? 'hidden' : 'unset';
  }, [isMobileMenuOpen, isAuthOpen]);

  const displayNom = user ? (user.nom || user.name || user.username || "Client") : "";
  const initial = displayNom ? displayNom[0].toUpperCase() : "?";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search');
    if (query) {
      router.push(`/?search=${query}`); // Envoie la recherche à la page principale
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { name: 'Nouveautés', href: '#nouveautés' },
    { name: 'iPhone', href: '#iphone' },
    { name: 'MacBook', href: '#macbook' },
    { name: 'Accessoires', href: '#accessoires' },
  ];

  // Note : On garde la Navbar sur toutes les pages pour la cohérence, 
  // mais on peut changer son style si on n'est pas sur '/'
  const isHome = pathname === '/';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled ? 'py-2' : 'py-6'
      }`}>
        {/* Barre de progression */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-purple-500 origin-left"
          style={{ scaleX: scrollYProgress }}
        />

        <div className="container mx-auto px-4 md:px-6">
          <div className={`relative flex items-center justify-between px-4 py-2 rounded-full transition-all duration-500 ${
            isScrolled || !isHome
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-white/20' 
            : 'bg-transparent'
          }`}>
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"
              >
                <Zap size={20} className="text-white fill-white" />
              </motion.div>
              <span className="text-lg font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
                Djephy<span className="text-blue-600">Gold</span>
              </span>
            </Link>

            {/* NAVIGATION DESKTOP */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="relative text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-blue-600 transition-colors"
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

            {/* ACTIONS */}
            <div className="flex items-center gap-1 sm:gap-3">
              
              {/* RECHERCHE CORRIGÉE */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.input
                      name="search"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 180, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      placeholder="Rechercher..."
                      className="bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 text-xs outline-none focus:ring-2 ring-blue-500/50 mr-2 text-slate-900 dark:text-white"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
                <button 
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  aria-label="Toggle search"
                >
                  {isSearchOpen ? <X size={18} /> : <Search size={18} />}
                </button>
              </form>

              {/* AUTHENTIFICATION */}
              {!isLoading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {initial}
                        </div>
                        <span className="hidden xs:inline text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {displayNom}
                        </span>
                      </div>
                      <button 
                        onClick={() => logout()}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        title="Déconnexion"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAuthOpen(true)}
                      className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity"
                    >
                      <User size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Compte</span>
                    </button>
                  )}
                </>
              )}

              {/* PANIER */}
              <div className="relative">
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <ShoppingCart size={18} />
                </button>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>

              {/* MOBILE TOGGLE */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-full"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* MENU MOBILE CORRIGÉ */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 px-6 mt-4 lg:hidden"
            >
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                {user && (
                   <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">{initial}</div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Connecté</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{displayNom}</p>
                      </div>
                   </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                      {link.name}
                    </Link>
                  ))}
                </div>
                {!user && (
                  <button onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">
                    Espace Client
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* MODAL AUTH */}
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