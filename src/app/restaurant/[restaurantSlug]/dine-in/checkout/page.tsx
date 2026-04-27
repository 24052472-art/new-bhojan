"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  User, 
  Phone,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function CheckoutPage({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string }> }) {
  const params = use(paramsPromise);
  const { restaurantSlug } = params;
  
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Load session
    const savedSession = localStorage.getItem('bhojan_session');
    if (savedSession) setSession(JSON.parse(savedSession));

    // Load cart
    const savedCart = localStorage.getItem('bhojan_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    fetchRestaurant();
  }, [restaurantSlug]);

  async function fetchRestaurant() {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", restaurantSlug)
        .single();
      
      if (error) throw error;
      setRestaurant(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const updateQty = (uniqueId: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.uniqueId === uniqueId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      localStorage.setItem('bhojan_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeItem = (uniqueId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.uniqueId !== uniqueId);
      localStorage.setItem('bhojan_cart', JSON.stringify(newCart));
      return newCart;
    });
    toast.success("Item removed");
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !session) return;
    setIsPlacing(true);
    try {
      const totalAmount = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          restaurant_id: restaurant.id,
          table_id: session.table_id,
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: totalAmount,
          customer_name: session.guest_name || "Guest",
          customer_phone: session.guest_phone || ""
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        notes: item.notes || ""
      }));
      await supabase.from("order_items").insert(orderItems);

      // 3. Update Table Status
      await supabase.from("tables").update({ status: 'occupied' }).eq("id", session.table_id);

      toast.success("Order placed successfully!");
      localStorage.removeItem('bhojan_cart');
      router.push(`/restaurant/${restaurantSlug}/order/${order.id}/status`); // Redirect to premium tracking
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
      </div>
    );
  }

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans pb-40">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
        <button 
          onClick={() => router.back()}
          className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em]">Checkout</h1>
        <div className="w-11" />
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-10">
        {/* Table & Guest Info Card */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <MapPin className="text-[#ff5a2c]" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Station</p>
              <h3 className="text-xl font-bold text-[#1a1c2e]">Table {session?.table_number || "N/A"}</h3>
            </div>
          </div>
          
          <div className="h-px bg-slate-50" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <User className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guest Name</p>
              <h3 className="text-xl font-bold text-[#1a1c2e]">{session?.guest_name || "Guest"}</h3>
            </div>
          </div>
        </section>

        {/* Order Summary Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1c2e]">Order Summary</h2>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{cart.length} Items</span>
          </div>

          <div className="space-y-4">
            {cart.map((item) => (
              <motion.div 
                key={item.uniqueId}
                layout
                className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50 flex gap-4"
              >
                <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-slate-100 shrink-0">
                  <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-[#1a1c2e] leading-tight pr-4">{item.name}</h4>
                    <button onClick={() => removeItem(item.uniqueId)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-[#1a1c2e]">₹{item.price * item.quantity}.00</span>
                    
                    <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <button onClick={() => updateQty(item.uniqueId, -1)} className="text-slate-400 hover:text-[#ff5a2c]"><Minus size={14} /></button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.uniqueId, 1)} className="text-slate-400 hover:text-[#ff5a2c]"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {cart.length === 0 && (
              <div className="py-20 text-center space-y-4">
                 <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto opacity-20">
                    <CreditCard size={32} />
                 </div>
                 <p className="text-sm font-bold text-slate-400">Your cart is empty.</p>
                 <button 
                  onClick={() => router.push(`/restaurant/${restaurantSlug}/dine-in`)}
                  className="text-xs font-black uppercase tracking-widest text-[#ff5a2c]"
                >
                  Browse Menu
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Pricing Summary Card */}
        {cart.length > 0 && (
          <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-50 space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-[#1a1c2e]">₹{subtotal}.00</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-400">GST (5%)</span>
              <span className="text-[#1a1c2e]">₹{tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-50 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#1a1c2e]">Grand Total</span>
              <span className="text-3xl font-black text-[#1a1c2e]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Place Order Button */}
      {cart.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-50 z-50">
          <div className="max-w-xl mx-auto">
            <button 
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full h-18 bg-[#ff5a2c] hover:bg-[#ea580c] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPlacing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  Confirm Order
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
