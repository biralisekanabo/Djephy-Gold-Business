"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/src/store/authContext';
import { motion } from 'framer-motion';
import { 
  Package, User, LogOut, LayoutDashboard, 
  Search, Sun, Moon, ShoppingBag, ArrowRight, Clock, CheckCircle, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const { user: authUser, isLoading, logout } = useAuth();

  useEffect(() => {
    setMounted(true);

    // Vérification de la session (compatibilité avec anciens keys)
    const rawUser = authUser ?? (() => { try { const s = localStorage.getItem('djephy_user') || localStorage.getItem('user'); return s ? JSON.parse(s) : null } catch (e) { return null } })();

    if (!rawUser || !rawUser.id) {
      window.location.href = '/'; // Redirection si non connecté
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost/api/dashboard.php?user_id=${rawUser.id}`);
        const resData = await response.json();

        if (resData.success) {
          setData(resData);
        } else {
          setError(resData.message);
        }
      } catch (err) {
        setError("Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]);

  // Calcul des statistiques
  const totalDepense = useMemo(() => {
    return data?.orders?.reduce((acc: number, curr: any) => acc + parseFloat(curr.total_paye || 0), 0) || 0;
  }, [data]);

  const handleLogout = () => {
    try { logout(); } catch (e) { localStorage.removeItem('user'); localStorage.removeItem('djephy_user'); }
    window.location.href = '/';
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-[#F8FAFC] text-black'} transition-colors duration-300`}>
      
      {/* --- BARRE DE NAVIGATION --- */}
      <nav className={`p-4 sticky top-0 z-50 border-b ${darkMode ? 'border-white/10 bg-black/80' : 'border-black/5 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/30">
              <LayoutDashboard size={20}/>
            </div>
            <span className="font-black uppercase tracking-tighter text-xl">MON<span className="text-blue-600">DASHBOARD</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
              {darkMode ? <Sun size={20} className="text-blue-500" /> : <Moon size={20} className="text-blue-600" />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        
        {/* --- SECTION STATISTIQUES RAPIDES --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <TrendingUp className="text-blue-600 mb-2" size={24} />
            <p className="text-[10px] uppercase font-black opacity-50">Total Dépensé</p>
            <h3 className="text-2xl font-black">{totalDepense.toFixed(2)}$</h3>
          </div>
          <div className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <Package className="text-blue-600 mb-2" size={24} />
            <p className="text-[10px] uppercase font-black opacity-50">Commandes Totales</p>
            <h3 className="text-2xl font-black">{data?.orders?.length || 0}</h3>
          </div>
          {/* BOUTON VERS LA BOUTIQUE */}
          <Link href="/" className="group">
            <div className="h-full p-6 rounded-[2rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20 flex flex-col justify-center items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 text-center">
               <ShoppingBag size={28} className="group-hover:bounce" />
               <span className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                 Boutique <ArrowRight size={16} />
               </span>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* --- COLONNE GAUCHE : PROFIL --- */}
          <div className="space-y-6">
            <div className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} relative overflow-hidden shadow-2xl shadow-black/20`}>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-6 flex items-center justify-center text-white font-black text-2xl">
                  {data?.profile?.nom?.charAt(0).toUpperCase()}
                </div>
                <p className="text-[10px] uppercase font-bold opacity-50 mb-1 tracking-widest">Compte Client</p>
                <h2 className="text-2xl font-black mb-6 truncate uppercase">{data?.profile?.nom || "Utilisateur"}</h2>
                <div className="space-y-4 text-xs">
                  <div className="opacity-80">
                    <p className="text-[9px] uppercase opacity-40 font-black">Email</p>
                    <p className="font-bold">{data?.profile?.email}</p>
                  </div>
                  <div className={`h-px w-full ${darkMode ? 'bg-black/10' : 'bg-white/10'}`} />
                  <p className="opacity-60 italic">Client depuis le {new Date(data?.profile?.date_inscription).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- COLONNE DROITE : HISTORIQUE --- */}
          <div className="lg:col-span-2">
            <div className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
              <div className="p-6 border-b border-inherit flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-black uppercase text-sm tracking-widest">Historique</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                  <input 
                    type="text" placeholder="Filtrer par ville..." 
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-bold border-none outline-none ${darkMode ? 'bg-black' : 'bg-slate-50'}`}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto px-4 pb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase font-black opacity-30">
                      <th className="px-6 py-6">Réf</th>
                      <th className="px-6 py-6">Ville</th>
                      <th className="px-6 py-6">Montant</th>
                      <th className="px-6 py-6 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold">
                    {data?.orders?.filter((o:any) => o.ville.toLowerCase().includes(searchQuery.toLowerCase())).map((order: any) => (
                      <tr key={order.id} className="border-b border-inherit last:border-0 hover:bg-blue-600/5 transition-colors group">
                        <td className="px-6 py-6 font-black text-blue-600">#GD-{order.id}</td>
                        <td className="px-6 py-6 uppercase opacity-70 tracking-tighter">{order.ville}</td>
                        <td className="px-6 py-6 font-black text-sm">{order.total_paye}$</td>
                        <td className="px-6 py-6 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${order.statut === 'PAYE' ? 'bg-green-500/10 text-green-600' : 'bg-blue-600/10 text-blue-600'}`}>
                            {order.statut === 'PAYE' ? <CheckCircle size={10}/> : <Clock size={10}/>}
                            {order.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(!data?.orders || data.orders.length === 0) && (
                  <div className="py-20 text-center opacity-20 text-xs font-black uppercase italic tracking-widest">
                     Aucun achat effectué
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}