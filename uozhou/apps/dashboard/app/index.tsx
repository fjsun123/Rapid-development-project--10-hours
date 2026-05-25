// 首页 KPI + 最近订单
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDashboardKPI, useOrders } from '@restaurant/api-client';
import type { Order } from '@restaurant/types';
import { tokens, merge } from '@restaurant/shared';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

export default function HomeScreen() {
  const router = useRouter();
  const kpi = useDashboardKPI();
  const recent = useOrders({ page: 1, pageSize: 5 });

  const stats = kpi.data;
  const recentOrders = recent.data?.data ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>

      <View style={styles.kpiRow}>
        <KPICard label="今日订单数" value={stats?.todayOrders ?? '-'} suffix="单" loading={kpi.isLoading} />
        <KPICard label="今日收入" value={stats ? `¥${(stats.todayRevenue / 100).toFixed(2)}` : '-'} loading={kpi.isLoading} />
        <KPICard label="待处理订单" value={stats?.pendingOrders ?? '-'} suffix="单" loading={kpi.isLoading} onPress={() => router.push('/orders?status=pending')} />
        <KPICard label="热门商品" value={stats?.popularItems?.[0]?.name ?? '-'} suffix={stats?.popularItems?.[0] ? `售 ${stats.popularItems[0].count} 份` : ''} loading={kpi.isLoading} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近订单</Text>
          <Pressable onPress={() => router.push('/orders')}>
            <Text style={styles.link}>查看全部 →</Text>
          </Pressable>
        </View>

        {recent.isLoading ? (
          <ActivityIndicator color={tokens.colors.primary} />
        ) : recentOrders.length === 0 ? (
          <Text style={styles.empty}>暂无订单，去创建第一单</Text>
        ) : (
          <View>
            <View style={merge(styles.row, styles.head)}>
              <Text style={merge(styles.cell, { flex: 1.5 })}>订单号</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>金额</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>状态</Text>
              <Text style={merge(styles.cell, { flex: 1.5 })}>创建时间</Text>
            </View>
            {(recentOrders as Order[]).map((o) => (
              <View key={o.id} style={styles.row}>
                <Text style={merge(styles.cell, { flex: 1.5 })}>{o.orderNo}</Text>
                <Text style={merge(styles.cell, { flex: 1 })}>¥{(o.total / 100).toFixed(2)}</Text>
                <View style={merge(styles.cell, { flex: 1 })}><OrderStatusBadge status={o.status} /></View>
                <Text style={merge(styles.cell, { flex: 1.5 })}>{new Date(o.createdAt).toLocaleString('zh-CN')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function KPICard({ label, value, suffix, loading, onPress }: { label: string; value: any; suffix?: string; loading?: boolean; onPress?: () => void }) {
  const Comp: any = onPress ? Pressable : View;
  return (
    <Comp style={merge(styles.kpi, onPress && styles.kpiClickable)} onPress={onPress}>
      <Text style={styles.kpiLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator color={tokens.colors.primary} />
      ) : (
        <Text style={styles.kpiValue}>{value}{suffix ? <Text style={styles.kpiSuffix}> {suffix}</Text> : null}</Text>
      )}
    </Comp>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.lg },
  title: { ...tokens.typography.heading1, color: tokens.colors.textPrimary },
  kpiRow: { flexDirection: 'row', gap: tokens.spacing.md },
  kpi: {
    flex: 1, backgroundColor: tokens.colors.bgSurface, padding: tokens.spacing.lg,
    borderRadius: tokens.radius.md, ...tokens.shadows.sm, minHeight: 120, justifyContent: 'space-between',
  },
  kpiClickable: {},
  kpiLabel: { ...tokens.typography.bodyBase, color: tokens.colors.textSecondary },
  kpiValue: { fontSize: 28, fontWeight: '700', color: tokens.colors.textPrimary },
  kpiSuffix: { fontSize: 14, fontWeight: '400', color: tokens.colors.textSecondary },
  section: { backgroundColor: tokens.colors.bgSurface, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, ...tokens.shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md },
  sectionTitle: { ...tokens.typography.heading2, color: tokens.colors.textPrimary },
  link: { color: tokens.colors.primary, fontSize: 14 },
  empty: { ...tokens.typography.bodyBase, color: tokens.colors.textPlaceholder, textAlign: 'center', paddingVertical: tokens.spacing.xl },
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.colors.border },
  head: { borderBottomWidth: 1, borderBottomColor: tokens.colors.border, paddingBottom: 8 },
  cell: { ...tokens.typography.bodyBase, color: tokens.colors.textPrimary, paddingHorizontal: 4 },
});
