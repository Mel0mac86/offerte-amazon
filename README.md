# Offerte Amazon 📱🏷️

App iPhone (React Native + Expo) per trovare **offerte** e possibili **errori di prezzo** su **Amazon.it**, con **notifiche attivabili/disattivabili**, filtri per categoria/sconto e una **watchlist** dei preferiti.

> ⚠️ **Nota importante sui dati.** Non esiste una fonte Amazon *gratuita, legale e in tempo reale* per gli errori di prezzo. Per questo l'app parte con dati **demo realistici** di Amazon.it tramite un *provider* intercambiabile, ed è già predisposta per collegare gratuitamente la **PA-API ufficiale** (account Affiliato Amazon). Vedi più sotto.

## Come provarla sull'iPhone (in 5 minuti)

1. Installa **Node.js 18+** sul computer.
2. Sul tuo iPhone installa l'app gratuita **Expo Go** dall'App Store.
3. Nella cartella del progetto:
   ```bash
   npm install
   npx expo start
   ```
4. Inquadra il **QR code** che appare nel terminale con la fotocamera dell'iPhone → si apre in Expo Go.
5. Vai su **Impostazioni → Attiva notifiche**: concedi il permesso e riceverai una notifica di prova.

> Le notifiche push **in background** funzionano al meglio in una build di sviluppo/produzione (`npx expo run:ios` o EAS Build). In **Expo Go** le notifiche locali e il pulsante "Controlla offerte adesso" funzionano comunque.

## Funzionalità

- 🏷️ **Offerte**: elenco con sconto %, prezzo barrato, badge "ERRORE PREZZO?", pull-to-refresh.
- 🔎 **Filtri**: ricerca testo, categoria, sconto minimo, solo errori di prezzo.
- ★ **Preferiti/Watchlist**: segui un prodotto e ricevi un avviso quando il prezzo cala.
- 📈 **Storico prezzi**: mini grafico per ogni preferito con prezzo minimo/attuale/massimo (il minimo è evidenziato in verde).
- 🔔 **Notifiche locali on/off**: soglia di sconto configurabile, avvisi per errori di prezzo e cali dei preferiti.
- 🔗 Tocco su offerta/notifica → apre il prodotto su Amazon.it (con tag affiliato se configurato).
- 💾 Tutto salvato in locale (AsyncStorage), nessun server richiesto.

## Struttura del progetto

```
App.tsx                      Entry point + listener notifiche
src/
  types.ts                   Modelli dati e default
  theme.ts                   Colori e spaziature
  context/AppContext.tsx     Stato globale (offerte, filtri, settings, watchlist)
  navigation/RootNavigator   Tab: Offerte / Preferiti / Impostazioni
  screens/                   DealsScreen, WatchlistScreen, SettingsScreen
  components/                DealCard, FilterBar, EmptyState, PriceChart
  services/
    amazonProvider.ts        Provider intercambiabile (Mock + stub PA-API)
    storage.ts               Persistenza AsyncStorage
    notifications.ts         Permessi + notifiche locali
    dealMonitor.ts           Controllo offerte + task background
    priceHistory.ts          Storico prezzi (registrazione + statistiche)
  data/mockDeals.ts          Dati demo Amazon.it
```

## Collegare i dati reali (gratis con PA-API)

1. Iscriviti al **Programma Affiliazione Amazon** e, una volta approvato, richiedi le chiavi della **Product Advertising API 5.0**.
2. Inserisci le credenziali in `app.json`:
   ```json
   "extra": {
     "amazonAffiliateTag": "iltuotag-21",
     "paapiAccessKey": "...",
     "paapiSecretKey": "..."
   }
   ```
3. Completa i metodi `fetchDeals`/`fetchPrice` di `PaapiProvider` in `src/services/amazonProvider.ts` (firma AWS V4 + endpoint `SearchItems`/`GetItems`). Doc ufficiale: https://webservices.amazon.com/paapi5/documentation/
4. Quando le chiavi sono presenti, l'app usa automaticamente la PA-API al posto dei dati demo.

> La PA-API **non** segnala gli "errori di prezzo": quelli vanno dedotti confrontando il prezzo attuale con lo storico (logica già abbozzata tramite il campo `isPriceError`).

## Comandi utili

```bash
npm run start       # avvia Expo
npm run ios         # avvia su simulatore iOS (richiede Mac/Xcode)
npm run typecheck   # controllo TypeScript
```
