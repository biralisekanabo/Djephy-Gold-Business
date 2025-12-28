"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- TYPE USER CORRIGÉ ---
// On ajoute 'id' car il est indispensable pour vos requêtes SQL (dashboard.php?user_id=...)
type User = {
  id?: number | string; 
  name?: string;
  nom?: string;
  username?: string;
  email?: string;
} | null;

interface AuthContextType {
  user: User;
  login: (userData: any) => void; // 'any' ici permet d'accepter l'objet venant de votre API login.php
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    // Utilisation de la clé 'user' pour être raccord avec votre Dashboard
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (error) {
        console.error("Erreur de lecture du profil utilisateur", error);
        localStorage.removeItem('user'); // Nettoyage si le JSON est corrompu
      }
    }
    setIsLoading(false);
  }, []);

  // Fonction pour connecter l'utilisateur
  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Fonction pour déconnecter l'utilisateur
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Note: La redirection est gérée par la Navbar comme convenu
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};