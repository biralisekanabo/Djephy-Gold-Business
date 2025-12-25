"use client";
import React, { useState } from 'react';
import { useAuth } from '@/src/store/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Eye, EyeOff, Loader2, X, Shield, CheckCircle2 } from 'lucide-react';

interface AuthFormProps {
  onClose?: () => void;
}

export default function AuthForm({ onClose }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });

  const handleGoogleLogin = () => {
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth'; 
  };

  const handleGithubLogin = () => {
    window.location.href = 'https://github.com/login/oauth/authorize';
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(formData.password);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost/api/auth.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        
        // --- NOUVEAU : VIDAGE DES CHAMPS APRÈS RÉUSSITE ---
        setFormData({ name: '', email: '', password: '' });

        if (isLogin) {
          try { login(data.user); } catch (e) { localStorage.setItem('djephy_user', JSON.stringify(data.user)); }
          setTimeout(() => {
            if (data.user.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/mon-espace';
            }
          }, 1500);
        } else {
          setTimeout(() => {
            setIsLogin(true);
            setStatus({ type: 'success', message: "Compte créé ! Connectez-vous." });
          }, 1500);
        }
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: "Impossible de contacter le serveur PHP." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClassName = "w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400";

  return (
    <div className="w-full max-w-[360px] mx-auto p-4">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
      >
        {/* --- NOUVEAU : OVERLAY DE CHARGEMENT --- */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Traitement...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center mb-5">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 mb-2"
            >
                <Shield className="text-white" size={20} />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {isLogin ? "Connexion" : "Inscription"}
            </h2>
        </div>

        <button onClick={onClose} className="absolute right-5 top-5 text-slate-300 hover:text-slate-500 transition-colors z-10">
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-4 p-2.5 rounded-xl text-[11px] text-center font-bold flex items-center justify-center gap-2 ${
                status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              {status.type === 'success' && <CheckCircle2 size={14} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>
        
        <form className="space-y-3" onSubmit={handleSubmit}>
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                className="relative"
              >
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input name="name" type="text" required placeholder="Nom complet" value={formData.name} onChange={handleChange} className={inputClassName} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input name="email" type="email" required placeholder="Email" value={formData.email} onChange={handleChange} className={inputClassName} />
          </motion.div>

          <motion.div layout className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input name="password" type={showPassword ? "text" : "password"} required placeholder="Mot de passe" value={formData.password} onChange={handleChange} className={`${inputClassName} pr-10`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </motion.div>

          <motion.button 
            layout
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>{isLogin ? 'Se connecter' : 'Créer le compte'} <ArrowRight size={16} /></>}
          </motion.button>
        </form>

        <div className="mt-5">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-full border-t border-slate-100"></div>
            <span className="absolute px-3 bg-white text-[10px] font-bold text-slate-300 uppercase tracking-widest">Social</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={handleGoogleLogin} 
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
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
              whileHover={{ y: -2 }}
              onClick={handleGithubLogin} 
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-black transition-all text-white shadow-sm"
            >
              <Github size={16} />
              <span className="text-[11px] font-bold">GitHub</span>
            </motion.button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            {isLogin ? "Créer un compte" : "Retour à la connexion"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}