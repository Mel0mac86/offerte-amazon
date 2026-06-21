import { PricePoint, WatchItem } from '@/types';

/** Numero massimo di punti conservati per prodotto. */
export const MAX_POINTS = 60;

/** Intervallo minimo (ms) tra due rilevazioni con lo stesso prezzo. */
const MIN_GAP_MS = 1000 * 60 * 30; // 30 minuti

/**
 * Aggiunge un punto allo storico evitando duplicati ravvicinati e limitando
 * la lunghezza. Ritorna lo storico (nuovo array se modificato).
 */
export function appendPoint(history: PricePoint[], price: number, now = Date.now()): PricePoint[] {
  const last = history[history.length - 1];
  if (last && last.price === price && now - last.t < MIN_GAP_MS) {
    return history;
  }
  return [...history, { t: now, price }].slice(-MAX_POINTS);
}

/** Crea uno storico iniziale plausibile dal prezzo di listino a quello attuale. */
export function seedHistory(
  currentPrice: number | null,
  listPrice: number | null,
  now = Date.now(),
): PricePoint[] {
  if (currentPrice == null) return [];
  const day = 1000 * 60 * 60 * 24;
  if (listPrice != null && listPrice > currentPrice) {
    const mid = Math.round(((currentPrice + listPrice) / 2) * 100) / 100;
    return [
      { t: now - day * 6, price: listPrice },
      { t: now - day * 3, price: mid },
      { t: now, price: currentPrice },
    ];
  }
  return [{ t: now, price: currentPrice }];
}

export interface HistoryStats {
  min: number;
  max: number;
  current: number;
  /** Variazione % rispetto al primo punto registrato (negativa = calo). */
  changePct: number;
}

export function historyStats(history: PricePoint[]): HistoryStats | null {
  if (history.length === 0) return null;
  const prices = history.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const first = prices[0];
  const current = prices[prices.length - 1];
  const changePct = first > 0 ? Math.round((current / first - 1) * 100) : 0;
  return { min, max, current, changePct };
}

/**
 * Registra il prezzo corrente nei prodotti seguiti.
 * `priceFor(dealId)` restituisce il prezzo noto (o null).
 * Ritorna una nuova watchlist se almeno un punto è stato aggiunto, altrimenti la stessa.
 */
export function recordPrices(
  watchlist: WatchItem[],
  priceFor: (dealId: string) => number | null | undefined,
  now = Date.now(),
): WatchItem[] {
  let changed = false;
  const next = watchlist.map((item) => {
    const price = priceFor(item.dealId);
    if (price == null) return item;
    const history = appendPoint(item.history ?? [], price, now);
    if (history === item.history) return item;
    changed = true;
    return { ...item, history };
  });
  return changed ? next : watchlist;
}
