import { Deal, DealFilters } from '@/types';
import { applyFilters, dedupeDeals } from '@/services/filter';
import { getEnabledFeeds } from '@/services/sources/feeds';
import { fetchFeed } from '@/services/sources/rss';
import { MOCK_DEALS } from '@/data/mockDeals';

export interface DealsProvider {
  readonly id: string;
  fetchDeals(filters: DealFilters): Promise<Deal[]>;
  fetchPrice(dealId: string): Promise<number | null>;
}

/**
 * Provider che aggrega più feed RSS pubblici (gratis, senza affiliazione).
 * Se tutte le fonti falliscono (offline o feed irraggiungibili) ripiega sui
 * dati demo, così l'app non resta mai vuota.
 */
export class FeedProvider implements DealsProvider {
  readonly id = 'feed';
  private cache: Deal[] = [];

  async fetchDeals(filters: DealFilters): Promise<Deal[]> {
    const feeds = getEnabledFeeds();
    let merged: Deal[] = [];

    if (feeds.length > 0) {
      const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f)));
      for (const r of results) {
        if (r.status === 'fulfilled') merged.push(...r.value);
      }
      merged = dedupeDeals(merged).sort((a, b) => b.detectedAt - a.detectedAt);
    }

    if (merged.length === 0) {
      // Nessun dato dai feed: usa la demo per non lasciare la schermata vuota.
      merged = MOCK_DEALS;
    }

    this.cache = merged;
    return applyFilters(merged, filters);
  }

  /** I feed non espongono il prezzo puntuale: ritorna quello noto in cache se presente. */
  async fetchPrice(dealId: string): Promise<number | null> {
    const found = this.cache.find((d) => d.id === dealId);
    return found?.currentPrice ?? null;
  }
}
