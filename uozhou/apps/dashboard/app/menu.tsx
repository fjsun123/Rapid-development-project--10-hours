// 菜单管理：列表 + 新增/编辑/删除 + 上下架
import { View, Text, StyleSheet, Pressable, Switch, Modal, TextInput, ScrollView } from 'react-native';
import { tokens, merge } from '@restaurant/shared';
import type { MenuItemWithCategory } from '@restaurant/types';
import { useMenuViewModel } from '../viewmodels/useMenuViewModel';

export default function MenuScreen() {
  const vm = useMenuViewModel();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>菜单管理</Text>
        <Pressable style={styles.primaryBtn} onPress={vm.openCreate}>
          <Text style={styles.primaryBtnText}>+ 新增菜品</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {vm.isLoading ? (
          <Text style={styles.muted}>加载中...</Text>
        ) : vm.items.length === 0 ? (
          <Text style={styles.muted}>暂无菜品</Text>
        ) : (
          <View>
            <View style={merge(styles.row, styles.head)}>
              <Text style={merge(styles.cell, { flex: 1.5 })}>菜品</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>分类</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>售价</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>库存</Text>
              <Text style={merge(styles.cell, { flex: 1 })}>上架</Text>
              <Text style={merge(styles.cell, { flex: 1.5 })}>操作</Text>
            </View>
            {vm.items.map((m: MenuItemWithCategory) => (
              <View key={m.id} style={styles.row}>
                <Text style={merge(styles.cell, { flex: 1.5 })}>{m.name}</Text>
                <Text style={merge(styles.cell, { flex: 1 })}>{m.categoryName}</Text>
                <Text style={merge(styles.cell, { flex: 1 })}>¥{(m.price / 100).toFixed(2)}</Text>
                <Text style={merge(styles.cell, { flex: 1 })}>{m.stock === -1 ? '不限' : m.stock}</Text>
                <View style={merge(styles.cell, { flex: 1 })}>
                  <Switch
                    value={m.available}
                    onValueChange={() => vm.handleToggle(m.id, m.available)}
                    disabled={vm.togglePending}
                  />
                </View>
                <View style={merge(styles.cell, styles.actionsCell, { flex: 1.5 })}>
                  <Pressable
                    style={merge(styles.actionBtn, styles.btnPrimary)}
                    onPress={() => vm.openEdit(m)}
                  >
                    <Text style={styles.actionBtnText}>编辑</Text>
                  </Pressable>
                  <Pressable
                    style={merge(styles.actionBtn, styles.btnDanger)}
                    onPress={() => vm.handleDelete(m)}
                  >
                    <Text style={styles.actionBtnText}>删除</Text>
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
            <Text style={styles.modalTitle}>{vm.form.id ? '编辑菜品' : '新增菜品'}</Text>

            <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: tokens.spacing.md }}>
              <Field label="名称 *">
                <TextInput
                  style={styles.input}
                  value={vm.form.name}
                  onChangeText={(v) => vm.updateForm({ name: v })}
                  placeholder="如：宫保鸡丁"
                />
              </Field>

              <Field label="分类 *">
                <View style={styles.chipRow}>
                  {vm.categories.length === 0 ? (
                    <Text style={styles.muted}>暂无分类，请先在数据库添加分类</Text>
                  ) : (
                    vm.categories.map((c: { id: number; name: string }) => {
                      const active = vm.form.categoryName === c.name;
                      return (
                        <Pressable
                          key={c.id}
                          style={merge(styles.chip, active && styles.chipActive)}
                          onPress={() => vm.pickCategory(c.name)}
                        >
                          <Text style={merge(styles.chipText, active && styles.chipTextActive)}>
                            {c.name}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </Field>

              <View style={styles.formRow}>
                <Field label="售价（元）*" style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    value={vm.form.priceYuan}
                    onChangeText={(v) => vm.updateForm({ priceYuan: v })}
                    placeholder="如：28"
                    keyboardType="decimal-pad"
                  />
                </Field>
                <Field label="库存（-1 不限）" style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    value={vm.form.stock}
                    onChangeText={(v) => vm.updateForm({ stock: v })}
                    placeholder="如：-1"
                    keyboardType="number-pad"
                  />
                </Field>
              </View>

              <Field label="描述">
                <TextInput
                  style={merge(styles.input, { minHeight: 60 })}
                  value={vm.form.description}
                  onChangeText={(v) => vm.updateForm({ description: v })}
                  placeholder="可选"
                  multiline
                />
              </Field>

              <Field label="图片 URL">
                <TextInput
                  style={styles.input}
                  value={vm.form.image}
                  onChangeText={(v) => vm.updateForm({ image: v })}
                  placeholder="https://..."
                  autoCapitalize="none"
                />
              </Field>

              <View style={styles.switchRow}>
                <Text style={styles.label}>上架</Text>
                <Switch
                  value={vm.form.available}
                  onValueChange={(v) => vm.updateForm({ available: v })}
                />
              </View>

              {vm.formError && <Text style={styles.errorText}>{vm.formError}</Text>}
            </ScrollView>

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

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: Record<string, any>;
}) {
  return (
    <View style={merge({ gap: tokens.spacing.xs }, style)}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
  btnDanger: { backgroundColor: tokens.colors.error },
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
    maxWidth: 560,
    backgroundColor: tokens.colors.bgSurface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.lg,
  },
  modalTitle: { ...tokens.typography.heading2, color: tokens.colors.textPrimary },
  modalBody: { maxHeight: 480 },
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

  formRow: { flexDirection: 'row', gap: tokens.spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...tokens.typography.bodyBase, color: tokens.colors.textPrimary, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.bgDisabled,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipActive: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  chipText: { fontSize: 12, color: tokens.colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  errorText: { color: tokens.colors.error, fontSize: 12 },
});
