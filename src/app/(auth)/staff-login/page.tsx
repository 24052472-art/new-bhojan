"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Users, Lock, Loader2, ArrowRight, Smartphone, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StaffLoginPage() {
  const [staffId, setStaffId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<"waiter" | "kitchen">("waiter");

  const supabase = createClient();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !passcode) return;
    
    setIsLoading(true);
    try {
      const formattedId = staffId.toLowerCase().startsWith("staff_") ? staffId.toLowerCase() : `staff_${staffId.toLowerCase()}`;
      
      const { getStaffProfile } = await import('@/app/(auth)/actions');
      const { profile: data, error } = await getStaffProfile(formattedId);

      if (error || !data) throw new Error(error || "Invalid Staff ID. Please check with your manager.");
      
      if (data.staff_passcode !== passcode) {
        throw new Error("Incorrect Passcode. Access Denied.");
      }
      
      localStorage.setItem("staff_session", JSON.stringify({
        id: data.id,
        role: data.role,
        name: data.full_name,
        restaurant_id: data.restaurant_id
      }));

      toast.success(`Welcome to the shift, ${data.full_name}!`);
      
      const target = data.role === 'waiter' ? "/dashboard/waiter" : "/dashboard/kitchen";
      window.location.assign(target);
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 md:p-12 space-y-10"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-110">
                 <ChefHat size={24} className="text-[#ff5a2c]" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">BHOJAN</h1>
            </Link>
            
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Start Your Shift.</h2>
              <p className="text-slate-500 font-medium text-sm italic">Enter your credentials to continue</p>
            </div>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-8">
            {/* Role Toggle */}
            <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl gap-1">
               <button 
                 type="button"
                 onClick={() => setActiveRole("waiter")}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all",
                   activeRole === "waiter" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 <Smartphone size={14} /> Waiter
               </button>
               <button 
                 type="button"
                 onClick={() => setActiveRole("kitchen")}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all",
                   activeRole === "kitchen" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 <ChefHat size={14} /> Kitchen
               </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff5a2c] transition-colors">
                    <Users size={18} />
                  </div>
                  <input 
                    autoFocus
                    required 
                    value={staffId} 
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. STF-001" 
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 outline-none focus:bg-white focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 text-base font-bold text-slate-900 transition-all placeholder:text-slate-300 placeholder:font-medium" 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passcode</label>
                </div>
                <div className="relative group">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff5a2c] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    required 
                    type="password" 
                    value={passcode} 
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="••••" 
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 outline-none focus:bg-white focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 text-xl font-black tracking-[0.5em] text-slate-900 transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm placeholder:font-medium" 
                  />
                </div>
              </div>
            </div>

            <Button 
              disabled={isLoading || !staffId || !passcode} 
              type="submit" 
              className="w-full h-16 rounded-2xl text-lg font-black uppercase italic tracking-tighter bg-[#ff5a2c] text-white hover:bg-[#ea580c] shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  Start Shift
                  <ArrowRight size={20} />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-center gap-6">
              <button className="text-[10px] font-black text-slate-400 hover:text-[#ff5a2c] uppercase tracking-widest transition-colors">Forgot passcode?</button>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Contact manager</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
