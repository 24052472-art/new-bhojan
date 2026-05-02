"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  ChefHat, 
  Smartphone, 
  Trash2, 
  Loader2, 
  ShieldCheck,
  Copy,
  X,
  Plus,
  Settings as SettingsIcon,
  Search,
  Phone,
  ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StaffManagement() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
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
        const { getProfileByAuth } = await import('@/app/(auth)/actions');
        const { profile } = await getProfileByAuth(user.uid, user.email || "");
        setAdminProfile(profile);
        if (profile?.restaurant_id) fetchStaff(profile.restaurant_id);
        else setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchStaff(restaurantId: string) {
    setIsLoading(true);
    try {
      const { getAdminStaff } = await import('@/app/dashboard/admin/actions');
      const { data } = await getAdminStaff(restaurantId);
      setStaff(data || []);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/staff-login`;
    navigator.clipboard.writeText(link);
    toast.success("Staff Login Link Copied!");
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.restaurant_id) return;
    
    const staffId = `staff_${Math.random().toString(36).substr(2, 9)}`;
    const newStaffMember = {
      id: staffId,
      full_name: newStaff.fullName,
      role: newStaff.role,
      restaurant_id: adminProfile.restaurant_id,
      staff_passcode: newStaff.passcode,
      created_at: new Date().toISOString()
    };

    // Optimistic UI
    setStaff(prev => [newStaffMember, ...prev]);
    setIsAdding(false);
    toast.success("Identity Deployed!");
    
    const savedFullName = newStaff.fullName;
    const savedRole = newStaff.role;
    const savedPasscode = newStaff.passcode;
    setNewStaff({ fullName: "", role: "waiter", passcode: "" });

    try {
      const { addAdminStaff } = await import('@/app/dashboard/admin/actions');
      const { error } = await addAdminStaff(staffId, savedFullName, savedRole, adminProfile.restaurant_id, savedPasscode);
      if (error) {
        setStaff(prev => prev.filter(s => s.id !== staffId));
        throw new Error(error);
      }
    } catch (e: any) {
      toast.error("Deployment failed: " + e.message);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Terminate this identity?")) return;
    
    const previousStaff = [...staff];
    // Optimistic UI
    setStaff(prev => prev.filter(s => s.id !== id));

    try {
      const { deleteAdminStaff } = await import('@/app/dashboard/admin/actions');
      const { error } = await deleteAdminStaff(id);
      if (error) {
        setStaff(previousStaff);
        throw new Error(error);
      }
      toast.success("Identity Purged.");
    } catch (e: any) {
      toast.error("Purge failed: " + e.message);
    }
  };

  if (isLoading && staff.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-900 uppercase tracking-widest">
              <Users size={12} /> Staff Registry
           </div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">The <span className="text-slate-300">Crew</span></h2>
           <p className="text-slate-500 font-medium text-sm">Provision and manage your service and kitchen workforce.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
           <button 
             onClick={handleCopyLink}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
           >
              <Copy size={14} /> Link Hub
           </button>
           <button 
             onClick={() => setIsAdding(true)}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#ff5a2c] text-white rounded-2xl text-xs font-bold hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/10 uppercase tracking-widest"
           >
              <Plus size={16} /> Recruit Staff
           </button>
        </div>
      </div>

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {staff.map((member) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={member.id} 
            className="bg-white rounded-[40px] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col gap-6 relative group"
          >
             <div className="flex justify-between items-start">
                <div className={cn(
                  "p-4 rounded-2xl transition-transform group-hover:scale-110",
                  member.role === 'waiter' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                )}>
                   {member.role === 'waiter' ? <Smartphone size={32} /> : <ChefHat size={32} />}
                </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     {member.role === 'waiter' ? 'Service Waiter' : 'Kitchen Staff'}
                   </p>
                   <div className="flex items-center justify-end gap-1.5 mt-1 group/id">
                      <p className="text-xs font-bold text-slate-300">#{member.id.slice(0, 8).toUpperCase()}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(member.id);
                          toast.success(`${member.full_name}'s ID Copied!`);
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#ff5a2c] hover:text-white transition-all opacity-0 group-hover/id:opacity-100 shadow-sm"
                        title="Copy Full ID"
                      >
                         <Copy size={10} />
                      </button>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic truncate">{member.full_name}</h3>
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                   <ShieldCheck size={14} /> Credential Active
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button className="flex-1 bg-slate-50 text-slate-600 py-3.5 rounded-xl text-[10px] font-black hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                   <SettingsIcon size={14} /> Configuration
                </button>
                <button 
                  onClick={() => handleDeleteStaff(member.id)}
                  className="w-full sm:w-14 h-14 bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-100 rounded-xl flex items-center justify-center transition-all"
                >
                   <Trash2 size={18} />
                </button>
             </div>
          </motion.div>
        ))}

        {staff.length === 0 && !isLoading && (
          <div className="col-span-full py-24 text-center bg-white rounded-[60px] border-2 border-dashed border-slate-100">
             <Users size={40} className="mx-auto text-slate-200 mb-4" />
             <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">No Personnel Deployed</h3>
             <p className="text-slate-400 text-xs font-medium mt-2">Initialize your team to begin operations.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-[210] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                 <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Deploy <span className="text-[#ff5a2c]">New Personnel</span></h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                    <input 
                      required type="text" placeholder="e.g. John Doe" value={newStaff.fullName} onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                    />
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Role</label>
                        <div className="relative">
                           <select 
                             value={newStaff.role} 
                             onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                             className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all appearance-none pr-12"
                           >
                              <option value="waiter">Service Waiter</option>
                              <option value="kitchen">Kitchen Staff</option>
                           </select>
                           <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Passcode</label>
                       <input 
                         required type="text" maxLength={4} placeholder="4 Digits" value={newStaff.passcode} onChange={(e) => setNewStaff({...newStaff, passcode: e.target.value})}
                         className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all text-center tracking-[1em]"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit" disabled={isLoading}
                   className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-[#ff5a2c] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Initialize Deployment</>}
                 </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
