import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAdminLogin } from '@restaurant/api-client';
import { tokens, merge } from '@restaurant/shared';
import { toastApi } from '../components/Toast';

export default function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const router = useRouter();
  const login = useAdminLogin();

  async function handleSubmit() {
    try {
      const data = await login.mutateAsync({ username, password });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      toastApi.success('登录成功');
      router.replace('/');
    } catch (e: any) {
      toastApi.error(e?.response?.data?.message ?? '登录失败');
    }
  }

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        <Text style={styles.title}>🍔 餐厅管理后台</Text>
        <Text style={styles.subtitle}>请登录以继续</Text>

        <View style={styles.field}>
          <Text style={styles.label}>用户名</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>密码</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <Pressable
          style={merge(styles.btn, login.isPending && styles.btnDisabled)}
          onPress={handleSubmit}
          disabled={login.isPending}
        >
          <Text style={styles.btnText}>{login.isPending ? '登录中...' : '登 录'}</Text>
        </Pressable>

        <Text style={styles.hint}>测试账号：admin / admin123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.bgPage },
  card: {
    width: 400, backgroundColor: tokens.colors.bgSurface, padding: tokens.spacing.xl,
    borderRadius: tokens.radius.lg, ...tokens.shadows.lg, gap: tokens.spacing.md,
  },
  title: { ...tokens.typography.heading1, color: tokens.colors.textPrimary, textAlign: 'center' },
  subtitle: { ...tokens.typography.bodyBase, color: tokens.colors.textSecondary, textAlign: 'center', marginBottom: tokens.spacing.md },
  field: { gap: tokens.spacing.xs },
  label: { ...tokens.typography.bodyBase, color: tokens.colors.textPrimary, fontWeight: '500' },
  input: {
    borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md,
    padding: 10, fontSize: 14, backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: tokens.colors.primary, paddingVertical: 12, borderRadius: tokens.radius.md,
    alignItems: 'center', marginTop: tokens.spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  hint: { ...tokens.typography.caption, color: tokens.colors.textPlaceholder, textAlign: 'center' },
});
