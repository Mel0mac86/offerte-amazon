// Fonti di offerte basate su feed RSS pubblici (gratuiti, legali, senza affiliazione).
// I feed sono pensati per la sindacazione: li leggiamo e li mostriamo come elenco di
// offerte con link al negozio. Aggiungere un negozio = aggiungere un feed qui sotto
// (oppure dall'app, in Impostazioni → Fonti offerte → Aggiungi feed).

export interface FeedSource {
  id: string;
  /** Nome mostrato all'utente */
  name: string;
  /** URL del feed RSS */
  url: string;
  /** Negozio prevalente del feed (usato se non rilevabile dal singolo item) */
  defaultStore: string;
  /** True se aggiunto dall'utente (rimovibile) */
  custom?: boolean;
}

export const DEFAULT_FEEDS: FeedSource[] = [
  {
    id: 'smartworld',
    name: 'SmartWorld — Offerte',
    url: 'https://www.smartworld.it/offerte/feed',
    defaultStore: 'Amazon.it',
  },
  {
    id: 'tuttoandroid',
    name: 'TuttoAndroid — Offerte',
    url: 'https://www.tuttoandroid.net/offerte/feed/',
    defaultStore: 'Amazon.it',
  },
  {
    id: 'gizchina',
    name: 'GizChina.it — Offerte e Coupon',
    url: 'https://www.gizchina.it/category/offerte/feed/',
    defaultStore: 'Vari negozi',
  },
];

// Stato runtime (impostato dall'app all'avvio in base alle preferenze salvate).
let customFeeds: FeedSource[] = [];
let enabledIds: string[] = DEFAULT_FEEDS.map((f) => f.id);

export function setCustomFeeds(list: FeedSource[]): void {
  customFeeds = list;
}

export function getCustomFeeds(): FeedSource[] {
  return customFeeds;
}

/** Tutte le fonti note: predefinite + personalizzate. */
export function getAllSources(): FeedSource[] {
  return [...DEFAULT_FEEDS, ...customFeeds];
}

export function setEnabledFeedIds(ids: string[]): void {
  enabledIds = ids;
}

export function getEnabledFeedIds(): string[] {
  return enabledIds;
}

/** Le fonti attualmente attive da interrogare. */
export function getEnabledFeeds(): FeedSource[] {
  return getAllSources().filter((f) => enabledIds.includes(f.id));
}
