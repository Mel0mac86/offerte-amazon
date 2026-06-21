// Tipi condivisi dell'app Offerte Amazon.

export type Category =
  | 'Tutte'
  | 'Elettronica'
  | 'Informatica'
  | 'Casa'
  | 'Giochi'
  | 'Moda'
  | 'Sport'
  | 'Bellezza'
  | 'Libri';

export interface Deal {
  /** ASIN o id univoco del prodotto/offerta */
  id: string;
  title: string;
  category: Category;
  imageUrl: string;
  /** Prezzo attuale in euro (null se non rilevabile dalla fonte) */
  currentPrice: number | null;
  /** Prezzo di listino/precedente in euro (null se sconosciuto) */
  listPrice: number | null;
  /** Sconto % dichiarato dalla fonte, quando non ricavabile dai prezzi */
  discountPct: number | null;
  /** URL del prodotto/offerta */
  url: string;
  /** Negozio (es. Amazon.it, eBay, MediaWorld) */
  store: string;
  /** Id della fonte/feed da cui proviene l'offerta */
  sourceId: string;
  /** True se l'algoritmo lo considera un possibile errore di prezzo */
  isPriceError: boolean;
  /** Timestamp (ms) di quando l'offerta è stata rilevata */
  detectedAt: number;
}

export interface DealFilters {
  category: Category;
  /** Sconto minimo in percentuale (0-100) */
  minDiscount: number;
  /** Prezzo massimo in euro (null = nessun limite) */
  maxPrice: number | null;
  /** Mostra solo i possibili errori di prezzo */
  onlyPriceErrors: boolean;
  /** Ricerca testuale sul titolo */
  query: string;
}

/** Punto dello storico prezzi: timestamp (ms) e prezzo in euro. */
export interface PricePoint {
  t: number;
  price: number;
}

export interface WatchItem {
  dealId: string;
  title: string;
  imageUrl: string;
  url: string;
  /** Prezzo registrato quando il prodotto è stato aggiunto ai preferiti (null se sconosciuto) */
  priceWhenAdded: number | null;
  store: string;
  addedAt: number;
  /** Storico dei prezzi rilevati nel tempo (ordinato dal più vecchio al più recente) */
  history: PricePoint[];
}

export interface AppSettings {
  notificationsEnabled: boolean;
  /** Notifica per nuove offerte sopra questa soglia di sconto (%) */
  notifyDiscountThreshold: number;
  /** Notifica per i possibili errori di prezzo */
  notifyPriceErrors: boolean;
  /** Notifica quando un prodotto in watchlist cala di prezzo */
  notifyWatchlistDrops: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  notifyDiscountThreshold: 50,
  notifyPriceErrors: true,
  notifyWatchlistDrops: true,
};

export const DEFAULT_FILTERS: DealFilters = {
  category: 'Tutte',
  minDiscount: 0,
  maxPrice: null,
  onlyPriceErrors: false,
  query: '',
};

export const CATEGORIES: Category[] = [
  'Tutte',
  'Elettronica',
  'Informatica',
  'Casa',
  'Giochi',
  'Moda',
  'Sport',
  'Bellezza',
  'Libri',
];

export function discountPercent(
  deal: Pick<Deal, 'currentPrice' | 'listPrice' | 'discountPct'>,
): number | null {
  if (deal.discountPct != null) return deal.discountPct;
  if (
    deal.listPrice != null &&
    deal.currentPrice != null &&
    deal.listPrice > 0 &&
    deal.listPrice > deal.currentPrice
  ) {
    return Math.round((1 - deal.currentPrice / deal.listPrice) * 100);
  }
  return null;
}
