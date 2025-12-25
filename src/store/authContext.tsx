"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- CORRECTION DU TYPE ---
// On ajoute 'username' et 'nom' pour que TypeScript accepte ces clés partout
type User = {
  name?: string;
  nom?: string;
  username?: string; // Ajouté ici
  email?: string;
} | null;

// Définition des fonctions disponibles dans le context
interface AuthContextType {
  user: User;
  // On met à jour ici aussi pour accepter n'importe quelle structure de User
  login: (userData: User) => void; 
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('djephy_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Erreur de lecture du profil utilisateur", error);
      }
    }
    setIsLoading(false);
  }, []);

  // Fonction pour connecter l'utilisateur
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('djephy_user', JSON.stringify(userData));
  };

  // Fonction pour déconnecter l'utilisateur
  const logout = () => {
    setUser(null);
    localStorage.removeItem('djephy_user');
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