"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  ChefHat, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Lock,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function AddStaffPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    role: "waiter" as "waiter" | "kitchen",
    passcode: ""
  });

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.uid).single();
        setAdminProfile(profile);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.restaurant_id) return;
    setIsLoading(true);
    try {
      const staffId = `staff_${Math.random().toString(36).substr(2, 9)}`;
      await supabase.from("profiles").insert([{
        id: staffId,
        full_name: newStaff.fullName,
        role: newStaff.role,
        restaurant_id: adminProfile.restaurant_id,
        staff_passcode: newStaff.passcode,
      }]);
      toast.success("Personnel Deployed Successfully!");
      router.push("/dashboard/admin/staff");
    } catch (e: any) {
      toast.error("Deployment sequence failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Registry
      </button>

      <div className="bg-white rounded-[48px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-10 md:p-16 space-y-12">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto text-[#ff5a2c] shadow-lg shadow-orange-500/10">
                 <UserPlus size={36} />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Personnel <span className="text-slate-300">Expansion</span></h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initializing new digital identity parameters for the sector.</p>
           </div>

           <form onSubmit={handleAddStaff} className="space-y-10">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Identification Name</label>
                 <div className="relative">
                    <input 
                      required 
                      value={newStaff.fullName} onChange={e => setNewStaff({...newStaff, fullName: e.target.value})}
                      placeholder="E.G. JOHNATHAN DOE" 
                      className="w-full h-20 bg-slate-50 border border-slate-200 rounded-[28px] px-10 text-slate-900 font-bold text-2xl outline-none focus:border-[#ff5a2c] transition-all placeholder:text-slate-200"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-200">
                       <ShieldCheck size={24} />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Role</label>
                    <div className="relative">
                       <select 
                         value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                         className="w-full h-20 bg-slate-50 border border-slate-200 rounded-[28px] px-8 text-slate-900 font-bold text-lg outline-none focus:border-[#ff5a2c] transition-all appearance-none uppercase tracking-widest"
                       >
                          <option value="waiter">Service Asset</option>
                          <option value="kitchen">Culinary Unit</option>
                       </select>
                       {newStaff.role === 'waiter' ? <Smartphone size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" /> : <ChefHat size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" />}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Sequence (PIN)</label>
                    <div className="relative">
                       <input 
                         required maxLength={6} type="password"
                         value={newStaff.passcode} onChange={e => setNewStaff({...newStaff, passcode: e.target.value})}
                         placeholder="••••••" 
                         className="w-full h-20 bg-slate-50 border border-slate-200 rounded-[28px] px-10 text-slate-900 font-bold text-3xl tracking-[0.5em] outline-none focus:border-[#ff5a2c] transition-all placeholder:text-slate-200"
                       />
                       <Lock size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                 </div>
              </div>

              <div className="pt-10 flex gap-6">
                 <button 
                   type="button" onClick={() => router.back()}
                   className="flex-1 h-20 bg-slate-100 text-slate-600 rounded-[32px] text-sm font-bold hover:bg-slate-200 transition-all uppercase tracking-widest"
                 >
                    Abort
                 </button>
                 <button 
                   type="submit" disabled={isLoading}
                   className="flex-[2] h-20 bg-[#ff5a2c] text-white rounded-[32px] text-lg font-black uppercase tracking-widest hover:bg-[#ea580c] transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Deploy Identity</>}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
