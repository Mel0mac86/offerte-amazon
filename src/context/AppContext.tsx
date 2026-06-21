import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  DEFAULT_FILTERS,
  DEFAULT_SETTINGS,
  Deal,
  DealFilters,
  WatchItem,
} from '@/types';
import { storage } from '@/services/storage';
import { activeProvider } from '@/services/amazonProvider';
import {
  requestNotificationPermission,
  sendTestNotification,
} from '@/services/notifications';
import {
  registerBackgroundCheck,
  unregisterBackgroundCheck,
} from '@/services/dealMonitor';
import { recordPrices, seedHistory } from '@/services/priceHistory';

interface AppState {
  loading: boolean;
  deals: Deal[];
  filters: DealFilters;
  settings: AppSettings;
  watchlist: WatchItem[];
  refreshDeals: () => Promise<void>;
  setFilters: (f: DealFilters) => void;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  toggleWatch: (deal: Deal) => void;
  isWatched: (dealId: string) => boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filters, setFiltersState] = useState<DealFilters>(DEFAULT_FILTERS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  // Registra i prezzi correnti nello storico dei prodotti seguiti.
  const recordWatchPrices = useCallback((data: Deal[]) => {
    setWatchlist((prev) => {
      const priceMap = new Map(data.map((d) => [d.id, d.currentPrice] as const));
      const next = recordPrices(prev, (id) => priceMap.get(id));
      if (next !== prev) storage.saveWatchlist(next);
      return next;
    });
  }, []);

  const refreshDeals = useCallback(async () => {
    const data = await activeProvider.fetchDeals(filters);
    setDeals(data);
    recordWatchPrices(data);
  }, [filters, recordWatchPrices]);

  // Caricamento iniziale da storage
  useEffect(() => {
    (async () => {
      const [s, f, w] = await Promise.all([
        storage.getSettings(),
        storage.getFilters(),
        storage.getWatchlist(),
      ]);
      setSettings(s);
      setFiltersState(f);
      // Normalizza i preferiti salvati prima dell'introduzione dello storico.
      setWatchlist(
        w.map((item) => ({
          ...item,
          history: item.history?.length ? item.history : seedHistory(item.priceWhenAdded, item.priceWhenAdded),
        })),
      );
      setLoading(false);
    })();
  }, []);

  // Ricarica le offerte quando cambiano i filtri
  useEffect(() => {
    if (loading) return;
    let active = true;
    (async () => {
      const data = await activeProvider.fetchDeals(filters);
      if (active) {
        setDeals(data);
        recordWatchPrices(data);
      }
    })();
    storage.saveFilters(filters);
    return () => {
      active = false;
    };
  }, [filters, loading, recordWatchPrices]);

  const setFilters = useCallback((f: DealFilters) => setFiltersState(f), []);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        storage.saveSettings(next);
        return next;
      });
    },
    [],
  );

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          await updateSettings({ notificationsEnabled: false });
          return false;
        }
        await updateSettings({ notificationsEnabled: true });
        await registerBackgroundCheck();
        await sendTestNotification();
        return true;
      } else {
        await updateSettings({ notificationsEnabled: false });
        await unregisterBackgroundCheck();
        return true;
      }
    },
    [updateSettings],
  );

  const toggleWatch = useCallback((deal: Deal) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.dealId === deal.id);
      const next = exists
        ? prev.filter((w) => w.dealId !== deal.id)
        : [
            {
              dealId: deal.id,
              title: deal.title,
              imageUrl: deal.imageUrl,
              url: deal.url,
              priceWhenAdded: deal.currentPrice,
              addedAt: Date.now(),
              history: seedHistory(deal.currentPrice, deal.listPrice),
            },
            ...prev,
          ];
      storage.saveWatchlist(next);
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (dealId: string) => watchlist.some((w) => w.dealId === dealId),
    [watchlist],
  );

  const value = useMemo<AppState>(
    () => ({
      loading,
      deals,
      filters,
      settings,
      watchlist,
      refreshDeals,
      setFilters,
      updateSettings,
      setNotificationsEnabled,
      toggleWatch,
      isWatched,
    }),
    [
      loading,
      deals,
      filters,
      settings,
      watchlist,
      refreshDeals,
      setFilters,
      updateSettings,
      setNotificationsEnabled,
      toggleWatch,
      isWatched,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve essere usato dentro <AppProvider>');
  return ctx;
}
