import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Deal, discountPercent } from '@/types';
import { colors, radius, spacing } from '@/theme';
import { formatEuro, timeAgo } from '@/utils/format';
import { withAffiliateTag } from '@/services/amazonProvider';

interface Props {
  deal: Deal;
  watched: boolean;
  onToggleWatch: (deal: Deal) => void;
}

export function DealCard({ deal, watched, onToggleWatch }: Props) {
  const discount = discountPercent(deal);
  const [copied, setCopied] = useState(false);

  const open = () => {
    Linking.openURL(withAffiliateTag(deal.url)).catch(() => {});
  };

  const copyCoupon = async () => {
    if (!deal.couponCode) return;
    await Clipboard.setStringAsync(deal.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Pressable style={styles.card} onPress={open}>
      <Image source={{ uri: deal.imageUrl }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.badgeRow}>
          {deal.isPriceError && (
            <View style={[styles.badge, { backgroundColor: colors.errorBadge }]}>
              <Text style={styles.badgeText}>ERRORE PREZZO?</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={styles.badgeText}>{deal.store}</Text>
          </View>
          {discount != null && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { color: '#1A1206' }]}>-{discount}%</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {deal.title}
        </Text>

        <View style={styles.priceRow}>
          {deal.currentPrice != null ? (
            <Text style={styles.price}>{formatEuro(deal.currentPrice)}</Text>
          ) : (
            <Text style={styles.seeOffer}>Vedi offerta ›</Text>
          )}
          {deal.listPrice != null && deal.currentPrice != null && deal.listPrice > deal.currentPrice && (
            <Text style={styles.listPrice}>{formatEuro(deal.listPrice)}</Text>
          )}
        </View>

        {deal.couponCode && (
          <Pressable
            style={[styles.coupon, copied && styles.couponCopied]}
            onPress={(e) => {
              e.stopPropagation?.();
              copyCoupon();
            }}
          >
            <Text style={styles.couponLabel}>🏷️ Codice</Text>
            <Text style={styles.couponCode}>{deal.couponCode}</Text>
            <Text style={styles.couponAction}>{copied ? '✓ Copiato' : 'Copia'}</Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          <Text style={styles.meta}>
            {deal.category} · {timeAgo(deal.detectedAt)}
          </Text>
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleWatch(deal);
            }}
            style={styles.heartBtn}
          >
            <Text style={[styles.heart, watched && styles.heartActive]}>
              {watched ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  image: {
    width: 104,
    height: 104,
    backgroundColor: colors.surfaceAlt,
  },
  body: { flex: 1, padding: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
  price: { color: colors.success, fontSize: 18, fontWeight: '800' },
  seeOffer: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  listPrice: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'line-through' },
  coupon: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  couponCopied: { borderColor: colors.success, borderStyle: 'solid' },
  couponLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  couponCode: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  couponAction: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  footer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { color: colors.textMuted, fontSize: 11 },
  heartBtn: { paddingLeft: spacing.md },
  heart: { fontSize: 20, color: colors.textMuted },
  heartActive: { color: colors.accent },
});
