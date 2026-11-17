/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminShopPage.tsx
 * Purpose: Admin management for Pro Shop products (CRUD + image upload) and customer orders
 *          with live status updates.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  createProduct,
  deleteProduct,
  getAllOrdersAdmin,
  getProducts,
  updateOrderStatus,
  updateProduct,
} from '../../services/shopService';
import { markOrderPaidAdmin } from '../../services/paymentsService';
import { useSite } from '../../context/SiteContext';
import { Order, OrderStatus, Product } from '../../types/models';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ImageUpload } from '../../components/common/ImageUpload';
import { MediaFrame } from '../../components/common/MediaFrame';
import { formatCurrency, formatDate } from '../../utils/helpers';

const EMPTY_PRODUCT = {
  name: '',
  category: 'Supplements',
  price: 35,
  compareAtPrice: 0,
  stock: 20,
  description: '',
  imageUrl: '',
  featured: false,
};

export default function AdminShopPage() {
  const { settings, showToast } = useSite();
  const [tab, setTab] = useState<'products' | 'orders'>('products');

  const {
    data: products,
    loading: prodLoading,
    refetch: refetchProducts,
  } = useFirestore(() => getProducts(60), []);

  const {
    data: orders,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useFirestore(() => getAllOrdersAdmin(80), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      compareAtPrice: p.compareAtPrice || 0,
      stock: p.stock,
      description: p.description,
      imageUrl: p.imageUrl || '',
      featured: Boolean(p.featured),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        showToast('Product updated.');
      } else {
        await createProduct(form);
        showToast('Product created.');
      }
      setModalOpen(false);
      await refetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      showToast('Product deleted.');
      await refetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const handleOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      showToast(`Order marked ${nextStatus}.`);
      await refetchOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    }
  };

  const handleMarkPaid = async (order: Order) => {
    try {
      await markOrderPaidAdmin(order.id, order.orderType);
      showToast('Cash payment recorded as paid.');
      await refetchOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to mark order paid.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white">
            Shop &amp; Orders
          </h1>
          <p className="text-sm text-neutral-400">
            Manage store inventory and track member order fulfillment.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={tab === 'products' ? 'primary' : 'secondary'}
            onClick={() => setTab('products')}
          >
            Products ({products.length})
          </Button>
          <Button
            variant={tab === 'orders' ? 'primary' : 'secondary'}
            onClick={() => setTab('orders')}
          >
            Orders ({orders.length})
          </Button>
        </div>
      </div>

      {tab === 'products' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus size={16} />
              <span>Add Product</span>
            </Button>
          </div>

          {prodLoading ? (
            <Loader label="Loading products..." />
          ) : products.length === 0 ? (
            <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
              No products in Firestore yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg overflow-hidden bg-[#14171A] border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#0B0D0E]">
                      <MediaFrame src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-xs text-neutral-400">
                        {p.category} &middot; Stock: {p.stock}
                      </p>
                      <h2 className="font-display text-xl font-bold uppercase text-white">
                        {p.name}
                      </h2>
                      <p className="font-mono text-base font-bold text-[var(--accent)] tabular-nums">
                        {formatCurrency(p.price, settings.currencySymbol)}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : ordersLoading ? (
        <Loader label="Loading orders..." />
      ) : orders.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No customer orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-lg bg-[#14171A] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs font-mono text-neutral-400">
                  #{order.id.slice(0, 8)} &middot; {order.orderType.toUpperCase()} &middot;{' '}
                  {formatDate(order.createdAt)}
                </p>
                <p className="font-semibold text-white">
                  {order.customerName} ({order.customerEmail} &middot; {order.customerPhone})
                </p>
                <p className="text-xs text-neutral-300">
                  {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                </p>
                <p className="text-xs text-neutral-400">
                  {order.paymentMethod} &middot; {order.shippingAddress} &middot;{' '}
                  <span
                    className={
                      order.paymentStatus === 'paid'
                        ? 'text-[var(--accent)] font-semibold uppercase'
                        : 'text-amber-400 font-semibold uppercase'
                    }
                  >
                    Payment: {order.paymentStatus || 'unpaid'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <span className="font-mono text-lg font-bold tabular-nums text-[var(--accent)]">
                  {formatCurrency(order.total, settings.currencySymbol)}
                </span>
                {order.paymentStatus !== 'paid' && order.status !== 'cancelled' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarkPaid(order)}
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark as Paid</span>
                  </Button>
                ) : null}
                <select
                  value={order.status}
                  onChange={(e) => handleOrderStatus(order.id, e.target.value as OrderStatus)}
                  aria-label="Update order status"
                  className="min-h-[40px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-xs uppercase font-semibold text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ImageUpload
            label="Product Image"
            value={form.imageUrl}
            onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
            folder="products"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Category</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Price</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Compare-At Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, compareAtPrice: Number(e.target.value) }))
                }
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Stock Qty</label>
              <input
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full p-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
