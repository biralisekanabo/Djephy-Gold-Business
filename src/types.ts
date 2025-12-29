export interface Produit {
  id: number | string;
  nom: string;
  prix: number;
  img: string; 
  cat: "PC" | "Phone" | "Watch" | "Radio";
  stock: number;
  tag?: string;
  specs?: {
    ecran: string;
    batterie: string;
    stockage: string;
  };
}

export interface CartItem extends Produit {
  quantity: number;
}

export interface User {
  id?: number | string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | string;
}
