import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// CORRECTION DES IMPORTS : On importe chaque provider depuis son propre fichier
import { AuthProvider } from '@/src/store/authContext';
import { CartProvider } from '@/src/store/cartContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Djephy Gold Business | Smartphones & Ordinateurs",
  description: "Vente d'accessoires téléphoniques, téléphones et ordinateurs premium.",
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-white text-slate-900 dark:bg-[#020617] dark:text-slate-100 min-h-screen flex flex-col selection:bg-blue-500/30`}>
        
        {/* Arrière-plan stylisé fixe */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-[#020617] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.3)_0%,rgba(2,6,23,1)_70%)]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        {/* CORRECTION : Ajout de AuthProvider. 
            L'ordre recommandé est d'envelopper le Cart par l'Auth.
        */}
        <AuthProvider>
          <CartProvider>
            <Navbar />

            {/* Le 'flex-grow' assure que le Footer reste en bas */}
            <main className="flex-grow relative">
              {children}
            </main>

            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}