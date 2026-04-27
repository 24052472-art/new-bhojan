"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  ChefHat, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function RestaurantLandingPage() {
  const { restaurantSlug } = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Show success toast
    toast.success("Welcome! Information saved.", {
      id: "checkin-success",
      duration: 4000,
      position: "bottom-right",
      style: {
        background: "#fff",
        color: "#1a1c2e",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }
    });

    // Load session
    const savedSession = localStorage.getItem('bhojan_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

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

  const handleDineIn = () => {
    router.push(`/restaurant/${restaurantSlug}/dine-in`);
  };

  const handleTakeAway = () => {
    toast.success("Take-away menu coming soon!", { icon: "🥡" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1c2e] font-sans selection:bg-[#f97316]/10 overflow-x-hidden">
      <main className="max-w-md mx-auto px-8 py-16 flex flex-col items-center min-h-screen">
        
        {/* Restaurant Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {restaurant?.logo_url ? (
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl border-4 border-white p-1 bg-slate-50">
              <img src={restaurant.logo_url} className="w-full h-full object-cover rounded-full" alt="Logo" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-[#f97316] flex items-center justify-center shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
          )}
        </motion.div>

        {/* Welcome Text */}
        <div className="text-center space-y-4 mb-16">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold tracking-tight text-[#1a1c2e]"
          >
            Welcome to <br />
            <span className="text-[#f97316]">{restaurant?.name || 'the Restaurant'}!</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 font-medium"
          >
            {session?.guest_name ? `Hello ${session.guest_name}, we're ` : "We're "} glad to have you.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleDineIn}
            className="w-full h-20 bg-white border-2 border-[#1a1c2e] rounded-2xl flex items-center justify-between px-8 group transition-all hover:bg-[#1a1c2e] hover:text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChefHat className="w-5 h-5 text-[#1a1c2e] group-hover:text-white" />
              </div>
              <span className="text-lg font-bold uppercase tracking-tight">View Dine In Menu</span>
            </div>
            <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleTakeAway}
            className="w-full h-20 bg-white border-2 border-[#1a1c2e] rounded-2xl flex items-center justify-between px-8 group transition-all hover:bg-[#1a1c2e] hover:text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ShoppingBag className="w-5 h-5 text-[#1a1c2e] group-hover:text-white" />
              </div>
              <span className="text-lg font-bold uppercase tracking-tight">View Take Away Menu</span>
            </div>
            <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
          </motion.button>
        </div>

        {/* Info Card */}
        {session?.table_number && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Station</p>
            </div>
            <span className="text-lg font-black italic text-[#f97316]">T-{session.table_number.padStart(2, '0')}</span>
          </motion.div>
        )}

        <footer className="mt-auto pt-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
            Powered by ZapMenus
          </p>
        </footer>
      </main>

      {/* Decorative Elements */}
      <div className="fixed -bottom-48 -right-48 w-96 h-96 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed -top-48 -left-48 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
