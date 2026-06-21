import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { colors, radius, spacing } from '@/theme';
import { runDealCheck } from '@/services/dealMonitor';

const THRESHOLDS = [30, 50, 70];

export function SettingsScreen() {
  const { settings, updateSettings, setNotificationsEnabled, sources, enabledSourceIds, toggleSource } =
    useApp();
  const [busy, setBusy] = useState(false);

  const onToggleNotifications = async (enabled: boolean) => {
    setBusy(true);
    const ok = await setNotificationsEnabled(enabled);
    setBusy(false);
    if (enabled && !ok) {
      Alert.alert(
        'Permesso negato',
        'Per ricevere gli avvisi attiva le notifiche per questa app dalle Impostazioni di iPhone.',
      );
    }
  };

  const testCheck = async () => {
    if (!settings.notificationsEnabled) {
      Alert.alert('Notifiche disattivate', 'Attiva prima le notifiche qui sopra.');
      return;
    }
    const n = await runDealCheck();
    Alert.alert(
      'Controllo eseguito',
      n > 0 ? `Inviate ${n} notifiche per le offerte trovate.` : 'Nessuna nuova offerta da segnalare al momento.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Impostazioni</Text>

        <Section title="Notifiche">
          <Row
            label="Attiva notifiche"
            description="Avvisi su offerte forti ed errori di prezzo (anche ad app chiusa)."
          >
            <Switch
              disabled={busy}
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#fff"
            />
          </Row>

          <Row label="Avvisa sugli errori di prezzo">
            <Switch
              disabled={!settings.notificationsEnabled}
              value={settings.notifyPriceErrors}
              onValueChange={(notifyPriceErrors) => updateSettings({ notifyPriceErrors })}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#fff"
            />
          </Row>

          <Row label="Avvisa sui cali dei preferiti">
            <Switch
              disabled={!settings.notificationsEnabled}
              value={settings.notifyWatchlistDrops}
              onValueChange={(notifyWatchlistDrops) => updateSettings({ notifyWatchlistDrops })}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#fff"
            />
          </Row>
        </Section>

        <Section title="Soglia di sconto per gli avvisi">
          <View style={styles.thresholdRow}>
            {THRESHOLDS.map((t) => {
              const active = settings.notifyDiscountThreshold === t;
              return (
                <Pressable
                  key={t}
                  disabled={!settings.notificationsEnabled}
                  onPress={() => updateSettings({ notifyDiscountThreshold: t })}
                  style={[styles.threshold, active && styles.thresholdActive]}
                >
                  <Text style={[styles.thresholdText, active && styles.thresholdTextActive]}>
                    ≥ -{t}%
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Fonti offerte (negozi)">
          {sources.map((src) => (
            <Row
              key={src.id}
              label={src.name}
              description={`Feed: ${src.defaultStore}`}
            >
              <Switch
                value={enabledSourceIds.includes(src.id)}
                onValueChange={() => toggleSource(src.id)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor="#fff"
              />
            </Row>
          ))}
        </Section>

        <Section title="Strumenti">
          <Pressable style={styles.button} onPress={testCheck}>
            <Text style={styles.buttonText}>Controlla offerte adesso</Text>
          </Pressable>
        </Section>

        <Text style={styles.note}>
          Le offerte arrivano da feed RSS pubblici (gratis, senza affiliazione) e includono link al
          negozio. I prezzi/sconti vengono estratti quando indicati nel testo. Per dati Amazon
          ufficiali puoi collegare la PA-API in app.json (vedi README).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  header: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, paddingRight: spacing.md },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  thresholdRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  threshold: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  thresholdActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  thresholdText: { color: colors.textMuted, fontWeight: '700' },
  thresholdTextActive: { color: '#1A1206' },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  buttonText: { color: '#1A1206', fontSize: 15, fontWeight: '800' },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});
