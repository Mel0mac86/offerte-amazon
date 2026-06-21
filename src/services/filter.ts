import { Deal, DealFilters, discountPercent } from '@/types';

/** Applica i filtri utente a una lista di offerte e ordina dalla più recente. */
export function applyFilters(deals: Deal[], filters: DealFilters): Deal[] {
  const q = filters.query.trim().toLowerCase();
  return deals
    .filter((d) => {
      if (filters.category !== 'Tutte' && d.category !== filters.category) return false;
      if (filters.onlyPriceErrors && !d.isPriceError) return false;
      if (filters.onlyCoupons && !d.couponCode) return false;
      if (filters.maxPrice != null) {
        // Senza prezzo noto non possiamo garantire il limite: escludiamo.
        if (d.currentPrice == null || d.currentPrice > filters.maxPrice) return false;
      }
      if (filters.minDiscount > 0) {
        const disc = discountPercent(d);
        if (disc == null || disc < filters.minDiscount) return false;
      }
      if (q && !d.title.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => b.detectedAt - a.detectedAt);
}

/** Rimuove i duplicati per URL/id mantenendo il primo (più recente dopo l'ordinamento). */
export function dedupeDeals(deals: Deal[]): Deal[] {
  const seen = new Set<string>();
  const out: Deal[] = [];
  for (const d of deals) {
    const key = d.url || d.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}
