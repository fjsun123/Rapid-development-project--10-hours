// CRM 客户管理：搜索 + 新增/编辑客户
import { View, Text, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import { tokens, merge } from '@restaurant/shared';
import type { Customer } from '@restaurant/types';
import { useCrmViewModel } from '../viewmodels/useCrmViewModel';

export default function CRMScreen() {
  const vm = useCrmViewModel();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>CRM 客户管理</Text>
        <Pressable style={styles.primaryBtn} onPress={vm.openCreate}>
          <Text style={styles.primaryBtnText}>+ 新增客户</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.search}
          placeholder="搜索客户姓名或手机号"
          value={vm.keyword}
          onChangeText={vm.setKeyword}
        />
        {vm.isLoading ? (
          <Text style={styles.muted}>加载中...</Text>
        ) : vm.customers.length === 0 ? (
          <Text style={styles.muted}>暂无客户</Text>
        ) : (
          <View>
            <View style={merge(styles.row, styles.head)}>
              <Text style={merge(styles.cell, { flex: 1 })}>姓名</Text>
              <Text style={merge(styles.cell, { flex: 1.5 })}>手机号</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>订单数</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>累计消费</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>操作</Text>
            </View>
            {vm.customers.map((c: Customer) => (
              <View key={c.id} style={styles.row}>
                <Text style={merge(styles.cell, { flex: 1 })}>{c.name}</Text>
                <Text style={merge(styles.cell, { flex: 1.5 })}>{c.phone}</Text>
                <Text style={merge(styles.cell, { flex: 1 })}>{c.orderCount ?? 0}</Text>
                <Text style={merge(styles.cell, { flex: 1 })}>
                  ¥{((c.totalSpend ?? 0) / 100).toFixed(2)}
                </Text>
                <View style={merge(styles.cell, styles.actionsCell, { flex: 1 })}>
                  <Pressable
                    style={merge(styles.actionBtn, styles.btnPrimary)}
                    onPress={() => vm.openEdit(c)}
                  >
                    <Text style={styles.actionBtnText}>编辑</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal visible={vm.modalOpen} animationType="fade" transparent onRequestClose={vm.closeModal}>
        <Pressable style={styles.overlay} onPress={vm.closeModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{vm.form.id ? '编辑客户' : '新增客户'}</Text>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.label}>姓名 *</Text>
                <TextInput
                  style={styles.input}
                  value={vm.form.name}
                  onChangeText={(v) => vm.updateForm({ name: v })}
                  placeholder="如：张三"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>手机号 *（11 位）</Text>
                <TextInput
                  style={styles.input}
                  value={vm.form.phone}
                  onChangeText={(v) => vm.updateForm({ phone: v })}
                  placeholder="如：13800138000"
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>备注</Text>
                <TextInput
                  style={merge(styles.input, { minHeight: 60 })}
                  value={vm.form.notes}
                  onChangeText={(v) => vm.updateForm({ notes: v })}
                  placeholder="可选"
                  multiline
                />
              </View>

              {vm.formError && <Text style={styles.errorText}>{vm.formError}</Text>}
            </View>

            <View style={styles.modalFoot}>
              <Pressable style={styles.cancelBtn} onPress={vm.closeModal}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </Pressable>
              <Pressable
                style={merge(styles.primaryBtn, vm.submitting && styles.btnDisabled)}
                onPress={vm.handleSubmit}
                disabled={vm.submitting}
              >
                <Text style={styles.primaryBtnText}>{vm.submitting ? '保存中...' : '保存'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    gap: tokens.spacing.md,
  },
  search: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    padding: 10,
    fontSize: 14,
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
  actionsCell: { flexDirection: 'row', gap: 8 },

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
  btnDisabled: { opacity: 0.5 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: tokens.colors.bgSurface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.lg,
  },
  modalTitle: { ...tokens.typography.heading2, color: tokens.colors.textPrimary },
  modalBody: { gap: tokens.spacing.md },
  modalFoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  cancelBtnText: { color: tokens.colors.textPrimary, fontSize: 14 },

  field: { gap: tokens.spacing.xs },
  label: { ...tokens.typography.bodyBase, color: tokens.colors.textPrimary, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  errorText: { color: tokens.colors.error, fontSize: 12 },
});
