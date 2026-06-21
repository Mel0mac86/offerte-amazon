import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORIES, Category, DealFilters } from '@/types';
import { colors, radius, spacing } from '@/theme';

interface Props {
  filters: DealFilters;
  onChange: (f: DealFilters) => void;
}

const DISCOUNTS = [0, 30, 50, 70];

export function FilterBar({ filters, onChange }: Props) {
  const set = (patch: Partial<DealFilters>) => onChange({ ...filters, ...patch });

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.search}
        placeholder="Cerca un prodotto…"
        placeholderTextColor={colors.textMuted}
        value={filters.query}
        onChangeText={(query) => set({ query })}
        returnKeyType="search"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((cat: Category) => {
          const active = filters.category === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => set({ category: cat })}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {DISCOUNTS.map((d) => {
          const active = filters.minDiscount === d;
          return (
            <Pressable
              key={d}
              onPress={() => set({ minDiscount: d })}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {d === 0 ? 'Tutti gli sconti' : `≥ -${d}%`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Solo errori di prezzo</Text>
        <Switch
          value={filters.onlyPriceErrors}
          onValueChange={(onlyPriceErrors) => set({ onlyPriceErrors })}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#1A1206' },
  toggleRow: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
