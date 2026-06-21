import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { DealCard } from '@/components/DealCard';
import { FilterBar } from '@/components/FilterBar';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme';

export function DealsScreen() {
  const { deals, filters, setFilters, refreshDeals, toggleWatch, isWatched } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDeals();
    setRefreshing(false);
  }, [refreshDeals]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<FilterBar filters={filters} onChange={setFilters} />}
        renderItem={({ item }) => (
          <DealCard deal={item} watched={isWatched(item.id)} onToggleWatch={toggleWatch} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="Nessuna offerta trovata"
            subtitle="Prova ad allargare i filtri o trascina verso il basso per aggiornare."
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingTop: 8, paddingBottom: 24 },
});
