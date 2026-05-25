// 极简 Toast - 通过事件总线触发
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens, merge } from '@restaurant/shared';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: number; type: ToastType; text: string; }

type Listener = (t: Toast) => void;
let listeners: Listener[] = [];
let seq = 1;

export const toastApi = {
  show(type: ToastType, text: string) {
    const t = { id: seq++, type, text };
    listeners.forEach((l) => l(t));
  },
  success(text: string) { this.show('success', text); },
  error(text: string)   { this.show('error', text); },
  warning(text: string) { this.show('warning', text); },
  info(text: string)    { this.show('info', text); },
};

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const l: Listener = (t) => {
      setItems((prev) => [...prev.slice(-2), t]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== t.id)), 4000);
    };
    listeners.push(l);
    return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);
  return (
    <View style={styles.host as any}>
      {children}
      <View style={styles.toasts}>
        {items.map((t) => (
          <View key={t.id} style={merge(styles.toast, styles[`toast_${t.type}`])}>
            <Text style={styles.toastText}>{t.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  toasts: {
    position: 'absolute',
    top: tokens.spacing.lg,
    right: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    zIndex: 999,
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    minWidth: 200,
    ...tokens.shadows.md,
  },
  toast_success: { backgroundColor: tokens.colors.success },
  toast_error: { backgroundColor: tokens.colors.error },
  toast_warning: { backgroundColor: tokens.colors.warning },
  toast_info: { backgroundColor: tokens.colors.secondary },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
