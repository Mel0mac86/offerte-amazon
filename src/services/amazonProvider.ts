import Constants from 'expo-constants';
import { Deal, DealFilters, discountPercent } from '@/types';
import { MOCK_DEALS } from '@/data/mockDeals';

/**
 * Livello dati intercambiabile.
 *
 * Oggi non esiste una fonte Amazon GRATUITA, legale e in tempo reale per gli
 * "errori di prezzo". Per questo l'app usa un provider DEMO con dati realistici
 * di Amazon.it, ma è già pronta a collegare la PA-API ufficiale (gratuita con
 * un account Affiliato Amazon approvato): basta inserire le chiavi in app.json
 * sotto "extra" e implementare PaapiProvider.fetchDeals().
 *
 * Per cambiare provider modifica `activeProvider` in fondo al file.
 */
export interface AmazonProvider {
  readonly id: string;
  fetchDeals(filters: DealFilters): Promise<Deal[]>;
  /** Restituisce il prezzo attuale di un prodotto (per la watchlist) */
  fetchPrice(dealId: string): Promise<number | null>;
}

function applyFilters(deals: Deal[], filters: DealFilters): Deal[] {
  const q = filters.query.trim().toLowerCase();
  return deals
    .filter((d) => {
      if (filters.category !== 'Tutte' && d.category !== filters.category) return false;
      if (filters.onlyPriceErrors && !d.isPriceError) return false;
      if (filters.maxPrice != null && d.currentPrice > filters.maxPrice) return false;
      if (discountPercent(d) < filters.minDiscount) return false;
      if (q && !d.title.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => b.detectedAt - a.detectedAt);
}

/** Provider DEMO: usa i dati mock e simula piccole variazioni di prezzo. */
class MockProvider implements AmazonProvider {
  readonly id = 'mock';

  async fetchDeals(filters: DealFilters): Promise<Deal[]> {
    // Simula latenza di rete
    await new Promise((r) => setTimeout(r, 350));
    // Simula una leggera fluttuazione casuale dei prezzi a ogni refresh,
    // così la watchlist e le notifiche di calo prezzo sono testabili.
    const jittered = MOCK_DEALS.map((d) => {
      const drift = 1 + (Math.random() - 0.6) * 0.06; // tende leggermente al ribasso
      const newPrice = Math.max(1, Math.round(d.currentPrice * drift * 100) / 100);
      return { ...d, currentPrice: Math.min(newPrice, d.listPrice) };
    });
    return applyFilters(jittered, filters);
  }

  async fetchPrice(dealId: string): Promise<number | null> {
    const base = MOCK_DEALS.find((d) => d.id === dealId);
    if (!base) return null;
    const drift = 1 + (Math.random() - 0.6) * 0.08;
    return Math.max(1, Math.round(base.currentPrice * drift * 100) / 100);
  }
}

/**
 * Stub per la PA-API ufficiale di Amazon (gratuita con account Affiliato).
 * Quando avrai le chiavi, inseriscile in app.json -> expo.extra e completa
 * la firma AWS V4 + le chiamate a /paapi5/getitems e SearchItems.
 * Doc: https://webservices.amazon.com/paapi5/documentation/
 */
class PaapiProvider implements AmazonProvider {
  readonly id = 'paapi';
  constructor(
    private accessKey: string,
    private secretKey: string,
    private partnerTag: string,
  ) {}

  async fetchDeals(_filters: DealFilters): Promise<Deal[]> {
    throw new Error(
      'PA-API non ancora implementata. Inserisci le chiavi in app.json e completa PaapiProvider.',
    );
  }

  async fetchPrice(_dealId: string): Promise<number | null> {
    throw new Error('PA-API non ancora implementata.');
  }
}

function buildProvider(): AmazonProvider {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    paapiAccessKey?: string;
    paapiSecretKey?: string;
    amazonAffiliateTag?: string;
  };
  if (extra.paapiAccessKey && extra.paapiSecretKey && extra.amazonAffiliateTag) {
    return new PaapiProvider(extra.paapiAccessKey, extra.paapiSecretKey, extra.amazonAffiliateTag);
  }
  return new MockProvider();
}

export const activeProvider: AmazonProvider = buildProvider();

/** Aggiunge il tag affiliato all'URL se configurato (così è gratis e legale). */
export function withAffiliateTag(url: string): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { amazonAffiliateTag?: string };
  const tag = extra.amazonAffiliateTag;
  if (!tag) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}tag=${encodeURIComponent(tag)}`;
}
