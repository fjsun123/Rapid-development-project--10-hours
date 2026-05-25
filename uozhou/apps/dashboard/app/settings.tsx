import { View, Text, TextInput, Pressable, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useSettings, useUpdateSettings } from '@restaurant/api-client';
import { tokens, merge } from '@restaurant/shared';
import { toastApi } from '../components/Toast';

export default function SettingsScreen() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState({
    estimatedPrepTime: 15,
    autoAcceptOrders: false,
    serviceAvailable: true,
    openingTime: '09:00',
    closingTime: '22:00',
  });

  useEffect(() => {
    if (data) {
      setForm({
        estimatedPrepTime: data.estimatedPrepTime,
        autoAcceptOrders: data.autoAcceptOrders,
        serviceAvailable: data.serviceAvailable,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
      });
    }
  }, [data]);

  function validate(): string | null {
    if (form.estimatedPrepTime < 1 || form.estimatedPrepTime > 180) return '准备时间需在 1~180 分钟之间';
    if (form.openingTime >= form.closingTime) return '结束时间必须大于开始时间';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { toastApi.error(err); return; }
    try {
      await update.mutateAsync(form);
      toastApi.success('设置已保存');
    } catch (e: any) {
      toastApi.error(e?.response?.data?.message ?? '保存失败');
    }
  }

  if (isLoading) return <ActivityIndicator color={tokens.colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>门店设置</Text>
        <Pressable style={styles.btn} onPress={handleSave} disabled={update.isPending}>
          <Text style={styles.btnText}>{update.isPending ? '保存中...' : '保存'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>出餐设置</Text>
        <View style={styles.field}>
          <Text style={styles.label}>出餐准备时间（分钟）</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={String(form.estimatedPrepTime)}
            onChangeText={(t) => setForm({ ...form, estimatedPrepTime: parseInt(t || '0') })} />
          <Text style={styles.hint}>1 ~ 180 分钟</Text>
        </View>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>自动接受新订单</Text>
            <Text style={styles.hint}>开启后新订单将自动进入制作中状态</Text>
          </View>
          <Switch value={form.autoAcceptOrders} onValueChange={(v) => setForm({ ...form, autoAcceptOrders: v })} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>营业状态</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>{form.serviceAvailable ? '营业中' : '已打烊'}</Text>
          <Switch value={form.serviceAvailable} onValueChange={(v) => setForm({ ...form, serviceAvailable: v })} />
        </View>
        <View style={styles.row2}>
          <View style={merge(styles.field, { flex: 1 })}>
            <Text style={styles.label}>开始时间</Text>
            <TextInput style={styles.input} value={form.openingTime} onChangeText={(t) => setForm({ ...form, openingTime: t })} placeholder="09:00" />
          </View>
          <View style={merge(styles.field, { flex: 1 })}>
            <Text style={styles.label}>结束时间</Text>
            <TextInput style={styles.input} value={form.closingTime} onChangeText={(t) => setForm({ ...form, closingTime: t })} placeholder="22:00" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.lg, maxWidth: 800 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...tokens.typography.heading1, color: tokens.colors.textPrimary },
  btn: { backgroundColor: tokens.colors.primary, paddingHorizontal: tokens.spacing.lg, paddingVertical: 10, borderRadius: tokens.radius.md },
  btnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: tokens.colors.bgSurface, padding: tokens.spacing.lg, borderRadius: tokens.radius.md, ...tokens.shadows.sm, gap: tokens.spacing.md },
  sectionTitle: { ...tokens.typography.heading2, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.sm },
  field: { gap: tokens.spacing.xs },
  label: { ...tokens.typography.bodyBase, color: tokens.colors.textPrimary, fontWeight: '500' },
  hint: { ...tokens.typography.caption, color: tokens.colors.textPlaceholder },
  input: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 10, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: tokens.spacing.sm },
  row2: { flexDirection: 'row', gap: tokens.spacing.md },
});
