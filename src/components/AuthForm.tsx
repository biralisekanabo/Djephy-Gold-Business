"use client";

import React, { useState } from 'react';
import { useAuth } from '@/src/store/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Eye, EyeOff, Loader2, X, Shield, CheckCircle2, Phone } from 'lucide-react';

// --- AJOUT DE L'INTERFACE POUR LA RÉPONSE API ---
interface AuthApiResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

interface AuthFormProps {
  onClose?: () => void;
}

export default function AuthForm({ onClose }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });

  const { login } = useAuth();

  const handleGoogleLogin = () => {
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth'; 
  };

  const handleGithubLogin = () => {
    window.location.href = 'https://github.com/login/oauth/authorize';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      if (!phoneRegex.test(formData.phone)) {
        setStatus({ 
          type: 'error', 
          message: "Format de téléphone invalide (ex: 0612345678)." 
        });
        return;
      }
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('https://blessing.alwaysdata.net/api/auth.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          ...formData 
        }),
      });

      // Remplacement du "any" par l'interface dédiée
      const data: AuthApiResponse = await response.json();

      if (data.success && data.user) {
        if (isLogin) {
          setStatus({ type: 'success', message: data.message });
          playSuccessSound();
          const userToStore = data.user;
          localStorage.removeItem('user');
          localStorage.removeItem('djephy_user');
          localStorage.setItem('user', JSON.stringify(userToStore));

          try { 
            login(userToStore); 
          } catch { 
            // Correction : 'e' supprimé car inutilisé
            localStorage.setItem('djephy_user', JSON.stringify(userToStore)); 
          }
          
          setTimeout(() => {
            window.location.href = userToStore.role === 'admin' ? '/admin' : '/mon-espace';
          }, 1500);
        } else {
          setStatus({ type: 'success', message: "Compte créé ! Veuillez vous connecter." });
          // celebration for new signup
          showConfetti();
          playSuccessSound();
          setFormData({ ...formData, password: '' }); 
          setTimeout(() => {
            setIsLogin(true);
          }, 1500);
        }
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch {
      // Correction : 'error' supprimé car inutilisé
      setStatus({ type: 'error', message: "Le service d&apos;authentification est indisponible." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = "w-full bg-white/60 dark:bg-slate-800/60 border border-transparent focus:border-transparent focus:ring-2 focus:ring-blue-400 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400 backdrop-blur-sm";


  // sound enabled state (saved in localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => (typeof window !== 'undefined' ? localStorage.getItem('djephy_sounds') !== 'off' : true));
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try { localStorage.setItem('djephy_sounds', next ? 'on' : 'off'); } catch {}
  };

  // play a short success chime using WebAudio API (typed-safe access)
  const playSuccessSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const win = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const Ctx = win.AudioContext ?? win.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.01);
      o.start(now);
      o.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      o.stop(now + 0.9);
    } catch (e) {
      // ignore audio errors
      console.warn('Audio not available', e);
    }
  };

  // lightweight confetti using DOM elements (respects prefers-reduced-motion)
  const showConfetti = () => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = 'djephy-confetti-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.innerHTML = `@keyframes djephy-confetti-fall { to { transform: translateY(120vh) rotate(720deg); opacity: 0 } }`;
      document.head.appendChild(style);
    }

    const container = document.createElement('div');
    container.className = 'djephy-confetti-container';
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';

    const colors = ['#06b6d4','#60a5fa','#34d399','#fca5a5','#fbbf24','#a78bfa'];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      const size = Math.floor(Math.random() * 10) + 6;
      s.style.position = 'absolute';
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `-10px`;
      s.style.width = `${size}px`;
      s.style.height = `${size * 0.6}px`;
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
      s.style.borderRadius = `${Math.random() > 0.5 ? '2px' : '50%'} `;
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      s.style.opacity = '1';
      const dur = 1200 + Math.floor(Math.random() * 1200);
      s.style.animation = `djephy-confetti-fall ${dur}ms linear forwards`;
      s.style.boxShadow = '0 1px 2px rgba(0,0,0,0.12)';
      container.appendChild(s);
    }

    document.body.appendChild(container);
    setTimeout(() => { container.remove(); }, 2500);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="relative bg-gradient-to-br from-white/80 via-white/70 to-slate-50 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-800/60 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100/60 overflow-hidden"
      >
        {/* decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 w-44 h-44 rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/10 blur-3xl mix-blend-multiply" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-10 w-56 h-56 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-200/10 blur-3xl mix-blend-multiply" />

        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <Loader2 className="animate-spin text-blue-600 mb-2" size={36} />
              <p className="text-blue-600 text-[12px] font-black uppercase tracking-widest">Traitement...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center mb-6">
            <motion.div 
              layout
              whileHover={{ scale: 1.06, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 240 }}
              className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-xl text-white mb-3"
            >
                <Shield className="text-white" size={22} />
            </motion.div>
            <motion.h2 
              layout
              key={isLogin ? "login-title" : "register-title"}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            >
                {isLogin ? "Connexion" : "Inscription"}
            </motion.h2>
            <p className="text-[13px] text-slate-500 mt-1">Accédez à votre compte et gérez vos commandes rapidement.</p>
        </div>

        {onClose && (
          <button onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 bg-white/60 dark:bg-slate-900/40 p-1.5 rounded-full shadow-sm transition-colors z-10">
            <X size={18} />
          </button>
        )}

        <AnimatePresence mode="wait">
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-4 p-3 rounded-xl text-[13px] text-center font-bold flex items-center justify-center gap-3 shadow-sm ${
                status.type === 'success' ? 'bg-green-600 text-white border border-green-700' : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              {status.type === 'success' && <CheckCircle2 size={18} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>
        
        <form className="space-y-3" onSubmit={handleSubmit}>
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                key="register-fields"
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-3 overflow-hidden"
              >
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.28 }} className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input name="name" type="text" required placeholder="Nom complet" value={formData.name} onChange={handleChange} className={inputClassName} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.28 }} className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input name="phone" type="tel" required placeholder="Numéro de téléphone" value={formData.phone} onChange={handleChange} className={inputClassName} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.28 }} className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input name="email" type="email" required placeholder="Email" value={formData.email} onChange={handleChange} className={inputClassName} />
          </motion.div>

          <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.28 }} className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input name="password" type={showPassword ? "text" : "password"} required placeholder="Mot de passe" value={formData.password} onChange={handleChange} className={`${inputClassName} pr-10`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </motion.div>

          <motion.button 
            layout
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 text-white font-extrabold py-3 rounded-xl shadow-2xl transition-all text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>{isLogin ? 'Se connecter' : 'Créer le compte'} <ArrowRight size={16} /></>}
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-full border-t border-slate-100/70"></div>
            <span className="absolute px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Social</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              layout
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={handleGoogleLogin} 
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-white transition-all shadow-sm bg-white"
            >
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[11px] font-bold text-slate-600">Google</span>
            </motion.button>
            <motion.button 
              layout
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={handleGithubLogin} 
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-black transition-all text-white shadow-sm"
            >
              <Github size={16} />
              <span className="text-[11px] font-bold">GitHub</span>
            </motion.button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <button type="button" onClick={toggleSound} className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2">
              <span className="text-sm">{soundEnabled ? '🔊' : '🔇'}</span>
              <span>{soundEnabled ? 'Sons activés' : 'Sons désactivés'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button 
            type="button"
            onClick={() => {
                setIsLogin(!isLogin);
                setStatus({ type: null, message: '' });
            }} 
            className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            {isLogin ? "Créer un compte" : "Retour à la connexion"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}