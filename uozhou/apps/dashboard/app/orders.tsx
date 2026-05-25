// 订单管理：筛选 + 状态机操作
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens, merge } from '@restaurant/shared';
import { ORDER_STATUS_LABELS, type OrderStatus, type Order } from '@restaurant/types';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { toastApi } from '../components/Toast';
import { useOrdersViewModel, type OrderAction } from '../viewmodels/useOrdersViewModel';

const FILTER_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];

export default function OrdersScreen() {
  const vm = useOrdersViewModel();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>订单管理</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => toastApi.info('创建订单功能即将上线')}
        >
          <Text style={styles.primaryBtnText}>+ 创建订单</Text>
        </Pressable>
      </View>

      {/* 筛选区 */}
      <View style={styles.card}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>状态筛选：</Text>
          {FILTER_OPTIONS.map((s) => {
            const active = vm.statusFilter.includes(s);
            return (
              <Pressable
                key={s}
                style={merge(styles.chip, active && styles.chipActive)}
                onPress={() => vm.toggleStatus(s)}
              >
                <Text style={merge(styles.chipText, active && styles.chipTextActive)}>
                  {ORDER_STATUS_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.resetBtn} onPress={vm.resetFilter}>
            <Text style={styles.resetBtnText}>重置</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        {vm.isLoading ? (
          <Text style={styles.muted}>加载中...</Text>
        ) : vm.orders.length === 0 ? (
          <Text style={styles.muted}>暂无订单</Text>
        ) : (
          <View>
            <View style={merge(styles.row, styles.head)}>
              <Text style={merge(styles.cell, { flex: 1.5 })}>订单号</Text>
              <Text style={merge(styles.cell, { flex: 1.5 })}>客户</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>金额</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>状态</Text>
              <Text style={merge(styles.cell, { flex: 1.5 })}>时间</Text>
              <Text style={merge(styles.cell, { flex: 2 })}>操作</Text>
            </View>
            {vm.orders.map((o: Order) => (
              <View key={o.id} style={styles.row}>
                <Text style={merge(styles.cell, { flex: 1.5 })}>{o.orderNo}</Text>
                <Text style={merge(styles.cell, { flex: 1.5 })}>
                  {o.customerName ?? `#${o.customerId}`}
                </Text>
                <Text style={merge(styles.cell, { flex: 1 })}>¥{(o.total / 100).toFixed(2)}</Text>
                <View style={merge(styles.cell, { flex: 1 })}>
                  <OrderStatusBadge status={o.status} />
                </View>
                <Text style={merge(styles.cell, { flex: 1.5 })}>
                  {new Date(o.createdAt).toLocaleString('zh-CN')}
                </Text>
                <View style={merge(styles.cell, styles.actionsCell, { flex: 2 })}>
                  <ActionButtons order={o} onAction={vm.handleAction} disabled={vm.actionPending} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function ActionButtons({
  order,
  onAction,
  disabled,
}: {
  order: Order;
  onAction: (a: OrderAction, o: Order) => void;
  disabled: boolean;
}) {
  if (order.status === 'pending') {
    return (
      <>
        <ActionBtn label="接单" tone="primary" onPress={() => onAction('confirm', order)} disabled={disabled} />
        <ActionBtn label="取消" tone="danger" onPress={() => onAction('cancel', order)} disabled={disabled} />
      </>
    );
  }
  if (order.status === 'confirmed') {
    return (
      <>
        <ActionBtn label="出餐" tone="primary" onPress={() => onAction('ready', order)} disabled={disabled} />
        <ActionBtn label="取消" tone="danger" onPress={() => onAction('cancel', order)} disabled={disabled} />
      </>
    );
  }
  if (order.status === 'ready') {
    return (
      <ActionBtn label="完成" tone="success" onPress={() => onAction('complete', order)} disabled={disabled} />
    );
  }
  return <Text style={styles.actionDash}>—</Text>;
}

function ActionBtn({
  label,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  tone: 'primary' | 'success' | 'danger';
  onPress: () => void;
  disabled: boolean;
}) {
  const toneStyle =
    tone === 'primary' ? styles.btnPrimary
    : tone === 'success' ? styles.btnSuccess
    : styles.btnDanger;
  return (
    <Pressable
      role="button"
      accessibilityRole="button"
      style={merge(styles.actionBtn, toneStyle, disabled && styles.btnDisabled)}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...tokens.typography.heading1, color: tokens.colors.textPrimary },
  card: {
    backgroundColor: tokens.colors.bgSurface,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.md,
    ...tokens.shadows.sm,
  },
  muted: {
    ...tokens.typography.bodyBase,
    color: tokens.colors.textPlaceholder,
    textAlign: 'center',
    paddingVertical: tokens.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    alignItems: 'center',
  },
  head: { borderBottomWidth: 1, borderBottomColor: tokens.colors.border, paddingBottom: 8 },
  cell: { ...tokens.typography.bodyBase, color: tokens.colors.textPrimary, paddingHorizontal: 4 },
  actionsCell: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionDash: { color: tokens.colors.textPlaceholder },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, flexWrap: 'wrap' },
  filterLabel: { ...tokens.typography.bodyBase, color: tokens.colors.textSecondary, fontWeight: '500' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.bgDisabled,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipText: { fontSize: 12, color: tokens.colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  resetBtnText: { fontSize: 12, color: tokens.colors.textPrimary },

  primaryBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: tokens.radius.sm },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  btnPrimary: { backgroundColor: tokens.colors.primary },
  btnSuccess: { backgroundColor: tokens.colors.success },
  btnDanger: { backgroundColor: tokens.colors.error },
  btnDisabled: { opacity: 0.5 },
});
