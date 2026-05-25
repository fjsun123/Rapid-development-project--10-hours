// CRM 页面的 ViewModel：搜索 + 新增/编辑客户
import { useState } from 'react';
import { useCustomers, useUpsertCustomer } from '@restaurant/api-client';
import type { Customer } from '@restaurant/types';
import { toastApi } from '../components/Toast';

export interface CustomerFormState {
  id?: number;
  name: string;
  phone: string;
  notes: string;
}

export const EMPTY_CUSTOMER_FORM: CustomerFormState = {
  name: '',
  phone: '',
  notes: '',
};

export function useCrmViewModel() {
  const [keyword, setKeyword] = useState('');
  const { data, isLoading } = useCustomers({ keyword, page: 1, pageSize: 50 });
  const upsert = useUpsertCustomer();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_CUSTOMER_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_CUSTOMER_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setForm({ id: c.id, name: c.name, phone: c.phone, notes: c.notes ?? '' });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError(null);
  }

  function updateForm(patch: Partial<CustomerFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit() {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('请输入客户姓名');
      return;
    }
    if (!/^\d{11}$/.test(form.phone.trim())) {
      setFormError('请输入 11 位手机号');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim() || undefined,
      });
      toastApi.success(form.id ? '客户已更新' : '客户已新增');
      closeModal();
    } catch (e: any) {
      const code = e?.response?.data?.code ?? e?.response?.data?.error?.code;
      const status = e?.response?.status;
      const isDuplicate =
        code === '23505' ||
        String(e?.response?.data?.message ?? '').includes('已存在') ||
        status === 409;
      const msg = isDuplicate ? '该手机号已存在' : (e?.response?.data?.message ?? '保存失败');
      setFormError(msg);
      toastApi.error(msg);
    }
  }

  return {
    keyword,
    setKeyword,
    customers: data?.data ?? [],
    isLoading,
    modalOpen,
    form,
    formError,
    submitting: upsert.isPending,
    openCreate,
    openEdit,
    closeModal,
    updateForm,
    handleSubmit,
  };
}
