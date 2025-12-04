export interface Product {
  id: string;
  reference: string;
  name: string;
  applications: string[];
  position: 'Delantera' | 'Trasera';
  image: string;
  rating: number;
  specs: {
    width: string;
    height: string;
    fmsi: string;
    brand: string;
  };
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  date: string;
  type: 'search' | 'product';
  saved: boolean;
}

export interface FavoriteList {
  id: string;
  name: string;
  itemCount: number;
  items: Product[];
  color?: string; // For the dot indicator
}
