import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

// Mostra le notifiche anche con app in primo piano (solo su nativo).
if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Richiede il permesso per le notifiche. Ritorna true se concesso. */
export async function requestNotificationPermission(): Promise<boolean> {
  // Nel browser/PWA le notifiche locali non sono supportate in modo affidabile.
  if (!isNative) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Offerte',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9900',
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

/** Invia subito una notifica locale. */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!isNative) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: true },
    trigger: null, // immediata
  });
}

/** Notifica di prova per far verificare all'utente che il toggle funziona. */
export async function sendTestNotification(): Promise<void> {
  await sendLocalNotification(
    '🔔 Notifiche attive',
    'Riceverai un avviso quando trovo offerte forti o possibili errori di prezzo su Amazon.it.',
  );
}
