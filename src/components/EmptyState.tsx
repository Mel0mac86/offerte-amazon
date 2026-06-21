import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2, paddingHorizontal: spacing.xl },
  icon: { fontSize: 44, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
