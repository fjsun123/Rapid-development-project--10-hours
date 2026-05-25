import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, configureAuth } from '@restaurant/api-client';
import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Sidebar } from '../components/Sidebar';
import { ToastHost, toastApi } from '../components/Toast';
import { tokens } from '@restaurant/shared';

const queryClient = createQueryClient();

// Web 端用 localStorage 存 token
const tokenStore = {
  get(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('access_token');
  },
  set(token: string | null) {
    if (typeof localStorage === 'undefined') return;
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
  },
};

configureAuth({
  getToken: () => tokenStore.get(),
  onUnauthorized: () => {
    tokenStore.set(null);
    if (typeof localStorage !== 'undefined') localStorage.removeItem('user');
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastHost>
        <AuthGate />
      </ToastHost>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 延后到下一帧，确保 Root Layout 已 mount Slot
    const id = setTimeout(() => {
      const token = tokenStore.get();
      const inLogin = segments[0] === 'login';
      if (!token && !inLogin) router.replace('/login');
      else if (token && inLogin) router.replace('/');
    }, 0);
    return () => clearTimeout(id);
  }, [segments]);

  const inLogin = segments[0] === 'login';
  if (inLogin) return <Slot />;

  return (
    <View style={styles.shell}>
      <Sidebar />
      <View style={styles.main}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: tokens.colors.bgPage },
  main: { flex: 1, padding: tokens.spacing.lg },
});
