import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch } from 'react-native';
import { tokens, merge } from '@restaurant/shared';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { toastApi } from '../components/Toast';

export default function UILibrary() {
  return (
    <ScrollView contentContainerStyle={{ gap: tokens.spacing.xl, paddingBottom: tokens.spacing['2xl'] }}>
      <Text style={styles.title}>设计系统与组件库</Text>
      <Text style={styles.subtitle}>本页展示所有设计令牌与可复用组件</Text>

      <Section title="颜色令牌">
        <View style={styles.swatchRow}>
          {Object.entries(tokens.colors).filter(([k, v]) => typeof v === 'string').map(([k, v]) => (
            <View key={k} style={styles.swatch}>
              <View style={merge(styles.swatchBox, { backgroundColor: v as string })} />
              <Text style={styles.swatchName}>{k}</Text>
              <Text style={styles.swatchHex}>{v as string}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="字体排印">
        <Text style={tokens.typography.heading1}>heading-1 28/36/600</Text>
        <Text style={tokens.typography.heading2}>heading-2 20/28/600</Text>
        <Text style={tokens.typography.heading3}>heading-3 16/24/600</Text>
        <Text style={tokens.typography.bodyLarge}>body-large 16/24/400</Text>
        <Text style={tokens.typography.bodyBase}>body-base 14/20/400</Text>
        <Text style={tokens.typography.caption}>caption 12/16/400</Text>
      </Section>

      <Section title="间距刻度">
        {Object.entries(tokens.spacing).map(([k, v]) => (
          <View key={k} style={styles.spacingRow}>
            <Text style={styles.spacingLabel}>{k}: {v}px</Text>
            <View style={{ height: 12, width: v, backgroundColor: tokens.colors.primary, borderRadius: 2 }} />
          </View>
        ))}
      </Section>

      <Section title="圆角">
        {Object.entries(tokens.radius).map(([k, v]) => (
          <View key={k} style={merge(styles.radiusBox, { borderRadius: v === 9999 ? 60 : v })}>
            <Text style={styles.radiusLabel}>{k} ({v})</Text>
          </View>
        ))}
      </Section>

      <Section title="阴影">
        <View style={merge(styles.shadowBox, tokens.shadows.sm)}><Text>shadow-sm</Text></View>
        <View style={merge(styles.shadowBox, tokens.shadows.md)}><Text>shadow-md</Text></View>
        <View style={merge(styles.shadowBox, tokens.shadows.lg)}><Text>shadow-lg</Text></View>
      </Section>

      <Section title="按钮">
        <View style={{ flexDirection: 'row', gap: tokens.spacing.md }}>
          <Pressable style={merge(styles.btnBase, styles.btnPrimary)}><Text style={styles.btnPrimaryText}>主要按钮</Text></Pressable>
          <Pressable style={merge(styles.btnBase, styles.btnSecondary)}><Text style={styles.btnSecondaryText}>次要按钮</Text></Pressable>
          <Pressable style={merge(styles.btnBase, styles.btnDanger)}><Text style={styles.btnPrimaryText}>危险按钮</Text></Pressable>
          <Pressable style={merge(styles.btnBase, styles.btnPrimary, styles.btnDisabled)}><Text style={styles.btnPrimaryText}>禁用</Text></Pressable>
        </View>
      </Section>

      <Section title="输入与开关">
        <TextInput style={styles.input} placeholder="文本输入框" />
        <View style={{ flexDirection: 'row', gap: tokens.spacing.md, alignItems: 'center' }}>
          <Switch value={true} onValueChange={() => {}} />
          <Switch value={false} onValueChange={() => {}} />
          <Switch value={true} disabled onValueChange={() => {}} />
        </View>
      </Section>

      <Section title="订单状态徽章">
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
          {(['pending', 'confirmed', 'ready', 'completed', 'cancelled'] as const).map((s) => (
            <OrderStatusBadge key={s} status={s} />
          ))}
        </View>
      </Section>

      <Section title="吐司演示">
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
          <Pressable style={merge(styles.btnBase, styles.btnPrimary)} onPress={() => toastApi.success('操作成功')}><Text style={styles.btnPrimaryText}>成功吐司</Text></Pressable>
          <Pressable style={merge(styles.btnBase, styles.btnDanger)} onPress={() => toastApi.error('操作失败')}><Text style={styles.btnPrimaryText}>错误吐司</Text></Pressable>
          <Pressable style={merge(styles.btnBase, { backgroundColor: tokens.colors.warning })} onPress={() => toastApi.warning('请注意')}><Text style={styles.btnPrimaryText}>警告吐司</Text></Pressable>
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: tokens.spacing.md }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...tokens.typography.heading1, color: tokens.colors.textPrimary },
  subtitle: { ...tokens.typography.bodyBase, color: tokens.colors.textSecondary },
  section: { backgroundColor: tokens.colors.bgSurface, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, ...tokens.shadows.sm, gap: tokens.spacing.md },
  sectionTitle: { ...tokens.typography.heading2, color: tokens.colors.textPrimary },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  swatch: { width: 120 },
  swatchBox: { width: '100%', height: 60, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: tokens.colors.border },
  swatchName: { ...tokens.typography.bodyBase, marginTop: 4 },
  swatchHex: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  spacingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  spacingLabel: { width: 120, ...tokens.typography.bodyBase },
  radiusBox: { width: 120, height: 60, backgroundColor: tokens.colors.primary, alignItems: 'center', justifyContent: 'center' },
  radiusLabel: { color: '#fff', fontWeight: '600' },
  shadowBox: { padding: tokens.spacing.md, backgroundColor: tokens.colors.bgSurface, borderRadius: tokens.radius.md, alignItems: 'center' },
  btnBase: { paddingHorizontal: tokens.spacing.lg, paddingVertical: 10, borderRadius: tokens.radius.md },
  btnPrimary: { backgroundColor: tokens.colors.primary },
  btnSecondary: { backgroundColor: tokens.colors.bgSurface, borderWidth: 1, borderColor: tokens.colors.border },
  btnDanger: { backgroundColor: tokens.colors.error },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnSecondaryText: { color: tokens.colors.textPrimary, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 10, fontSize: 14 },
});
