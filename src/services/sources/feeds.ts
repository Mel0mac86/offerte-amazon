// Fonti di offerte basate su feed RSS pubblici (gratuiti, legali, senza affiliazione).
// I feed sono pensati per la sindacazione: li leggiamo e li mostriamo come elenco di
// offerte con link al negozio. Aggiungere un negozio = aggiungere un feed qui sotto.

export interface FeedSource {
  id: string;
  /** Nome mostrato all'utente */
  name: string;
  /** URL del feed RSS */
  url: string;
  /** Negozio prevalente del feed (usato se non rilevabile dal singolo item) */
  defaultStore: string;
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
    name: 'GizChina.it — Offerte',
    url: 'https://www.gizchina.it/category/offerte/feed/',
    defaultStore: 'Vari negozi',
  },
];

// Stato delle fonti attive (impostato dall'app all'avvio in base alle preferenze salvate).
let enabledIds: string[] = DEFAULT_FEEDS.map((f) => f.id);

export function setEnabledFeedIds(ids: string[]): void {
  enabledIds = ids;
}

export function getEnabledFeedIds(): string[] {
  return enabledIds;
}

export function getEnabledFeeds(): FeedSource[] {
  return DEFAULT_FEEDS.filter((f) => enabledIds.includes(f.id));
}
