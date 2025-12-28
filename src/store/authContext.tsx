"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- TYPE USER ---
// On centralise la structure pour éviter les répétitions
type User = {
  id?: number | string; 
  name?: string;
  nom?: string;
  username?: string;
  email?: string;
} | null;

interface AuthContextType {
  user: User;
  // Utilisation de 'User' au lieu de 'any' pour la fonction login
  login: (userData: NonNullable<User>) => void; 
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setUser(parsed);
      } catch (error) {
        // Optionnel : renommer 'error' en '_error' si ESLint râle sur la variable inutilisée
        console.error("Erreur de lecture du profil utilisateur", error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Fonction pour connecter l'utilisateur
  const login = (userData: NonNullable<User>) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Fonction pour déconnecter l'utilisateur
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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