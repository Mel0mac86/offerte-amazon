import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS, DealFilters, DEFAULT_FILTERS, WatchItem } from '@/types';
import { FeedSource } from '@/services/sources/feeds';

const KEYS = {
  settings: '@offerte/settings',
  watchlist: '@offerte/watchlist',
  filters: '@offerte/filters',
  seenDealIds: '@offerte/seenDealIds',
  enabledSources: '@offerte/enabledSources',
  customFeeds: '@offerte/customFeeds',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort: lo storage può fallire in casi limite
  }
}

export const storage = {
  getSettings: () => readJson<AppSettings>(KEYS.settings, DEFAULT_SETTINGS),
  saveSettings: (s: AppSettings) => writeJson(KEYS.settings, s),

  getFilters: () => readJson<DealFilters>(KEYS.filters, DEFAULT_FILTERS),
  saveFilters: (f: DealFilters) => writeJson(KEYS.filters, f),

  async getWatchlist(): Promise<WatchItem[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.watchlist);
      return raw ? (JSON.parse(raw) as WatchItem[]) : [];
    } catch {
      return [];
    }
  },
  saveWatchlist: (items: WatchItem[]) => writeJson(KEYS.watchlist, items),

  async getSeenDealIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.seenDealIds);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },
  saveSeenDealIds: (ids: string[]) => writeJson(KEYS.seenDealIds, ids),

  async getEnabledSourceIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.enabledSources);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },
  saveEnabledSourceIds: (ids: string[]) => writeJson(KEYS.enabledSources, ids),

  async getCustomFeeds(): Promise<FeedSource[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.customFeeds);
      return raw ? (JSON.parse(raw) as FeedSource[]) : [];
    } catch {
      return [];
    }
  },
  saveCustomFeeds: (feeds: FeedSource[]) => writeJson(KEYS.customFeeds, feeds),
};
