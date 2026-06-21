import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from '@/context/AppContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { withAffiliateTag } from '@/services/amazonProvider';
import { colors } from '@/theme';
// Importa il task di background così viene registrato all'avvio.
import '@/services/dealMonitor';

function Gate() {
  const { loading } = useApp();
  const responseListener = useRef<Notifications.Subscription>();

  // Quando l'utente tocca una notifica, apre il prodotto su Amazon.it.
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) Linking.openURL(withAffiliateTag(url)).catch(() => {});
    });
    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
