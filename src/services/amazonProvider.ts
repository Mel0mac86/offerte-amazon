import Constants from 'expo-constants';
import { Deal, DealFilters } from '@/types';
import { MOCK_DEALS } from '@/data/mockDeals';
import { applyFilters } from '@/services/filter';
import { DealsProvider, FeedProvider } from '@/services/feedProvider';

/**
 * Selezione della fonte dati.
 *
 * Di default l'app usa i FEED RSS pubblici (gratis, legali, senza affiliazione)
 * tramite FeedProvider — vedi src/services/sources/. È inoltre predisposta a usare
 * la PA-API ufficiale di Amazon: basta inserire le chiavi in app.json -> extra.
 */
export type { DealsProvider } from '@/services/feedProvider';

/** Provider DEMO: dati mock con piccole variazioni di prezzo (utile offline/test). */
export class MockProvider implements DealsProvider {
  readonly id = 'mock';

  async fetchDeals(filters: DealFilters): Promise<Deal[]> {
    await new Promise((r) => setTimeout(r, 250));
    const jittered = MOCK_DEALS.map((d) => {
      if (d.currentPrice == null) return d;
      const drift = 1 + (Math.random() - 0.6) * 0.06;
      const newPrice = Math.max(1, Math.round(d.currentPrice * drift * 100) / 100);
      const capped = d.listPrice != null ? Math.min(newPrice, d.listPrice) : newPrice;
      return { ...d, currentPrice: capped };
    });
    return applyFilters(jittered, filters);
  }

  async fetchPrice(dealId: string): Promise<number | null> {
    const base = MOCK_DEALS.find((d) => d.id === dealId);
    if (!base || base.currentPrice == null) return null;
    const drift = 1 + (Math.random() - 0.6) * 0.08;
    return Math.max(1, Math.round(base.currentPrice * drift * 100) / 100);
  }
}

/**
 * Stub per la PA-API ufficiale (gratuita con account Affiliato approvato).
 * Implementare la firma AWS V4 + le chiamate SearchItems/GetItems.
 * Doc: https://webservices.amazon.com/paapi5/documentation/
 */
class PaapiProvider implements DealsProvider {
  readonly id = 'paapi';
  constructor(
    private accessKey: string,
    private secretKey: string,
    private partnerTag: string,
  ) {}

  async fetchDeals(): Promise<Deal[]> {
    throw new Error('PA-API non ancora implementata. Inserisci le chiavi in app.json.');
  }

  async fetchPrice(): Promise<number | null> {
    throw new Error('PA-API non ancora implementata.');
  }
}

function buildProvider(): DealsProvider {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    paapiAccessKey?: string;
    paapiSecretKey?: string;
    amazonAffiliateTag?: string;
  };
  if (extra.paapiAccessKey && extra.paapiSecretKey && extra.amazonAffiliateTag) {
    return new PaapiProvider(extra.paapiAccessKey, extra.paapiSecretKey, extra.amazonAffiliateTag);
  }
  return new FeedProvider();
}

export const activeProvider: DealsProvider = buildProvider();

/** Aggiunge il tag affiliato all'URL Amazon se configurato. */
export function withAffiliateTag(url: string): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { amazonAffiliateTag?: string };
  const tag = extra.amazonAffiliateTag;
  if (!tag || !/amazon\./i.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}tag=${encodeURIComponent(tag)}`;
}
