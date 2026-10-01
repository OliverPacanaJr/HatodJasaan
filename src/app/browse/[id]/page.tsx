'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency, getBusinessTypeLabel } from '@/lib/utils';
import { BARANGAYS, PAYMENT_MODES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { StarRating } from '@/components/ui/star-rating';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageSkeleton } from '@/components/ui/skeleton';
import type { Business, MenuCategory, MenuItem, PaymentMode } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  XMarkIcon,
  TruckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', params.id)
        .single();

      if (!biz) { setLoading(false); return; }
      setBusiness(biz);

      const [catsRes, itemsRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('business_id', biz.id)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', biz.id)
          .eq('is_available', true)
          .order('sort_order'),
      ]);

      setCategories(catsRes.data || []);
      setItems(itemsRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [params.id, supabase]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string | null, MenuItem[]>();
    items.forEach((item) => {
      const key = item.category_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [items]);

  const getItemQuantity = (itemId: string) => {
    return cart.items.find((i) => i.menuItem.id === itemId)?.quantity || 0;
  };

  const handlePlaceOrder = async () => {
    if (!user || !business) return;
    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    if (cart.items.length === 0) return;

    setPlacing(true);
    const subtotal = cart.getSubtotal();
    const deliveryFee = 25;
    const total = subtotal + deliveryFee;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        business_id: business.id,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_mode: paymentMode,
        delivery_address: deliveryAddress,
        customer_notes: orderNotes || null,
      })
      .select()
      .single();

    if (error || !order) {
      toast.error('Failed to place order. Please try again.');
      setPlacing(false);
      return;
    }

    const orderItems = cart.items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.menuItem.id,
      item_name: i.menuItem.name,
      quantity: i.quantity,
      unit_price: i.menuItem.price,
      total_price: i.menuItem.price * i.quantity,
      notes: i.notes || null,
    }));

    await supabase.from('order_items').insert(orderItems);

    cart.clearCart();
    setCartOpen(false);
    toast.success('Order placed successfully!');
    router.push(`/order/${order.id}`);
  };

  if (loading) return <PageSkeleton />;
  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BuildingStorefrontIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Business not found</h2>
          <Link href="/browse" className="btn-primary">Back to Browse</Link>
        </div>
      </div>
    );
  }

  const cartItemCount = cart.getItemCount();
  const cartSubtotal = cart.getSubtotal();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center">
              <TruckIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">HatodJasaan</span>
          </Link>
        </div>
      </header>

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-brand-400 to-brand-600">
        {business.cover_url && (
          <Image src={business.cover_url} alt={business.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <main className="max-w-5xl mx-auto px-4 -mt-16 relative z-10 pb-32">
        {/* Business Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-20 w-20 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-white shadow-md -mt-14 sm:-mt-10">
              {business.logo_url ? (
                <Image src={business.logo_url} alt="" width={80} height={80} className="object-cover" />
              ) : (
                <BuildingStorefrontIcon className="h-10 w-10 text-brand-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
                <Badge variant={business.is_open ? 'success' : 'default'}>
                  {business.is_open ? 'Open Now' : 'Closed'}
                </Badge>
              </div>
              {business.description && (
                <p className="text-sm text-slate-500 mb-3">{business.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <Badge variant="info">{getBusinessTypeLabel(business.business_type)}</Badge>
                <div className="flex items-center gap-1">
                  <StarRating rating={business.rating} size="sm" />
                  <span className="text-slate-500">({business.total_ratings})</span>
                </div>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-slate-400" />
                  ~{business.avg_prep_time_mins} min prep
                </span>
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  {business.address}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <CreditCardIcon className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">Accepts:</span>
                {business.payment_modes?.map((mode) => (
                  <Badge key={mode} variant="default" size="sm">{mode.toUpperCase()}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-8">
          {categories.length > 0 ? (
            categories.map((cat) => {
              const catItems = itemsByCategory.get(cat.id) || [];
              if (catItems.length === 0) return null;
              return (
                <section key={cat.id}>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">{cat.name}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {catItems.map((item) => {
                      const qty = getItemQuantity(item.id);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {item.image_url && (
                            <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0">
                              <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <p className="text-brand-600 font-bold text-sm mt-2">
                              {formatCurrency(item.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-1">
                                  <button
                                    onClick={() => cart.updateQuantity(item.id, qty - 1)}
                                    className="p-1 rounded-md hover:bg-brand-100 text-brand-600"
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-semibold text-brand-700">{qty}</span>
                                  <button
                                    onClick={() => cart.updateQuantity(item.id, qty + 1)}
                                    className="p-1 rounded-md hover:bg-brand-100 text-brand-600"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cart.addItem(business.id, business.name, item)}
                                  disabled={!business.is_open}
                                >
                                  <PlusIcon className="h-3.5 w-3.5" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <>
              {/* Show uncategorized items */}
              {items.length > 0 ? (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Menu</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => {
                      const qty = getItemQuantity(item.id);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {item.image_url && (
                            <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0">
                              <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <p className="text-brand-600 font-bold text-sm mt-2">{formatCurrency(item.price)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-1">
                                  <button
                                    onClick={() => cart.updateQuantity(item.id, qty - 1)}
                                    className="p-1 rounded-md hover:bg-brand-100 text-brand-600"
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-semibold text-brand-700">{qty}</span>
                                  <button
                                    onClick={() => cart.updateQuantity(item.id, qty + 1)}
                                    className="p-1 rounded-md hover:bg-brand-100 text-brand-600"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cart.addItem(business.id, business.name, item)}
                                  disabled={!business.is_open}
                                >
                                  <PlusIcon className="h-3.5 w-3.5" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <div className="text-center py-16">
                  <BuildingStorefrontIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No menu items yet</h3>
                  <p className="text-sm text-slate-500">This business hasn&apos;t added menu items yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Sticky Cart Bar */}
      {cartItemCount > 0 && cart.businessId === business.id && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart
              </p>
              <p className="text-xs text-slate-500">Subtotal: {formatCurrency(cartSubtotal)}</p>
            </div>
            <Button onClick={() => setCartOpen(true)}>
              <ShoppingCartIcon className="h-4 w-4" />
              View Cart
            </Button>
          </div>
        </div>
      )}

      {/* Cart / Checkout Modal */}
      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Your Cart" size="lg">
        <div className="space-y-6">
          {/* Items */}
          <div className="space-y-3">
            {cart.items.map((ci) => (
              <div key={ci.menuItem.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{ci.menuItem.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(ci.menuItem.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-1">
                    <button
                      onClick={() => cart.updateQuantity(ci.menuItem.id, ci.quantity - 1)}
                      className="p-1 text-slate-500 hover:text-slate-700"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{ci.quantity}</span>
                    <button
                      onClick={() => cart.updateQuantity(ci.menuItem.id, ci.quantity + 1)}
                      className="p-1 text-slate-500 hover:text-slate-700"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-20 text-right">
                    {formatCurrency(ci.menuItem.price * ci.quantity)}
                  </span>
                  <button
                    onClick={() => cart.removeItem(ci.menuItem.id)}
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Details */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <Input
              label="Delivery Address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Complete delivery address in Jasaan"
              icon={<MapPinIcon className="h-5 w-5" />}
            />
            <div>
              <label className="label-field">Payment Method</label>
              <div className="flex flex-wrap gap-2">
                {(business.payment_modes || ['cash']).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      paymentMode === mode
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Delivery fee is always paid in cash to the rider.
              </p>
            </div>
            <Textarea
              label="Notes (optional)"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Special instructions, landmarks, etc."
            />
          </div>

          {/* Summary */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Delivery Fee (cash)</span>
              <span className="text-slate-700">{formatCurrency(25)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-900">Total</span>
              <span className="text-brand-600">{formatCurrency(cartSubtotal + 25)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCartOpen(false)} className="flex-1">
              Continue Shopping
            </Button>
            <Button onClick={handlePlaceOrder} loading={placing} className="flex-1" disabled={!user}>
              {user ? 'Place Order' : 'Sign in to Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
