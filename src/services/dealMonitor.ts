import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { activeProvider } from '@/services/amazonProvider';
import { storage } from '@/services/storage';
import { sendLocalNotification } from '@/services/notifications';
import { DEFAULT_FILTERS, discountPercent } from '@/types';
import { formatEuro } from '@/utils/format';

export const DEAL_CHECK_TASK = 'offerte-amazon-deal-check';

/**
 * Logica di controllo eseguita sia in background sia "manualmente" dalla UI.
 * Confronta le offerte con le impostazioni di notifica e avvisa per:
 *  - nuove offerte sopra la soglia di sconto
 *  - possibili errori di prezzo
 *  - cali di prezzo sui prodotti in watchlist
 */
export async function runDealCheck(): Promise<number> {
  const settings = await storage.getSettings();
  if (!settings.notificationsEnabled) return 0;

  let notificationsSent = 0;

  const deals = await activeProvider.fetchDeals(DEFAULT_FILTERS);
  const seen = new Set(await storage.getSeenDealIds());
  const newlySeen: string[] = [];

  for (const deal of deals) {
    if (seen.has(deal.id)) continue;
    const discount = discountPercent(deal);

    const isStrongDeal = discount >= settings.notifyDiscountThreshold;
    const isError = settings.notifyPriceErrors && deal.isPriceError;

    if (isError) {
      await sendLocalNotification(
        '⚠️ Possibile errore di prezzo!',
        `${deal.title} a ${formatEuro(deal.currentPrice)} (-${discount}%)`,
        { url: deal.url },
      );
      notificationsSent++;
      newlySeen.push(deal.id);
    } else if (isStrongDeal) {
      await sendLocalNotification(
        `🔥 Offerta -${discount}%`,
        `${deal.title} a ${formatEuro(deal.currentPrice)}`,
        { url: deal.url },
      );
      notificationsSent++;
      newlySeen.push(deal.id);
    }
  }

  // Aggiorna l'elenco "già viste" (limita la dimensione)
  if (newlySeen.length > 0) {
    const merged = [...newlySeen, ...seen].slice(0, 500);
    await storage.saveSeenDealIds(merged);
  }

  // Controllo cali di prezzo sulla watchlist
  if (settings.notifyWatchlistDrops) {
    const watchlist = await storage.getWatchlist();
    for (const item of watchlist) {
      const price = await activeProvider.fetchPrice(item.dealId);
      if (price != null && price < item.priceWhenAdded) {
        const drop = Math.round((1 - price / item.priceWhenAdded) * 100);
        if (drop >= 5) {
          await sendLocalNotification(
            '📉 Prezzo in calo su un preferito',
            `${item.title}: ${formatEuro(price)} (-${drop}% da quando l'hai salvato)`,
            { url: item.url },
          );
          notificationsSent++;
        }
      }
    }
  }

  return notificationsSent;
}

// Definizione del task di background (eseguito dal sistema operativo).
TaskManager.defineTask(DEAL_CHECK_TASK, async () => {
  try {
    const count = await runDealCheck();
    return count > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registra il controllo periodico in background.
 * NB: su iOS l'intervallo è gestito dal sistema (minimo ~15 min, non garantito).
 */
export async function registerBackgroundCheck(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }
    await BackgroundFetch.registerTaskAsync(DEAL_CHECK_TASK, {
      minimumInterval: 60 * 15, // 15 minuti
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Non supportato (es. Expo Go su alcune piattaforme): si usa il check manuale.
  }
}

export async function unregisterBackgroundCheck(): Promise<void> {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(DEAL_CHECK_TASK);
    if (registered) {
      await BackgroundFetch.unregisterTaskAsync(DEAL_CHECK_TASK);
    }
  } catch {
    // ignora
  }
}
