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

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Estrae lo sconto percentuale dal testo (es. "del 27%", "-32%"). */
function parseDiscount(title: string): number | null {
  const m = title.match(/(\d{1,2})\s*%/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n > 0 && n <= 95 ? n : null;
}

function toNumber(raw: string): number | null {
  const n = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Estrae prezzo attuale e di listino dal testo, in modo conservativo. */
function parsePrices(text: string): { current: number | null; list: number | null } {
  const current =
    text.match(/(?:a soli|a solo|solo|a)\s*€?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*€/i)?.[1] ??
    null;
  const list =
    text.match(/(?:invece di|anzich[eé]|anziche|listino|da)\s*€?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*€/i)?.[1] ??
    null;
  return {
    current: current ? toNumber(current) : null,
    list: list ? toNumber(list) : null,
  };
}

const KNOWN_STORES = [
  'Amazon.it',
  'eBay',
  'MediaWorld',
  'Unieuro',
  'Euronics',
  'AliExpress',
  'Comet',
  'Trony',
];

function detectStore(categories: string[], haystack: string, fallback: string): string {
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
  if (has('casa', 'cucina', 'aspirapolvere', 'pentol', 'arred', 'elettrodomestic')) return 'Casa';
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

const FALLBACK_IMG = 'https://picsum.photos/seed/offerta/400/400';

function mapItem(item: Record<string, unknown>, source: FeedSource): Deal | null {
  const title = decodeEntities(text(item.title));
  const link = text(item.link).trim();
  if (!title || !link) return null;

  const descHtml = text(item.description) + ' ' + text(item['content:encoded']);
  const categories = toArray(item.category).map((c) => decodeEntities(text(c)));
  const guid = text(item.guid) || link;
  const pub = text(item.pubDate);
  const detectedAt = pub ? Date.parse(pub) || Date.now() : Date.now();

  const discountPct = parseDiscount(title);
  const { current, list } = parsePrices(title + ' ' + descHtml);

  return {
    id: guid,
    title,
    url: link,
    imageUrl: firstImage(descHtml) ?? FALLBACK_IMG,
    category: mapCategory(categories, title),
    currentPrice: current,
    listPrice: list,
    discountPct,
    store: detectStore(categories, title, source.defaultStore),
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
