"use client";
import React from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Phone,
  Mail,
  MapPin,
  Zap,
  ArrowUpRight,
} from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-blue-900 px-6 pt-24 pb-12 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        {/* Colonne 1 : Identité */}
        <div className="space-y-6 md:col-span-1">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 transition-transform duration-500 group-hover:rotate-12">
              <Zap size={20} className="fill-black text-black" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Djephy<span className="text-blue-500">Gold</span>
            </span>
          </Link>
          {/* CORRECTION CI-DESSOUS : Utilisation de &apos; pour l'apostrophe */}
          <p className="text-sm leading-relaxed text-blue-400">
            L&apos;excellence technologique à votre portée. Smartphones,
            ordinateurs et accessoires à Butembo.
          </p>
          <div className="flex space-x-4">
            <Link
              href="#"
              className="rounded-xl bg-white/5 p-2.5 transition-all duration-300 hover:bg-amber-500 hover:text-black"
            >
              <Facebook size={20} />
            </Link>
            <Link
              href="#"
              className="rounded-xl bg-white/5 p-2.5 transition-all duration-300 hover:bg-amber-500 hover:text-black"
            >
              <Instagram size={20} />
            </Link>
          </div>
        </div>

        {/* Colonne 2 : Navigation */}
        <div className="space-y-6">
          <h4 className="text-sm font-black tracking-widest text-blue-500 uppercase">
            Navigation
          </h4>
          <ul className="space-y-4">
            {["Nouveautés", "iPhone", "MacBook", "Accessoires"].map((item) => (
              <li key={item}>
                <Link
                  href="/"
                  className="group flex items-center text-sm text-blue-400 transition-colors hover:text-white"
                >
                  {item}
                  <ArrowUpRight
                    size={14}
                    className="ml-1 text-amber-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 3 : Compte & Support */}
        <div className="space-y-6">
          <h4 className="text-sm font-black tracking-widest text-amber-500 uppercase">
            Services
          </h4>
          <ul className="space-y-4">
            <li>
              <Link
                href="/connexion"
                className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-500"
              >
                Accéder à mon compte
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Suivre ma commande
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Support technique
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Conditions de vente
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 4 : Contact Direct */}
        <div className="space-y-6">
          <h4 className="text-sm font-black tracking-widest text-amber-500 uppercase">
            Contact
          </h4>
          <div className="space-y-4">
            <div className="group flex cursor-pointer items-center gap-3 text-gray-400 transition-colors hover:text-white">
              <div className="rounded-lg bg-white/5 p-2 group-hover:bg-amber-500 group-hover:text-black">
                <Phone size={18} />
              </div>
              <span className="text-sm font-medium">+243 991 098 942</span>
            </div>
            <div className="group flex cursor-pointer items-center gap-3 text-gray-400 transition-colors hover:text-white">
              <div className="rounded-lg bg-white/5 p-2 group-hover:bg-amber-500 group-hover:text-black">
                <Mail size={18} />
              </div>
              <span className="text-sm font-medium italic underline decoration-amber-500/30">
                djephygoldbusiness@gmail.com
              </span>
            </div>
            <div className="group flex cursor-pointer items-start gap-3 text-gray-400 transition-colors hover:text-white">
              <div className="rounded-lg bg-white/5 p-2 group-hover:bg-amber-500 group-hover:text-black">
                <MapPin size={18} />
              </div>
              <span className="text-sm leading-relaxed font-medium">
                Butembo, Nord-Kivu,
                <br /> RD Congo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de Copyright */}
      <div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs tracking-widest text-gray-500 uppercase md:flex-row">
        <div className="flex items-center gap-1 font-medium">
          © {new Date().getFullYear()}{" "}
          <span className="font-bold text-amber-500">Djephy Gold Business</span>
          .
        </div>
        <div className="flex gap-6 font-bold">
          <Link href="#" className="transition-colors hover:text-white">
            Vie privée
          </Link>
          <Link href="#" className="transition-colors hover:text-white">
            Mentions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
