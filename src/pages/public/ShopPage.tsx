/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/ShopPage.tsx
 * Purpose: E-commerce pro shop with live search, category filter, product detail modal,
 *          localStorage-persisted cart drawer, and dual Cash / Online Checkout flow.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { createOrder, getProducts } from '../../services/shopService';
import { startOnlineCheckout } from '../../services/paymentsService';
import { sampleProducts } from '../../utils/seedData.js';
import { gymConfig } from '../../config/gymConfig.js';
import { useSite } from '../../context/SiteContext';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { Product } from '../../types/models';
import { MediaFrame } from '../../components/common/MediaFrame';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ManualPaymentFields } from '../../components/sections/ManualPaymentFields';
import {
  getManualPaymentOptions,
  manualPaymentMethodLabel,
  manualPaymentNote,
  validateManualPayment,
} from '../../utils/paymentOptions';
import { Loader } from '../../components/common/Loader';
import { validateCheckoutForm } from '../../utils/validators';
import { formatCurrency } from '../../utils/helpers';

export default function ShopPage() {
  const { settings, showToast } = useSite();
  const { items, itemCount, subtotal, addToCart, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: products, loading } = useFirestore(() => getProducts(50), sampleProducts);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(searchParams.get('cart') === 'open');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<string>('cash');
  const [manualTid, setManualTid] = useState('');
  const [manualSender, setManualSender] = useState('');
  const manualOptions = useMemo(() => getManualPaymentOptions(), []);
  const selectedManual = manualOptions.find((o) => o.id === checkoutMode);

  // Force only Cash + Easypaisa + JazzCash (no Visa/Mastercard)
  const onlineEnabled = false;

  const paymentChoices = useMemo(
    () => [
      { id: 'cash', label: 'Pay at Gym / Cash' },
      ...manualOptions.map((o) => ({ id: o.id, label: o.label })),
    ],
    [manualOptions]
  );

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: profile?.displayName || user?.displayName || '',
    customerEmail: user?.email || '',
    customerPhone: profile?.phone || '',
    shippingAddress: 'Front Desk Club Pickup',
    paymentMethod: gymConfig.paymentMethods[0],
    notes: '',
  });

  useEffect(() => {
    if (searchParams.get('cart') === 'open') {
      setCartOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user || profile) {
      setCheckoutForm((prev) => ({
        ...prev,
        customerName: prev.customerName || profile?.displayName || user?.displayName || '',
        customerEmail: prev.customerEmail || user?.email || '',
        customerPhone: prev.customerPhone || profile?.phone || '',
      }));
    }
  }, [user, profile]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = category === 'All' || p.category === category;
      const matchesText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesText;
    });
  }, [products, category, search]);

  const closeCart = () => {
    setCartOpen(false);
    if (searchParams.has('cart')) {
      searchParams.delete('cart');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!user) {
      showToast('Please sign in to place your shop order.', 'info');
      navigate('/login');
      return;
    }

    const validationError = validateCheckoutForm(checkoutForm);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    if (selectedManual) {
      const manualError = validateManualPayment(manualTid, manualSender);
      if (manualError) {
        showToast(manualError, 'error');
        return;
      }
    }

    setPlacingOrder(true);
    try {
      if (checkoutMode === 'online') {
        if (!onlineEnabled) {
          showToast(
            'Online payments are disabled while paymentProvider is set to "cash". Choose Pay at Gym or update Site Settings.',
            'info'
          );
          setPlacingOrder(false);
          return;
        }
        // Send ONLY product IDs and quantities; server resolves official Firestore prices.
        const { sessionUrl } = await startOnlineCheckout({
          orderType: 'shop',
          items: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
          customerName: checkoutForm.customerName,
          customerEmail: checkoutForm.customerEmail,
          customerPhone: checkoutForm.customerPhone,
          shippingAddress: checkoutForm.shippingAddress,
          notes: checkoutForm.notes,
        });
        clearCart();
        window.location.href = sessionUrl;
        return;
      }

      await createOrder({
        userId: user.uid,
        customerName: checkoutForm.customerName,
        customerEmail: checkoutForm.customerEmail,
        customerPhone: checkoutForm.customerPhone,
        shippingAddress: checkoutForm.shippingAddress,
        items: items.map((i) => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: subtotal,
        paymentMethod: selectedManual
          ? manualPaymentMethodLabel(selectedManual, manualTid, manualSender)
          : checkoutForm.paymentMethod,
        orderType: 'shop',
        notes: selectedManual
          ? [manualPaymentNote(selectedManual, manualTid, manualSender), checkoutForm.notes]
              .filter(Boolean)
              .join(' ')
          : checkoutForm.notes,
      });
      clearCart();
      closeCart();
      setManualTid('');
      setManualSender('');
      showToast(
        selectedManual
          ? `Order received. We will verify your ${selectedManual.label} payment and confirm shortly.`
          : 'Order confirmed. Track your pickup/delivery in Member Orders.'
      );
      navigate('/member/orders');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Checkout failed.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="container-club py-16 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Pro Shop
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase text-white leading-none">
            Gear &amp; Nutrition
          </h1>
          <p className="text-neutral-400">
            Order supplements, lifting gear, and club apparel. Pay online or at the gym front desk.
          </p>
        </div>

        <Button variant="secondary" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={17} />
          <span>Cart ({itemCount})</span>
          <span className="font-mono tabular-nums text-[var(--accent)]">
            {formatCurrency(subtotal, settings.currencySymbol)}
          </span>
        </Button>
      </div>

      {/* Search & Category Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`min-h-[40px] px-4 rounded text-xs font-semibold uppercase tracking-wider border transition-colors ${
                category === cat
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                  : 'bg-[#14171A] text-neutral-300 border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            aria-label="Search shop products"
            className="w-full min-h-[42px] pl-10 pr-4 rounded bg-[#14171A] border border-white/15 text-sm text-white placeholder-neutral-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <Loader label="Loading shop catalog..." />
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No products matched your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-lg overflow-hidden bg-[#14171A] border border-white/10 hover:border-white/25 transition-colors flex flex-col"
            >
              <button
                type="button"
                onClick={() => setDetailProduct(product)}
                className="aspect-[4/3] overflow-hidden bg-[#0B0D0E] block text-left"
              >
                <MediaFrame
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform"
                />
              </button>
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-neutral-400">
                    {product.category} &middot;{' '}
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="text-left font-display text-xl font-bold uppercase text-white hover:text-[var(--accent)] mt-1 leading-tight"
                  >
                    {product.name}
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg font-bold tabular-nums text-[var(--accent)]">
                      {formatCurrency(product.price, settings.currencySymbol)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price ? (
                      <span className="font-mono text-xs line-through tabular-nums text-neutral-500">
                        {formatCurrency(product.compareAtPrice, settings.currencySymbol)}
                      </span>
                    ) : null}
                  </div>

                  <Button
                    fullWidth
                    size="sm"
                    disabled={product.stock <= 0}
                    onClick={() => {
                      addToCart(product, 1);
                      showToast(`Added ${product.name} to cart.`);
                    }}
                  >
                    {product.stock > 0 ? 'Add To Cart' : 'Sold Out'}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <Modal
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        title={detailProduct?.name}
      >
        {detailProduct ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="aspect-[4/3] rounded overflow-hidden border border-white/10 bg-black">
              <MediaFrame
                src={detailProduct.imageUrl}
                alt={detailProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-xs text-[var(--accent)]">{detailProduct.category}</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-white">
                  {formatCurrency(detailProduct.price, settings.currencySymbol)}
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {detailProduct.description}
                </p>
              </div>
              <Button
                fullWidth
                disabled={detailProduct.stock <= 0}
                onClick={() => {
                  addToCart(detailProduct, 1);
                  setDetailProduct(null);
                  setCartOpen(true);
                }}
              >
                Add To Cart
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Cart & Checkout Modal */}
      <Modal
        open={cartOpen}
        onClose={closeCart}
        title={`Your Cart (${itemCount})`}
        maxWidth="max-w-3xl"
      >
        {items.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-neutral-400">Your shopping cart is currently empty.</p>
            <Button variant="secondary" onClick={closeCart}>
              Continue Browsing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="p-3 rounded bg-[#0B0D0E] border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs font-mono tabular-nums text-[var(--accent)]">
                      {formatCurrency(item.price, settings.currencySymbol)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded bg-[#14171A] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center font-mono text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded bg-[#14171A] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      aria-label="Remove item"
                      className="w-8 h-8 rounded text-red-400 hover:bg-red-500/10 flex items-center justify-center ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Order Total</span>
                <span className="font-mono text-xl font-bold tabular-nums text-white">
                  {formatCurrency(subtotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="lg:col-span-6 space-y-3">
              <h3 className="font-display text-xl font-bold uppercase text-white">
                Checkout Details
              </h3>

              {/* Payment Choice: Cash vs Online */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Payment Option</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => setCheckoutMode(choice.id)}
                      className={`min-h-[42px] px-3 rounded text-xs font-semibold border transition-colors ${
                        checkoutMode === choice.id
                          ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                          : 'bg-[#0B0D0E] text-neutral-300 border-white/15'
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={checkoutForm.customerName}
                  onChange={(e) =>
                    setCheckoutForm((p) => ({ ...p, customerName: e.target.value }))
                  }
                  className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={checkoutForm.customerEmail}
                  onChange={(e) =>
                    setCheckoutForm((p) => ({ ...p, customerEmail: e.target.value }))
                  }
                  className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={checkoutForm.customerPhone}
                  onChange={(e) =>
                    setCheckoutForm((p) => ({ ...p, customerPhone: e.target.value }))
                  }
                  placeholder="03XX XXXXXXX"
                  className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Pickup or Delivery Address
                </label>
                <input
                  type="text"
                  value={checkoutForm.shippingAddress}
                  onChange={(e) =>
                    setCheckoutForm((p) => ({ ...p, shippingAddress: e.target.value }))
                  }
                  className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
                />
              </div>

              {checkoutMode === 'cash' ? (
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Cash Method</label>
                  <select
                    value={checkoutForm.paymentMethod}
                    onChange={(e) =>
                      setCheckoutForm((p) => ({ ...p, paymentMethod: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white"
                  >
                    {gymConfig.paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {selectedManual ? (
                <ManualPaymentFields
                  option={selectedManual}
                  amount={subtotal}
                  tid={manualTid}
                  sender={manualSender}
                  onTidChange={setManualTid}
                  onSenderChange={setManualSender}
                />
              ) : null}

              <Button type="submit" fullWidth loading={placingOrder}>
                {!user
                  ? 'Sign In To Place Order'
                  : checkoutMode === 'online'
                    ? 'Proceed To Card Payment'
                    : selectedManual
                      ? 'Submit Order & Payment Details'
                      : 'Confirm Order'}
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
