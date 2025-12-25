"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Produit } from '../types';

interface Props {
  compareList: Produit[];
  isDarkMode?: boolean;
  onClose: () => void;
}

export default function CompareBar({ compareList, isDarkMode, onClose }: Props) {
  return (
    <AnimatePresence>
      {compareList.length > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-[70] p-4 flex justify-center">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border shadow-2xl rounded-t-[2.5rem] w-full max-w-4xl p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black uppercase italic tracking-widest">Comparateur Gold ({compareList.length}/2)</h4>
              <button type="button" onClick={onClose} aria-label="Fermer le comparateur" className="text-[10px] font-bold text-red-500 uppercase">Fermer</button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {compareList.map(p => (
                <div key={p.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={p.img} alt={p.nom} loading="lazy" className="w-10 h-10 object-cover rounded-lg" />
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
  );
}
