"use client";
import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Phone, Mail, MapPin, Zap, ArrowUpRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a] text-white pt-24 pb-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Colonne 1 : Identité */}
        <div className="space-y-6 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:rotate-12 transition-transform duration-500">
              <Zap size={20} className="text-black fill-black" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Djephy<span className="text-amber-500">Gold</span>
            </span>
          </Link>
          {/* CORRECTION CI-DESSOUS : Utilisation de &apos; pour l'apostrophe */}
          <p className="text-gray-400 text-sm leading-relaxed">
            L&apos;excellence technologique à votre portée. Smartphones, ordinateurs et accessoires à Butembo.
          </p>
          <div className="flex space-x-4">
            <Link href="#" className="p-2.5 bg-white/5 rounded-xl hover:bg-amber-500 hover:text-black transition-all duration-300">
              <Facebook size={20} />
            </Link>
            <Link href="#" className="p-2.5 bg-white/5 rounded-xl hover:bg-amber-500 hover:text-black transition-all duration-300">
              <Instagram size={20} />
            </Link>
          </div>
        </div>

        {/* Colonne 2 : Navigation */}
        <div className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">Navigation</h4>
          <ul className="space-y-4">
            {['Nouveautés', 'iPhone', 'MacBook', 'Accessoires'].map((item) => (
              <li key={item}>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center group">
                  {item}
                  <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-amber-500" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 3 : Compte & Support */}
        <div className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">Services</h4>
          <ul className="space-y-4">
            <li>
              <Link href="/connexion" className="text-gray-400 hover:text-amber-500 text-sm transition-colors font-medium">
                Accéder à mon compte
              </Link>
            </li>
            <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Suivre ma commande</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Support technique</Link></li>
            <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Conditions de vente</Link></li>
          </ul>
        </div>

        {/* Colonne 4 : Contact Direct */}
        <div className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">Contact</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-amber-500 group-hover:text-black">
                <Phone size={18} />
              </div>
              <span className="text-sm font-medium">+243 991 098 942</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-amber-500 group-hover:text-black">
                <Mail size={18} />
              </div>
              <span className="text-sm font-medium italic underline decoration-amber-500/30">djephygoldbusiness@gmail.com</span>
            </div>
            <div className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-amber-500 group-hover:text-black">
                <MapPin size={18} />
              </div>
              <span className="text-sm font-medium leading-relaxed">Butembo, Nord-Kivu,<br /> RD Congo</span>
            </div>
          </div>
        </div>

      </div>

      {/* Barre de Copyright */}
      <div className="max-w-7xl mx-auto border-t border-white/5 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 uppercase tracking-widest">
        <div className="flex items-center gap-1 font-medium">
          © {new Date().getFullYear()} <span className="text-amber-500 font-bold">Djephy Gold Business</span>.
        </div>
        <div className="flex gap-6 font-bold">
          <Link href="#" className="hover:text-white transition-colors">Vie privée</Link>
          <Link href="#" className="hover:text-white transition-colors">Mentions</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;