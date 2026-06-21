import React from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/EmptyState';
import { PriceChart } from '@/components/PriceChart';
import { colors, radius, spacing } from '@/theme';
import { formatEuro, timeAgo } from '@/utils/format';
import { withAffiliateTag } from '@/services/amazonProvider';

export function WatchlistScreen() {
  const { watchlist, deals, toggleWatch } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.header}>Preferiti</Text>
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.dealId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="★"
            title="Nessun preferito"
            subtitle="Tocca la stella su un'offerta per seguirne il prezzo e ricevere un avviso quando cala."
          />
        }
        renderItem={({ item }) => {
          const livePrice = deals.find((d) => d.id === item.dealId)?.currentPrice;
          const current = livePrice ?? item.priceWhenAdded;
          const drop =
            current != null && item.priceWhenAdded != null && item.priceWhenAdded > 0
              ? Math.round((1 - current / item.priceWhenAdded) * 100)
              : 0;
          // Storico per il grafico, includendo il prezzo live se più recente.
          const lastHistory = item.history[item.history.length - 1];
          const chartHistory =
            current != null && lastHistory && lastHistory.price !== current
              ? [...item.history, { t: Date.now(), price: current }]
              : item.history;

          return (
            <View style={styles.card}>
              <Pressable
                style={styles.topRow}
                onPress={() => Linking.openURL(withAffiliateTag(item.url)).catch(() => {})}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.priceRow}>
                    {current != null ? (
                      <Text style={styles.price}>{formatEuro(current)}</Text>
                    ) : (
                      <Text style={styles.flat}>prezzo non disponibile</Text>
                    )}
                    {drop > 0 && <Text style={styles.drop}>▼ -{drop}%</Text>}
                  </View>
                  <Text style={styles.meta}>
                    {item.store} · aggiunto {timeAgo(item.addedAt)}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    toggleWatch({
                      id: item.dealId,
                      title: item.title,
                      imageUrl: item.imageUrl,
                      url: item.url,
                      currentPrice: item.priceWhenAdded,
                      listPrice: null,
                      discountPct: null,
                      store: item.store,
                      sourceId: 'watchlist',
                      category: 'Tutte',
                      isPriceError: false,
                      detectedAt: item.addedAt,
                    })
                  }
                  style={styles.removeBtn}
                >
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </Pressable>

              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Storico prezzi</Text>
                <PriceChart history={chartHistory} />
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  chartSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xs,
  },
  chartTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  image: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  info: { flex: 1, paddingHorizontal: spacing.md },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: 2 },
  price: { color: colors.success, fontSize: 16, fontWeight: '800' },
  drop: { color: colors.success, fontSize: 12, fontWeight: '700' },
  flat: { color: colors.textMuted, fontSize: 12 },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  removeBtn: { padding: spacing.sm },
  remove: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
});
