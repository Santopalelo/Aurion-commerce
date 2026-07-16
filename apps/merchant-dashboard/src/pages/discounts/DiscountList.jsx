import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag, Plus, Loader2, Trash2, Copy, Check,
  Percent, DollarSign, Truck, Edit2,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { discountService } from '../../services/discount.service';
import { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const TYPE_ICONS = {
  percentage: Percent,
  fixed_amount: DollarSign,
  free_shipping: Truck,
};

const DiscountList = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({
    code: '',
    title: '',
    type: 'percentage',
    value: '',
    minimumOrderAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => discountService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount created!');
      closeModal();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => discountService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount updated!');
      closeModal();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => discountService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount deleted');
      setDeleteConfirm(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '',
      title: '',
      type: 'percentage',
      value: '',
      minimumOrderAmount: '',
      usageLimit: '',
      expiresAt: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (discount) => {
    setEditing(discount);
    setForm({
      code: discount.code || '',
      title: discount.title || '',
      type: discount.type || 'percentage',
      value: discount.value || '',
      minimumOrderAmount: discount.conditions?.minimumOrderAmount || '',
      usageLimit: discount.usageLimit || '',
      expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().split('T')[0] : '',
      isActive: discount.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      code: form.code.trim().toUpperCase(),
      title: form.title,
      type: form.type,
      isActive: form.isActive,
    };

    if (form.type !== 'free_shipping') {
      data.value = Number(form.value);
    }

    if (form.minimumOrderAmount) {
      data.conditions = { minimumOrderAmount: Number(form.minimumOrderAmount) };
    }

    if (form.usageLimit) data.usageLimit = Number(form.usageLimit);
    if (form.expiresAt) data.expiresAt = form.expiresAt;

    if (editing) {
      updateMutation.mutate({ id: editing._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}"`);
  };

  const discounts = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Discounts</h1>
          <p className="text-gray-600 mt-1">Create and manage promo codes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Create discount
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Tag}
            title="No discounts yet"
            description="Create your first promo code to give customers a discount at checkout."
            action={
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4" />
                Create your first discount
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((discount) => {
            const Icon = TYPE_ICONS[discount.type];
            const isExpired = discount.expiresAt && new Date(discount.expiresAt) < new Date();

            return (
              <div
                key={discount._id}
                className={clsx(
                  'bg-white rounded-xl border p-5 hover:shadow-md transition-all',
                  discount.isActive && !isExpired
                    ? 'border-gray-200'
                    : 'border-gray-200 opacity-60'
                )}
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-dark font-mono">{discount.code}</p>
                      {discount.title && (
                        <p className="text-xs text-gray-500">{discount.title}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyCode(discount.code)}
                    className="text-gray-400 hover:text-primary-600 p-1"
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Value */}
                <div className="mb-3">
                  {discount.type === 'percentage' && (
                    <p className="text-2xl font-bold text-primary-600">
                      {discount.value}% off
                    </p>
                  )}
                  {discount.type === 'fixed_amount' && (
                    <p className="text-2xl font-bold text-primary-600">
                      {formatPrice(discount.value)} off
                    </p>
                  )}
                  {discount.type === 'free_shipping' && (
                    <p className="text-2xl font-bold text-primary-600">
                      Free shipping
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  {discount.conditions?.minimumOrderAmount > 0 && (
                    <p>Min order: {formatPrice(discount.conditions.minimumOrderAmount)}</p>
                  )}
                  {discount.usageLimit && (
                    <p>
                      Used {discount.usageCount || 0} / {discount.usageLimit} times
                    </p>
                  )}
                  {discount.expiresAt && (
                    <p>
                      {isExpired ? 'Expired' : 'Expires'} {formatDate(discount.expiresAt)}
                    </p>
                  )}
                </div>

                {/* Status + Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      discount.isActive && !isExpired
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {isExpired ? 'Expired' : discount.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(discount)}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(discount)}
                      className="p-1.5 text-gray-500 hover:text-danger hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Edit discount' : 'Create discount'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Update' : 'Create'} discount
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Discount code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SUMMER20"
            required
          />

          <Input
            label="Title (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Summer sale 20% off"
          />

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed_amount">Fixed amount off</option>
              <option value="free_shipping">Free shipping</option>
            </select>
          </div>

          {form.type !== 'free_shipping' && (
            <Input
              label={form.type === 'percentage' ? 'Percentage (%)' : 'Amount off'}
              type="number"
              step={form.type === 'percentage' ? '1' : '0.01'}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === 'percentage' ? '20' : '10.00'}
              required
            />
          )}

          <Input
            label="Minimum order amount (optional)"
            type="number"
            step="0.01"
            value={form.minimumOrderAmount}
            onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })}
            placeholder="0.00"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Usage limit"
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="Unlimited"
              helpText="Leave empty for unlimited"
            />

            <Input
              label="Expires on"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              helpText="Optional"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">Active (available to customers)</span>
          </label>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete discount?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(deleteConfirm._id)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Delete <span className="font-semibold font-mono">{deleteConfirm?.code}</span>?
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default DiscountList;