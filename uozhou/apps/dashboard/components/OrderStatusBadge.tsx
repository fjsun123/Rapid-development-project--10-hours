import { View, Text, StyleSheet } from 'react-native';
import { tokens, merge } from '@restaurant/shared';
import type { OrderStatus } from '@restaurant/types';
import { ORDER_STATUS_LABELS } from '@restaurant/types';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const bg = tokens.colors.badge[status];
  return (
    <View style={merge(styles.badge, { backgroundColor: bg.bg })}>
      <Text style={merge(styles.text, { color: bg.text })}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: tokens.radius.full, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '500' },
});
