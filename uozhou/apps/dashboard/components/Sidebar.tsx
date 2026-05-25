import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { tokens } from '@restaurant/shared';

const MENU = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/orders', label: '订单', icon: '📋' },
  { href: '/crm', label: 'CRM', icon: '👥' },
  { href: '/menu', label: '菜单', icon: '🍱' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    router.replace('/login');
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>🍔 Restaurant</Text>
      </View>
      <View style={styles.menu}>
        {MENU.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href as any} asChild>
              <Pressable style={{ ...styles.menuItem, ...(active ? styles.menuItemActive : {}) }}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={{ ...styles.menuLabel, ...(active ? styles.menuLabelActive : {}) }}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Link href="/ui-library" asChild>
          <Pressable style={styles.footerLink}>
            <Text style={styles.footerLinkText}>🎨 UI 组件库</Text>
          </Pressable>
        </Link>
        <Pressable style={styles.footerLink} onPress={handleLogout}>
          <Text style={{ ...styles.footerLinkText, color: tokens.colors.error }}>退出登录</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: tokens.layout.sidebarWidth,
    backgroundColor: tokens.colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: tokens.colors.border,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
  },
  logo: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  logoText: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary },
  menu: { flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: tokens.spacing.lg,
    gap: 12,
    marginHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
  },
  menuItemActive: { backgroundColor: '#FEF3C7' },
  menuIcon: { fontSize: 18 },
  menuLabel: { ...tokens.typography.bodyBase, color: tokens.colors.textSecondary },
  menuLabelActive: { color: tokens.colors.primaryHover, fontWeight: '600' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.md,
    gap: tokens.spacing.xs,
  },
  footerLink: { paddingVertical: 8, paddingHorizontal: tokens.spacing.lg },
  footerLinkText: { ...tokens.typography.bodyBase, color: tokens.colors.textSecondary },
});
