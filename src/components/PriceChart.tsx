import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PricePoint } from '@/types';
import { colors, spacing } from '@/theme';
import { formatEuro } from '@/utils/format';
import { historyStats } from '@/services/priceHistory';

interface Props {
  history: PricePoint[];
}

const CHART_HEIGHT = 56;
const MIN_BAR = 6;

/**
 * Mini grafico a barre dello storico prezzi.
 * Barra più bassa = prezzo più basso, evidenziata in verde (miglior prezzo).
 */
export function PriceChart({ history }: Props) {
  const stats = historyStats(history);

  if (!stats || history.length < 2) {
    return (
      <Text style={styles.placeholder}>
        Storico in costruzione: aggiorna le offerte per registrare i prezzi nel tempo.
      </Text>
    );
  }

  const { min, max, current } = stats;
  const range = max - min || 1;

  return (
    <View>
      <View style={styles.chart}>
        {history.map((p, i) => {
          const norm = (p.price - min) / range; // 0 = più basso
          const height = MIN_BAR + norm * (CHART_HEIGHT - MIN_BAR);
          const isLowest = p.price === min;
          const isLast = i === history.length - 1;
          return (
            <View
              key={`${p.t}-${i}`}
              style={[
                styles.bar,
                { height },
                isLowest && styles.barLowest,
                !isLowest && isLast && styles.barLast,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.legend}>
        <Stat label="Minimo" value={formatEuro(min)} highlight />
        <Stat label="Attuale" value={formatEuro(current)} />
        <Stat label="Massimo" value={formatEuro(max)} muted />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          highlight && { color: colors.success },
          muted && { color: colors.textMuted },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 3,
    paddingVertical: spacing.xs,
  },
  bar: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 2,
    opacity: 0.55,
  },
  barLowest: { backgroundColor: colors.success, opacity: 1 },
  barLast: { opacity: 1 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  placeholder: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    paddingVertical: spacing.sm,
  },
});
