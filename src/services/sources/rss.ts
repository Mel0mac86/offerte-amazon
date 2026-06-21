import { XMLParser } from 'fast-xml-parser';
import { Category, Deal } from '@/types';
import { FeedSource } from '@/services/sources/feeds';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  trimValues: true,
});

/** Estrae il testo da un nodo che può essere stringa, CDATA o oggetto con #text. */
function text(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.__cdata === 'string') return o.__cdata;
    if (typeof o['#text'] === 'string') return o['#text'];
  }
  return String(node);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .trim();
}

/** Rimuove i tag HTML lasciando il testo. */
function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Estrae lo sconto percentuale dal testo (es. "del 27%", "-32%", "fino al 50%"). */
function parseDiscount(textBlob: string): number | null {
  const matches = [...textBlob.matchAll(/(\d{1,2})\s*%/g)]
    .map((m) => parseInt(m[1], 10))
    .filter((n) => n > 0 && n <= 95);
  if (matches.length === 0) return null;
  // Prende lo sconto più alto citato (di solito quello "fino al ...%").
  return Math.max(...matches);
}

function toNumber(raw: string): number | null {
  // Gestisce formati "1.299,99" e "129,99" e "129"
  let s = raw.trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Estrae prezzo attuale e di listino dal testo, in modo conservativo. */
function parsePrices(textBlob: string): { current: number | null; list: number | null } {
  const currentRaw =
    textBlob.match(/(?:a soli|a solo|a soltanto|solo|prezzo[^0-9]{0,12}|a)\s*€?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*€/i)?.[1] ??
    textBlob.match(/€\s*(\d{1,4}(?:[.,]\d{1,2})?)/)?.[1] ??
    null;
  const listRaw =
    textBlob.match(/(?:invece di|anzich[eé]|anziche|listino|valore di|prezzo originale|da)\s*€?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*€/i)?.[1] ??
    null;
  const current = currentRaw ? toNumber(currentRaw) : null;
  const list = listRaw ? toNumber(listRaw) : null;
  // Coerenza: il listino deve essere maggiore del prezzo attuale.
  if (current != null && list != null && list <= current) {
    return { current, list: null };
  }
  return { current, list };
}

// Parole comuni che NON sono codici coupon (evita falsi positivi italiani/inglesi).
const COUPON_STOPWORDS = new Set([
  'ESCLUSIVO',
  'ESCLUSIVI',
  'SCONTO',
  'CODICE',
  'COUPON',
  'OFFERTA',
  'OFFERTE',
  'PROMO',
  'CREDITI',
  'PENSATO',
  'ATTIVI',
  'DISPONIBILI',
  'AMAZON',
  'PRIME',
]);

/**
 * Estrae un codice coupon. Richiede una parola di contesto (codice/coupon/code)
 * seguita da un token "tipo codice": maiuscolo, 4-18 caratteri, con almeno una
 * cifra OPPURE tutto maiuscolo, e non una parola comune.
 */
function parseCoupon(textBlob: string): string | null {
  const re = /(?:codice|coupon|code)\s*(?:sconto|promozionale)?\s*[:\s"'»]+\s*([A-Z0-9][A-Z0-9_-]{3,17})/gi;
  for (const m of textBlob.matchAll(re)) {
    const token = m[1].toUpperCase();
    const hasDigit = /[0-9]/.test(token);
    const allUpperLetters = /^[A-Z0-9_-]+$/.test(m[1]) && m[1] === m[1].toUpperCase();
    if (COUPON_STOPWORDS.has(token)) continue;
    if (hasDigit || (allUpperLetters && token.replace(/[^A-Z]/g, '').length >= 4)) {
      return token;
    }
  }
  return null;
}

const KNOWN_STORES = [
  'Amazon.it',
  'eBay',
  'MediaWorld',
  'Unieuro',
  'Euronics',
  'Comet',
  'Trony',
  'Monclick',
];

function detectStore(categories: string[], haystack: string, fallback: string): string {
  // 1) Alcuni siti mettono il nome del negozio tra le categorie del feed.
  for (const cat of categories) {
    const c = cat.trim().toLowerCase();
    if (c.includes('amazon')) return 'Amazon.it';
    const known = KNOWN_STORES.find((s) => s.toLowerCase() === c);
    if (known) return known;
  }
  // 2) Altrimenti cerca il nome del negozio nel testo.
  const hay = (categories.join(' ') + ' ' + haystack).toLowerCase();
  if (hay.includes('amazon')) return 'Amazon.it';
  for (const s of KNOWN_STORES) {
    if (hay.includes(s.toLowerCase())) return s;
  }
  return fallback;
}

function mapCategory(categories: string[], title: string): Category {
  const hay = (categories.join(' ') + ' ' + title).toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => hay.includes(k));
  if (has('pc', 'informatic', 'monitor', 'ssd', 'notebook', 'portatile', 'router', 'hard disk'))
    return 'Informatica';
  if (has('casa', 'cucina', 'aspirapolvere', 'pentol', 'arred', 'elettrodomestic', 'robot'))
    return 'Casa';
  if (has('gioch', 'console', 'lego', 'playstation', 'xbox', 'nintendo', 'videogioco'))
    return 'Giochi';
  if (has('moda', 'abbigli', 'scarpe', 'orolog', 'zaino')) return 'Moda';
  if (has('sport', 'fitness', 'palestra', 'bici')) return 'Sport';
  if (has('bellezza', 'beauty', 'profumo', 'skincare', 'rasoio')) return 'Bellezza';
  if (has('libr', 'kindle', 'ebook')) return 'Libri';
  return 'Elettronica';
}

function firstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// Link "accorciati" che puntano sempre a un prodotto.
const SHORTENERS = /^https?:\/\/(amzn\.to|amzn\.eu|ebay\.us|geni\.us|fas\.st|bit\.ly)\//i;

function isProductLink(u: string): boolean {
  if (SHORTENERS.test(u)) return true;
  if (/amazon\.[a-z.]+\/(?:[^\s]*\/)?(?:dp|gp\/product|gp\/aw\/d)\/[A-Z0-9]/i.test(u)) return true;
  if (/ebay\.[a-z.]+\/itm\//i.test(u)) return true;
  return false;
}

/** Estrae dal contenuto dell'articolo il primo link diretto al prodotto su un negozio. */
function extractProductUrl(html: string): string | null {
  const urls = html.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
  for (const raw of urls) {
    const u = raw.replace(/&amp;/g, '&').replace(/[).,]+$/, '');
    if (isProductLink(u)) return u;
  }
  return null;
}

const FALLBACK_IMG = 'https://picsum.photos/seed/offerta/400/400';

function mapItem(item: Record<string, unknown>, source: FeedSource): Deal | null {
  const title = decodeEntities(text(item.title));
  const link = text(item.link).trim();
  if (!title || !link) return null;

  // Legge sia la descrizione sia il contenuto completo dell'articolo (content:encoded).
  const descHtml = text(item.description);
  const contentHtml = text(item['content:encoded']);
  const richText = title + ' ' + stripHtml(contentHtml) + ' ' + stripHtml(descHtml);

  const categories = toArray(item.category).map((c) => decodeEntities(text(c)));
  const guid = text(item.guid) || link;
  const pub = text(item.pubDate);
  const detectedAt = pub ? Date.parse(pub) || Date.now() : Date.now();

  const discountPct = parseDiscount(richText);
  const { current, list } = parsePrices(richText);
  const couponCode = parseCoupon(richText);
  const productUrl = extractProductUrl(contentHtml + ' ' + descHtml);

  return {
    id: guid,
    title,
    url: link,
    productUrl,
    imageUrl: firstImage(contentHtml) ?? firstImage(descHtml) ?? FALLBACK_IMG,
    category: mapCategory(categories, title),
    currentPrice: current,
    listPrice: list,
    discountPct,
    store: detectStore(categories, title, source.defaultStore),
    couponCode,
    sourceId: source.id,
    isPriceError: discountPct != null && discountPct >= 70,
    detectedAt,
  };
}

/** Scarica e converte un feed RSS in offerte. In caso di errore ritorna []. */
export async function fetchFeed(source: FeedSource, signal?: AbortSignal): Promise<Deal[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'OfferteAmazon/1.0 (+app RSS reader)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal,
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const json = parser.parse(xml);
    const items = toArray<Record<string, unknown>>(json?.rss?.channel?.item);
    const deals: Deal[] = [];
    for (const it of items.slice(0, 30)) {
      const deal = mapItem(it, source);
      if (deal) deals.push(deal);
    }
    return deals;
  } catch {
    return [];
  }
}
