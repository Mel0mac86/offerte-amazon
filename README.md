# Offerte Amazon 📱🏷️

App iPhone (React Native + Expo) per trovare **offerte** e possibili **errori di prezzo** su **Amazon.it** e altri negozi, con **notifiche attivabili/disattivabili**, filtri per categoria/sconto e una **watchlist** dei preferiti.

## Da dove arrivano le offerte (gratis, senza affiliazione)

L'app legge **feed RSS pubblici** di community/siti di offerte (pensati per la sindacazione: usarli è gratis e legale, **nessun account o affiliazione richiesta**). I feed aggregano offerte di **più negozi** (Amazon.it, eBay, MediaWorld, ecc.), quindi l'app è multi-store. Le fonti sono attivabili singolarmente in **Impostazioni → Fonti offerte**.

I feed forniscono titolo, immagine, link al negozio e data. L'app legge anche il **contenuto completo dell'articolo** (`content:encoded`) per estrarre, quando presenti, **prezzo**, **sconto %**, **negozio** e **codice coupon**. Se la rete non è disponibile, mostra dei dati demo di esempio per non restare vuota.

I feed predefiniti verificati sono SmartWorld, TuttoAndroid e **GizChina** (multi-negozio e ricco di coupon: Amazon, AliExpress, MediaWorld…). In **Impostazioni → Fonti offerte** puoi attivarli/disattivarli e **aggiungere il feed RSS di qualsiasi altro negozio**.

> In alternativa (opzionale) puoi collegare la **PA-API ufficiale** di Amazon (richiede account Affiliato approvato) inserendo le chiavi in `app.json`: vedi più sotto.

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

- 🏷️ **Offerte reali da feed RSS**: titolo, immagine, badge negozio, prezzo e sconto % quando disponibili, pull-to-refresh.
- 🏬 **Multi-negozio**: Amazon.it, AliExpress, MediaWorld ed altri; fonti attivabili in Impostazioni.
- ➕ **Feed personalizzati**: aggiungi l'RSS di qualsiasi negozio/sito dall'app.
- 🎟️ **Codici sconto/coupon**: estratti dagli articoli e copiabili con un tocco.
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
    amazonProvider.ts        Selezione provider (Feed RSS / Mock / stub PA-API)
    feedProvider.ts          Aggrega più feed RSS + fallback demo
    filter.ts                Filtri e deduplica offerte
    sources/feeds.ts         Elenco feed RSS + gestione fonti attive
    sources/rss.ts           Download e parsing RSS -> Deal
    storage.ts               Persistenza AsyncStorage
    notifications.ts         Permessi + notifiche locali
    dealMonitor.ts           Controllo offerte + task background
    priceHistory.ts          Storico prezzi (registrazione + statistiche)
  data/mockDeals.ts          Dati demo (fallback offline)
```

## Aggiungere un negozio / una fonte

Apri `src/services/sources/feeds.ts` e aggiungi un elemento a `DEFAULT_FEEDS` con l'URL del feed RSS del sito di offerte. L'app lo mostrerà tra le fonti attivabili in Impostazioni. Funziona con qualsiasi feed RSS di offerte (Amazon o altri negozi).

## Collegare i dati Amazon ufficiali (opzionale, PA-API)

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
