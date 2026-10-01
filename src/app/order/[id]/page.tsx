'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { StarRating } from '@/components/ui/star-rating';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { PageSkeleton } from '@/components/ui/skeleton';
import type { Order, OrderItem, Business, Profile, Review } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const ORDER_STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'on_the_way', label: 'On the Way' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [rider, setRider] = useState<Profile | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bizRating, setBizRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [comment, setComment] = useState('');
  const supabase = createClient();

  const fetchOrder = useCallback(async () => {
    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();
    if (!o) { setLoading(false); return; }
    setOrder(o);

    const [itemsRes, bizRes, reviewRes] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', o.id),
      supabase.from('businesses').select('*').eq('id', o.business_id).single(),
      supabase.from('reviews').select('*').eq('order_id', o.id).maybeSingle(),
    ]);

    setItems(itemsRes.data || []);
    setBusiness(bizRes.data);
    setReview(reviewRes.data);

    if (o.rider_id) {
      const { data: r } = await supabase.from('profiles').select('*').eq('id', o.rider_id).single();
      setRider(r);
    }

    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime updates
  useEffect(() => {
    if (!order) return;
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => {
          setOrder(payload.new as Order);
          if ((payload.new as Order).rider_id && !(payload.old as Order).rider_id) {
            supabase
              .from('profiles')
              .select('*')
              .eq('id', (payload.new as Order).rider_id!)
              .single()
              .then(({ data }) => setRider(data));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id, supabase]);

  const handleSubmitReview = async () => {
    if (!order || !user) return;
    setSubmittingReview(true);

    const { error } = await supabase.from('reviews').insert({
      order_id: order.id,
      customer_id: user.id,
      business_id: order.business_id,
      rider_id: order.rider_id,
      business_rating: bizRating,
      rider_rating: order.rider_id ? riderRating : null,
      comment: comment || null,
    });

    if (error) {
      toast.error('Failed to submit review');
    } else {
      toast.success('Review submitted! Salamat!');
      setReviewOpen(false);
      fetchOrder();
    }
    setSubmittingReview(false);
  };

  if (loading) return <PageSkeleton />;
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Order not found</h2>
          <Link href="/dashboard/customer/orders" className="btn-primary">My Orders</Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="font-semibold text-slate-900">{order.order_number}</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status Header */}
        <Card>
          <div className="text-center mb-6">
            {isCancelled ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Order Cancelled
              </div>
            ) : order.status === 'delivered' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircleSolid className="h-5 w-5" />
                Delivered
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-800 rounded-full text-sm font-medium animate-pulse-soft">
                <ClockIcon className="h-5 w-5" />
                {getOrderStatusLabel(order.status)}
              </div>
            )}
          </div>

          {/* Progress Steps */}
          {!isCancelled && (
            <div className="flex items-center justify-between relative px-4">
              <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200">
                <div
                  className="h-full bg-brand-500 transition-all duration-700"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (ORDER_STEPS.length - 1)) * 100)}%`,
                  }}
                />
              </div>
              {ORDER_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const current = i === currentStepIndex;
                return (
                  <div key={step.key} className="relative flex flex-col items-center z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        done
                          ? 'bg-brand-500 text-white shadow-glow'
                          : 'bg-slate-200 text-slate-400'
                      } ${current ? 'scale-125 ring-4 ring-brand-200' : ''}`}
                    >
                      {done ? <CheckCircleIcon className="h-5 w-5" /> : i + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                        done ? 'text-brand-600' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {order.cancellation_reason && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm text-red-700">
              <strong>Reason:</strong> {order.cancellation_reason}
            </div>
          )}
        </Card>

        {/* Business & Rider Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {business && (
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <BuildingStorefrontIcon className="h-5 w-5 text-slate-400" />
                <CardTitle>Business</CardTitle>
              </div>
              <p className="font-medium text-slate-900">{business.name}</p>
              <p className="text-sm text-slate-500">{business.address}</p>
              {business.phone && (
                <p className="text-sm text-slate-500 mt-1">{business.phone}</p>
              )}
            </Card>
          )}

          {rider ? (
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <TruckIcon className="h-5 w-5 text-slate-400" />
                <CardTitle>Your Rider</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <Avatar src={rider.avatar_url} name={rider.full_name} size="md" />
                <div>
                  <p className="font-medium text-slate-900">{rider.full_name}</p>
                  {rider.phone && <p className="text-sm text-slate-500">{rider.phone}</p>}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <TruckIcon className="h-5 w-5 text-slate-400" />
                <CardTitle>Rider</CardTitle>
              </div>
              <p className="text-sm text-slate-500">Waiting for a rider to accept...</p>
            </Card>
          )}
        </div>

        {/* Order Items */}
        <Card>
          <CardTitle>Order Items</CardTitle>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-900">{item.item_name}</span>
                  <span className="text-slate-400 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-medium text-slate-700">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivery Fee</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-brand-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card>
          <CardTitle>Delivery Details</CardTitle>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">{order.delivery_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">Payment: {order.payment_mode.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">Placed: {formatDateTime(order.created_at)}</span>
            </div>
            {order.customer_notes && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Notes: </span>
                <span className="text-slate-700">{order.customer_notes}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Review */}
        {order.status === 'delivered' && !review && (
          <Card className="border-brand-200 bg-brand-50/50">
            <div className="text-center">
              <h3 className="font-semibold text-slate-900 mb-2">How was your experience?</h3>
              <p className="text-sm text-slate-500 mb-4">Leave a review for the business and rider</p>
              <Button onClick={() => setReviewOpen(true)}>Leave a Review</Button>
            </div>
          </Card>
        )}

        {review && (
          <Card>
            <CardTitle>Your Review</CardTitle>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Business:</span>
                <StarRating rating={review.business_rating} size="sm" />
              </div>
              {review.rider_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Rider:</span>
                  <StarRating rating={review.rider_rating} size="sm" />
                </div>
              )}
              {review.comment && (
                <p className="text-sm text-slate-700 italic">&quot;{review.comment}&quot;</p>
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Review Modal */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Leave a Review">
        <div className="space-y-5">
          <div>
            <label className="label-field">Business Rating</label>
            <StarRating rating={bizRating} size="lg" interactive onChange={setBizRating} />
          </div>
          {order.rider_id && (
            <div>
              <label className="label-field">Rider Rating</label>
              <StarRating rating={riderRating} size="lg" interactive onChange={setRiderRating} />
            </div>
          )}
          <Textarea
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setReviewOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} loading={submittingReview} className="flex-1">
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
