"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  ChefHat, 
  Utensils, 
  Clock, 
  ArrowLeft,
  Bell,
  Star,
  MessageCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function OrderStatusPage({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string, orderId: string }> }) {
  const params = use(paramsPromise);
  const { restaurantSlug, orderId } = params;
  
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchOrder();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(payload.new);
        toast.success(`Order status updated to ${payload.new.status}!`);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function fetchOrder() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, menu_items(*))")
        .eq("id", orderId)
        .single();
      
      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff5a2c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const steps = [
    { status: 'pending', label: 'Order Received', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { status: 'preparing', label: 'Cooking', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-50' },
    { status: 'ready', label: 'Ready for Pick-up', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { status: 'completed', label: 'Enjoy your meal', icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-50' }
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order?.status);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#1a1c2e] font-sans pb-20">
      {/* Top Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <button 
          onClick={() => router.push(`/restaurant/${restaurantSlug}/dine-in`)}
          className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Track Order</span>
        <button className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100">
          <Bell size={20} />
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-10">
        {/* Order Success Hero */}
        <section className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20"
          >
            <CheckCircle2 className="text-white" size={40} />
          </motion.div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Ordered Successfully!</h1>
          <p className="text-sm font-medium text-slate-400">Order ID: #{orderId.slice(-6).toUpperCase()}</p>
        </section>

        {/* Real-time Tracking Timeline */}
        <section className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-50">
          <div className="space-y-12">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div key={step.status} className="flex gap-6 relative">
                  {/* Timeline Line */}
                  {idx !== steps.length - 1 && (
                    <div className={`absolute left-7 top-14 w-0.5 h-12 ${isPast ? 'bg-[#ff5a2c]' : 'bg-slate-100'}`} />
                  )}
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                    isCurrent ? 'bg-[#ff5a2c] shadow-lg shadow-orange-500/20' : isPast ? 'bg-orange-50' : 'bg-slate-50'
                  }`}>
                    <Icon className={isCurrent ? 'text-white' : isPast ? 'text-[#ff5a2c]' : 'text-slate-300'} size={24} />
                  </div>
                  
                  <div className="flex-1 pt-2">
                    <h3 className={`font-bold text-base uppercase tracking-tight ${isCurrent ? 'text-[#1a1c2e]' : isPast ? 'text-slate-600' : 'text-slate-300'}`}>
                      {step.label}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      {isCurrent ? "We're currently working on this..." : isPast ? "Completed" : "Next step"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Order Summary Card */}
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 space-y-6">
          <h2 className="text-lg font-bold">Your Selection</h2>
          <div className="space-y-4">
            {order?.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-50 text-slate-400 text-[10px] font-black flex items-center justify-center rounded-lg border border-slate-100">
                    {item.quantity}x
                  </span>
                  <span className="text-sm font-bold text-slate-600">{item.menu_items?.name}</span>
                </div>
                <span className="text-sm font-black">₹{item.total_price}.00</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-slate-50" />
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-[#ff5a2c]">Total Paid</span>
            <span className="text-xl font-black">₹{order?.total_amount}.00</span>
          </div>
        </section>

        {/* Support Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-3 font-bold text-sm shadow-sm hover:bg-slate-50">
            <MessageCircle size={20} className="text-blue-500" />
            Support
          </button>
          <button className="h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-3 font-bold text-sm shadow-sm hover:bg-slate-50">
            <Star size={20} className="text-yellow-400" />
            Rate Us
          </button>
        </div>
      </main>

      <footer className="text-center pt-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
        Powered by ZapMenus
      </footer>
    </div>
  );
}
