"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  User, 
  Search, 
  Trash2, 
  Building2, 
  Calendar, 
  Loader2,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChefHat,
  Utensils,
  Mail,
  Phone,
  Globe,
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  Activity,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getSuperAdminUsers, deleteUser } from "../actions";

export default function SuperAdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('super-admin-users')
      .on('postgres', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    try {
      const { profiles: fetchedProfiles, restaurants: fetchedRestaurants, error } = await getSuperAdminUsers();
      
      if (error) throw new Error(error);

      const sorted = (fetchedProfiles || []).sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setProfiles(sorted);
      setRestaurants(fetchedRestaurants || []);
    } catch (e) {
      console.error("Critical fetch error:", e);
      setProfiles([]);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const { success, error } = await deleteUser(id);
      if (!success) throw new Error(error || "Failed to revoke access");
      toast.success("User Access Revoked.");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  const superAdmins = profiles.filter(p => p.role === "super_admin");
  
  const networks = restaurants.map(res => {
    const resUsers = profiles.filter(p => p.restaurant_id === res.id);
    const owner = resUsers.find(p => p.role === "owner");
    const staff = resUsers.filter(p => p.role !== "owner");
    return { ...res, owner, staff };
  }).filter(n => n.owner || n.staff.length > 0);

  const filteredNetworks = networks.filter(n => 
    n.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20 animate-fade-in px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff5a2c]/10 text-[#ff5a2c] text-[11px] font-black uppercase tracking-widest border border-[#ff5a2c]/10">
             <ShieldCheck className="w-4 h-4" /> Identity Protocol
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-[0.9]">
            Network <span className="text-[#ff5a2c]">Access.</span>
          </h2>
          <p className="text-slate-500 font-bold max-w-xl text-lg leading-relaxed mt-4 uppercase tracking-tight opacity-70">
            Global identity management and hierarchical access control.
          </p>
        </div>
        <div className="flex gap-4">
           <Button className="h-14 px-8 rounded-full bg-slate-900 text-white font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
             <UserPlus className="w-5 h-5" /> Invite Member
           </Button>
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="relative max-w-3xl mx-auto group">
        <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
          <Search className="w-6 h-6 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" />
        </div>
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by owner, email, or restaurant entity..."
          className="w-full bg-white border border-slate-200 rounded-[32px] pl-20 pr-8 py-6 text-slate-900 font-black outline-none focus:border-[#ff5a2c]/50 focus:ring-8 focus:ring-[#ff5a2c]/5 transition-all text-xl shadow-xl shadow-slate-200/40 placeholder:text-slate-300 placeholder:font-bold"
        />
      </div>

      {/* Users Content */}
      <div className="space-y-16">
        {isLoading ? (
          <div className="flex justify-center py-40">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-[#ff5a2c]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Super Admins Section */}
            {superAdmins.length > 0 && !searchQuery && (
              <div className="space-y-8">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                   <ShieldAlert className="w-8 h-8 text-[#ff5a2c]" /> System Authority
                 </h3>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {superAdmins.map(admin => (
                      <Card key={admin.id} className="bg-slate-900 border-0 rounded-[32px] overflow-hidden shadow-2xl relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none group-hover:scale-110 transition-transform">
                           <ShieldCheck className="w-32 h-32" />
                        </div>
                        <CardContent className="p-8 space-y-6 relative z-10">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                              <User className="w-7 h-7" />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-white">{admin.full_name || "Platform Admin"}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Root Access</p>
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                             <p className="text-xs font-bold text-white/50">{admin.email}</p>
                             <button className="text-white/30 hover:text-[#ff5a2c] transition-colors"><MoreVertical className="w-5 h-5" /></button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* Restaurant Networks Flow */}
            <div className="space-y-10">
               <div className="flex items-center justify-between">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                   <Globe className="w-8 h-8 text-[#ff5a2c]" /> Managed Networks
                 </h3>
                 <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                   {filteredNetworks.length} Entities Found
                 </div>
               </div>

               <div className="grid gap-8">
                 {filteredNetworks.map((network) => {
                   const isExpanded = expandedOwnerId === network.owner?.id;
                   
                   return (
                     <Card key={network.id} className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-xl shadow-slate-200/30 hover:shadow-2xl transition-all duration-500">
                       <CardContent className="p-0">
                          {/* Network Header */}
                          <div 
                            onClick={() => setExpandedOwnerId(isExpanded ? null : network.owner?.id)}
                            className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer group relative"
                          >
                             <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-1/2 pointer-events-none group-hover:bg-[#ff5a2c]/5 transition-colors" />
                             
                             <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 bg-slate-50 text-slate-700 rounded-[32px] flex items-center justify-center border border-slate-100 group-hover:scale-105 group-hover:bg-[#ff5a2c] group-hover:text-white transition-all duration-500 shadow-sm">
                                   <Building2 className="w-12 h-12" />
                                </div>
                                <div>
                                   <div className="flex flex-wrap items-center gap-3 mb-2">
                                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                        Tenant Entity
                                      </span>
                                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                        Live Pulse
                                      </span>
                                   </div>
                                   <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{network.name}</h4>
                                   <div className="flex items-center gap-6 mt-4">
                                     <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                       <User className="w-4 h-4 text-[#ff5a2c]" /> Owner: <span className="text-slate-900 font-black underline decoration-[#ff5a2c]/30 underline-offset-4">{network.owner?.full_name || "Unassigned"}</span>
                                     </p>
                                   </div>
                                </div>
                             </div>

                             <div className="flex items-center gap-10 relative z-10">
                                <div className="text-right hidden md:block">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Network Capacity</p>
                                   <p className="text-3xl font-black text-slate-900">{network.staff.length + (network.owner ? 1 : 0)} Users</p>
                                </div>
                                <div className={`w-14 h-14 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${isExpanded ? 'rotate-180 bg-[#ff5a2c] text-white border-[#ff5a2c] shadow-lg shadow-[#ff5a2c]/30' : 'text-slate-300 bg-white border-slate-100 group-hover:border-slate-300'}`}>
                                   <ChevronDown className="w-7 h-7" />
                                </div>
                             </div>
                          </div>

                          {/* Expandable Identity Grid */}
                          <AnimatePresence>
                             {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-slate-100 bg-slate-50/50"
                                >
                                   <div className="p-10 space-y-12">
                                      {/* Primary Owner Control */}
                                      {network.owner && (
                                        <div className="space-y-4">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Primary Entity Holder</p>
                                          <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-white rounded-[32px] border-2 border-slate-100 shadow-sm hover:border-[#ff5a2c]/30 transition-colors">
                                             <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-[#ff5a2c]/5 text-[#ff5a2c] rounded-2xl flex items-center justify-center border border-[#ff5a2c]/10">
                                                  <User className="w-8 h-8" />
                                                </div>
                                                <div>
                                                  <p className="text-2xl font-black text-slate-900 tracking-tight">{network.owner.full_name}</p>
                                                  <div className="flex gap-4 mt-2">
                                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Mail className="w-3 h-3" /> {network.owner.email}</span>
                                                    {network.owner.phone && <span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Phone className="w-3 h-3" /> {network.owner.phone}</span>}
                                                  </div>
                                                </div>
                                             </div>
                                             <div className="flex gap-4 mt-6 md:mt-0">
                                               <button className="h-12 px-6 rounded-xl border border-slate-200 text-sm font-black hover:bg-slate-50 transition-all uppercase tracking-widest">Impersonate</button>
                                               <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(network.owner.id); }} className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                  <Trash2 className="w-5 h-5" />
                                               </button>
                                             </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Network Staff Deployment */}
                                      <div className="space-y-6">
                                         <div className="flex items-center justify-between px-2">
                                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Identity Deployment</h5>
                                           <span className="text-[10px] font-black text-[#ff5a2c] uppercase">{network.staff.length} Roles Active</span>
                                         </div>
                                         {network.staff.length === 0 ? (
                                           <div className="p-12 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No subordinate identities detected in this network.</p>
                                           </div>
                                         ) : (
                                           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                              {network.staff.map(member => (
                                                <div key={member.id} className="flex flex-col p-6 bg-white rounded-[28px] border-2 border-slate-100 hover:border-slate-300 shadow-sm transition-all group/staff relative overflow-hidden">
                                                   <div className="flex items-start justify-between">
                                                      <div className="w-14 h-14 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl flex items-center justify-center group-hover/staff:bg-[#ff5a2c] group-hover/staff:text-white transition-all duration-300">
                                                        {member.role === 'kitchen' ? <ChefHat className="w-7 h-7" /> : <Utensils className="w-7 h-7" />}
                                                      </div>
                                                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(member.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                      </button>
                                                   </div>
                                                   <div className="mt-6">
                                                      <p className="text-xl font-black text-slate-900 leading-tight truncate">{member.full_name || member.role}</p>
                                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Role: {member.role}</p>
                                                   </div>
                                                   <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                      <span className="text-[10px] font-bold text-slate-400">ID: {member.id.slice(0, 8)}</span>
                                                      <button className="text-[10px] font-black text-[#ff5a2c] uppercase hover:underline">Revoke</button>
                                                   </div>
                                                </div>
                                              ))}
                                           </div>
                                         )}
                                      </div>
                                   </div>
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </CardContent>
                     </Card>
                   );
                 })}
                 
                 {filteredNetworks.length === 0 && (
                   <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[48px] bg-white space-y-6">
                     <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-10 h-10 text-slate-200" />
                     </div>
                     <p className="text-lg font-black text-slate-400 uppercase tracking-widest">No matching platform identities found.</p>
                   </div>
                 )}
               </div>
            </div>
          </>
        )}
      </div>

      {/* Security Action Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
             >
               <Card className="w-full max-w-md p-10 bg-white border-0 rounded-[40px] text-center space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Security Override?</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">This will permanently revoke all access tokens and purge this identity from the global registry. This action cannot be reverted.</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 py-6 rounded-2xl border-2 border-slate-100 text-slate-700 hover:bg-slate-50 font-black uppercase tracking-widest text-xs">Abort</Button>
                    <Button 
                      onClick={() => handleDelete(deleteConfirm)} 
                      className="flex-1 py-6 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Purge"}
                    </Button>
                  </div>
               </Card>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
