// Menu 页面的 ViewModel：列表 + 增/删/改 + 上下架
import { useMemo, useState } from 'react';
import {
  useMenuItems,
  useToggleMenuItemAvailable,
  useUpsertMenuItem,
  useDeleteMenuItem,
} from '@restaurant/api-client';
import type { MenuItemWithCategory } from '@restaurant/types';
import { toastApi } from '../components/Toast';

export interface MenuFormState {
  id?: number;
  name: string;
  categoryName: string;
  categoryId: number | null;
  priceYuan: string;
  stock: string;
  description: string;
  image: string;
  available: boolean;
}

export const EMPTY_MENU_FORM: MenuFormState = {
  name: '',
  categoryName: '',
  categoryId: null,
  priceYuan: '',
  stock: '-1',
  description: '',
  image: '',
  available: true,
};

export function useMenuViewModel() {
  const { data: items = [], isLoading } = useMenuItems();
  const toggle = useToggleMenuItemAvailable();
  const upsert = useUpsertMenuItem();
  const del = useDeleteMenuItem();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MenuFormState>(EMPTY_MENU_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // 从现有菜品聚合分类
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of items) if (!map.has(m.categoryName)) map.set(m.categoryName, m.categoryId);
    return Array.from(map.entries()).map(([name, id]) => ({ id, name }));
  }, [items]);

  function openCreate() {
    setForm(EMPTY_MENU_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: MenuItemWithCategory) {
    setForm({
      id: item.id,
      name: item.name,
      categoryName: item.categoryName,
      categoryId: item.categoryId,
      priceYuan: (item.price / 100).toFixed(2),
      stock: String(item.stock),
      description: item.description ?? '',
      image: item.image ?? '',
      available: item.available,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError(null);
  }

  function updateForm(patch: Partial<MenuFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function pickCategory(name: string) {
    const found = categories.find((c) => c.name === name);
    setForm((prev) => ({
      ...prev,
      categoryName: name,
      categoryId: found ? found.id : prev.categoryId,
    }));
  }

  async function handleToggle(id: number, current: boolean) {
    try {
      await toggle.mutateAsync({ id, available: !current });
      toastApi.success(!current ? '菜品已上架' : '菜品已下架');
    } catch (e: any) {
      toastApi.error(e?.response?.data?.message ?? '操作失败');
    }
  }

  async function handleDelete(item: MenuItemWithCategory) {
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`确定删除菜品「${item.name}」吗？`)
        : true;
    if (!ok) return;
    try {
      await del.mutateAsync(item.id);
      toastApi.success('已删除');
    } catch (e: any) {
      toastApi.error(e?.response?.data?.message ?? '删除失败');
    }
  }

  async function handleSubmit() {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('请输入菜品名称');
      return;
    }
    if (!form.categoryId) {
      setFormError('请选择已有分类（暂不支持新建分类）');
      return;
    }
    const priceNum = Number(form.priceYuan);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setFormError('请输入合法售价');
      return;
    }
    const stockNum = Number(form.stock);
    if (!Number.isInteger(stockNum) || (stockNum < -1)) {
      setFormError('库存须为整数，-1 表示不限');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: form.id,
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Math.round(priceNum * 100),
        stock: stockNum,
        available: form.available,
        image: form.image.trim() || undefined,
      });
      toastApi.success(form.id ? '已更新' : '已新增');
      closeModal();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '保存失败';
      setFormError(msg);
      toastApi.error(msg);
    }
  }

  return {
    items,
    isLoading,
    categories,
    modalOpen,
    form,
    formError,
    submitting: upsert.isPending,
    togglePending: toggle.isPending,
    openCreate,
    openEdit,
    closeModal,
    updateForm,
    pickCategory,
    handleToggle,
    handleDelete,
    handleSubmit,
  };
}
