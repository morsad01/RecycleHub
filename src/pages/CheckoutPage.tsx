import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Truck, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button, Input } from '../components/ui';
import { formatPrice } from '../lib/utils';
import type { Address } from '../types';

export function CheckoutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Address Form State
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);

  // Delivery Method state
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'pickup'>('standard');

  // Payment Provider state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'stripe'>('cod');

  // Fetch cart items
  const { data: cartItems } = useQuery({
    queryKey: ['cart-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Fetch saved addresses
  const { data: addresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id);
      return (data ?? []) as Address[];
    },
    enabled: !!user,
  });

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: async () => {
      const addressData = {
        user_id: user!.id,
        label: newLabel,
        full_address: newAddress,
        city: newCity,
        area: newArea,
        phone: newPhone,
        is_default: isDefaultAddress,
      };
      const { data } = await supabase.from('addresses').insert(addressData).select('id').single();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      if (data?.id) setSelectedAddressId(data.id);
      setAddingAddress(false);
      setNewAddress('');
      setNewCity('');
      setNewArea('');
      setNewPhone('');
      toast('Address added successfully', 'success');
    },
  });

  // Order Placement logic
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const items = cartItems ?? [];
      const orderIds: string[] = [];

      for (const item of items) {
        if (!item.product) continue;
        const totalAmount = item.product.price * item.quantity;
        const deliveryCharge = deliveryMethod === 'standard' ? 120 : 0;

        const orderData = {
          buyer_id: user!.id,
          seller_id: item.product.seller_id,
          product_id: item.product.id,
          quantity: item.quantity,
          total_amount: totalAmount + deliveryCharge,
          delivery_charge: deliveryCharge,
          delivery_address_id: deliveryMethod === 'standard' ? selectedAddressId : null,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid',
          status: 'pending',
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id')
          .single();

        if (orderError) throw orderError;

        // Persist transaction if paid online
        if (paymentMethod !== 'cod' && order) {
          const transactionData = {
            user_id: user!.id,
            order_id: order.id,
            amount: totalAmount + deliveryCharge,
            provider: paymentMethod,
            transaction_id: `TXN-${crypto.randomUUID().slice(0, 18).toUpperCase()}`,
            status: 'success',
          };
          await supabase.from('transactions').insert(transactionData);
        }

        // Notify seller
        const notifyData = {
          user_id: item.product.seller_id,
          title: 'New Purchase Order Received',
          message: `Buyer placed an order for your listing: "${item.product.title}".`,
          type: 'order',
          is_read: false,
        };
        await supabase.from('notifications').insert(notifyData);

        orderIds.push(order.id);
      }

      // Delete cart items
      await supabase.from('cart_items').delete().eq('user_id', user!.id);
      return orderIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast('Order placed successfully!', 'success');
      navigate('/orders');
    },
    onError: (err: any) => {
      toast(err.message || 'Error placing order', 'error');
    },
  });

  const handleNextStep = () => {
    if (step === 0 && !selectedAddressId && deliveryMethod === 'standard') {
      toast('Please select or add a delivery address', 'error');
      return;
    }
    setStep((prev) => (prev + 1) as any);
  };

  const activeAddress = addresses?.find((a) => a.id === selectedAddressId);
  const items = cartItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const shippingFee = deliveryMethod === 'standard' ? 120 : 0;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + shippingFee + tax;

  const stepsList = ['Address', 'Delivery', 'Payment', 'Review'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Secure Checkout</h1>

      {/* Steps indicators */}
      <div className="flex justify-between items-center mb-8 border border-neutral-100 bg-white p-4 rounded-3xl">
        {stepsList.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === i
                ? 'bg-primary-500 text-white shadow-md'
                : step > i
                ? 'bg-success-100 text-success-600'
                : 'bg-neutral-100 text-neutral-400'
            }`}>
              {step > i ? <CheckCircle2 size={16} /> : i + 1}
            </span>
            <span className={`text-xs font-semibold hidden sm:inline ${step === i ? 'text-primary-600' : 'text-neutral-500'}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Main forms content */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm min-h-[300px]">
          {/* STEP 0: ADDRESS */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5"><MapPin size={16} className="text-primary-500" /> Delivery Location</h2>

              {addingAddress ? (
                <div className="space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 animate-scale-in">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Address Tag Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Home/Office" />
                    <Input label="Phone Number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                  </div>
                  <Input label="Full Address Details" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} required />
                    <Input label="Area" value={newArea} onChange={(e) => setNewArea(e.target.value)} required />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-bold text-neutral-600">
                    <input type="checkbox" checked={isDefaultAddress} onChange={(e) => setIsDefaultAddress(e.target.checked)} className="rounded" /> Set as Default Address
                  </label>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAddingAddress(false)}>Cancel</Button>
                    <Button type="button" size="sm" onClick={() => addAddressMutation.mutate()}>Save Address</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer hover:bg-neutral-50 transition-colors ${selectedAddressId === addr.id ? 'border-primary-500 bg-primary-50/20' : 'border-neutral-200'}`}>
                          <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1" />
                          <div className="text-xs">
                            <span className="font-bold text-neutral-900">{addr.label}</span>
                            <p className="text-neutral-500 mt-0.5">{addr.full_address}, {addr.city}</p>
                            <p className="text-neutral-400 font-semibold mt-0.5">Phone: {addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">No saved addresses found.</p>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddingAddress(true)}>Add New Address</Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: DELIVERY */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5"><Truck size={16} className="text-primary-500" /> Delivery Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer hover:bg-neutral-50 transition-colors ${deliveryMethod === 'standard' ? 'border-primary-500 bg-primary-50/20' : 'border-neutral-200'}`}>
                  <input type="radio" checked={deliveryMethod === 'standard'} onChange={() => setDeliveryMethod('standard')} className="mt-1" />
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900">Standard Delivery</span>
                    <p className="text-neutral-500 mt-1">Delivered to address via courier services (Est: 2-3 days).</p>
                    <p className="font-bold text-primary-600 mt-1">Cost: ৳120</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer hover:bg-neutral-50 transition-colors ${deliveryMethod === 'pickup' ? 'border-primary-500 bg-primary-50/20' : 'border-neutral-200'}`}>
                  <input type="radio" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="mt-1" />
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900">Store Pickup</span>
                    <p className="text-neutral-500 mt-1">Collect directly from the seller location safely.</p>
                    <p className="font-bold text-success-600 mt-1">Cost: Free</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5"><CreditCard size={16} className="text-primary-500" /> Payment Provider</h2>
              <div className="space-y-2">
                {[
                  { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Pay directly during courier transit drops.' },
                  { id: 'bkash', name: 'bKash Merchant Pay', desc: 'Secure mobile payment with OTP verification.' },
                  { id: 'nagad', name: 'Nagad Mobile Finance', desc: 'Settle securely using bKash/Nagad digital channels.' },
                  { id: 'stripe', name: 'Stripe International Cards', desc: 'Pay instantly using secure credit or debit cards.' }
                ].map((prov) => (
                  <label key={prov.id} className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer hover:bg-neutral-50 transition-colors ${paymentMethod === prov.id ? 'border-primary-500 bg-primary-50/20' : 'border-neutral-200'}`}>
                    <input type="radio" checked={paymentMethod === prov.id} onChange={() => setPaymentMethod(prov.id as any)} className="mt-1" />
                    <div className="text-xs">
                      <span className="font-bold text-neutral-900">{prov.name}</span>
                      <p className="text-neutral-500 mt-0.5">{prov.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-neutral-800">Review Your Purchase</h2>

              <div className="text-xs space-y-2.5 bg-neutral-50 p-4 rounded-2xl">
                {deliveryMethod === 'standard' && activeAddress && (
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-500 font-semibold">Shipping To</span>
                    <span className="text-right font-medium">{activeAddress.full_address}, {activeAddress.city}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-500 font-semibold">Delivery Method</span>
                  <span className="font-medium capitalize">{deliveryMethod} Delivery</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Payment Method</span>
                  <span className="font-medium uppercase">{paymentMethod}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-success-50 text-success-800 rounded-2xl border border-success-100">
                <ShieldCheck size={18} className="shrink-0" />
                <span className="text-2xs font-semibold">RecycleHub secure buyer protection guarantees authentic products.</span>
              </div>
            </div>
          )}

          {/* Buttons panel */}
          <div className="flex justify-between pt-6 border-t border-neutral-100 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 0) setStep((step - 1) as any);
                else navigate('/cart');
              }}
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>

            {step < 3 ? (
              <Button onClick={handleNextStep}>
                Next <ArrowRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={() => placeOrderMutation.mutate()} loading={placeOrderMutation.isPending}>
                Place Order (Confirm)
              </Button>
            )}
          </div>
        </div>

        {/* Pricing details sidebar panel */}
        <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-neutral-900 text-sm">Summary Breakdown</h3>
          <div className="divide-y divide-neutral-100">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between gap-2 text-2xs">
                <div>
                  <p className="font-bold text-neutral-800 line-clamp-1">{item.product?.title}</p>
                  <p className="text-neutral-400">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold">{formatPrice((item.product?.price ?? 0) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-3 text-2xs space-y-1.5 text-neutral-500">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping charge:</span><span>{formatPrice(shippingFee)}</span></div>
            <div className="flex justify-between"><span>Estimated tax (5%):</span><span>{formatPrice(tax)}</span></div>
            <div className="flex justify-between font-bold text-xs text-neutral-900 border-t border-neutral-100 pt-2">
              <span>Grand Total:</span><span className="text-primary-600">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
