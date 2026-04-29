"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Plus, 
  Search, 
  Users, 
  UtensilsCrossed, 
  ExternalLink, 
  Settings,
  Trash2,
  AlertTriangle,
  Loader2,
  Building2,
  CreditCard,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ArrowUpRight,
  ShieldCheck,
  Pause,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { getSuperAdminRestaurants, deleteRestaurant } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchRestaurants();
    
    const channel = supabase.channel('super-admin-restaurants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchRestaurants())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRestaurants() {
    try {
      const { data, error } = await getSuperAdminRestaurants();
      if (error) throw new Error(error);
      setRestaurants(data || []);
    } catch (e) {
      console.error("Critical error fetching restaurants:", e);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const { success, error } = await deleteRestaurant(id);
      if (!success) throw new Error(error || "Failed to delete");

      toast.success("Restaurant & Dependencies Purged.");
      fetchRestaurants();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('restaurants').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Restaurant ${!currentStatus ? 'Activated' : 'Suspended'}`);
      fetchRestaurants();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const calculateRemainingDays = (expiryDate: string | null, createdAt: string) => {
    // Fallback: If no expiry date, assume 30 days from creation (Trial)
    const now = new Date();
    const start = new Date(expiryDate || createdAt);
    const expiry = new Date(start);
    if (!expiryDate) expiry.setDate(expiry.getDate() + 30);
    
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const filtered = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20 animate-fade-in px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[28px] bg-[#ff5a2c]/10 text-[#ff5a2c] flex items-center justify-center shadow-inner">
            <Building2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Marketplace.</h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-2">Managing {restaurants.length} active environments.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button className="h-14 px-8 rounded-full bg-slate-900 text-white font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
            <ShieldAlert className="w-5 h-5" /> Audit Logs
          </Button>
          <Link href="/dashboard/super-admin/restaurants/onboard">
            <Button className="h-14 px-8 rounded-full bg-[#ff5a2c] text-white font-bold flex items-center gap-2 hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20">
              <Plus className="w-5 h-5" /> Onboard Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="relative max-w-2xl mx-auto group">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors w-6 h-6" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a restaurant or slug..."
          className="w-full bg-white border border-slate-200 rounded-full pl-20 pr-8 py-6 text-slate-900 font-bold outline-none focus:border-[#ff5a2c]/50 focus:ring-4 focus:ring-[#ff5a2c]/10 transition-all text-lg shadow-sm focus:shadow-md"
        />
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="flex justify-center py-40">
           <Loader2 className="w-16 h-16 animate-spin text-[#ff5a2c]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((res) => {
            const daysLeft = calculateRemainingDays(res.expiry_date, res.created_at);
            const isExpired = daysLeft === 0 && res.expiry_date;
            
            return (
              <Card key={res.id} className="bg-white border border-slate-100 rounded-[36px] overflow-hidden group hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-2xl shadow-slate-200/50 relative flex flex-col">
                 <CardContent className="p-8 flex-1 space-y-8">
                    {/* Top Row: Icon & Status */}
                    <div className="flex justify-between items-start">
                       <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 group-hover:bg-[#ff5a2c]/10 group-hover:text-[#ff5a2c] transition-colors">
                          <UtensilsCrossed className="w-8 h-8" />
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${res.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                           <span className={`w-2 h-2 rounded-full ${res.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} /> 
                           {res.is_active ? 'Active' : 'Suspended'}
                         </span>
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-100`}>
                           {res.subscription_status || 'Trial'} Plan
                         </span>
                       </div>
                    </div>

                    {/* Basic Info */}
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight truncate">{res.name}</h3>
                       <div className="flex items-center gap-2 mt-2">
                         <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">bhojan.app/{res.slug}</p>
                         <ExternalLink className="w-3 h-3 text-slate-300" />
                       </div>
                    </div>

                    {/* Subscription Progress */}
                    <div className="space-y-3 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                       <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" /> Time Remaining
                          </div>
                          <span className={`text-sm font-black ${daysLeft < 7 ? 'text-[#ff5a2c]' : 'text-slate-900'}`}>
                            {daysLeft} Days
                          </span>
                       </div>
                       <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                            className={`h-full rounded-full ${daysLeft < 7 ? 'bg-[#ff5a2c]' : 'bg-emerald-500'}`}
                          />
                       </div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
                         {res.expiry_date ? `Expires: ${new Date(res.expiry_date).toLocaleDateString()}` : 'No Expiry Set'}
                       </p>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 group/metric">
                          <Users className="w-5 h-5 text-slate-300 group-hover/metric:text-[#ff5a2c] transition-colors" />
                          <div>
                             <p className="text-lg font-black text-slate-900">{res.user_profiles?.[0]?.count || 0}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Users</p>
                          </div>
                       </div>
                       <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 group/metric">
                          <UtensilsCrossed className="w-5 h-5 text-slate-300 group-hover/metric:text-[#ff5a2c] transition-colors" />
                          <div>
                             <p className="text-lg font-black text-slate-900">{res.menu_items?.[0]?.count || 0}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dishes</p>
                          </div>
                       </div>
                    </div>
                 </CardContent>

                 {/* Actions Footer */}
                 <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button 
                      onClick={() => {
                        setSelectedRestaurant(res);
                        setIsManageModalOpen(true);
                      }}
                      className="flex-1 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#ff5a2c] hover:text-[#ff5a2c] transition-all font-bold gap-2 shadow-sm"
                    >
                      <Settings className="w-4 h-4" /> Manage
                    </Button>
                    <button 
                      onClick={() => handleStatusToggle(res.id, res.is_active)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border ${res.is_active ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                    >
                      {res.is_active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(res.id)}
                      className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 hover:bg-red-100 transition-all shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
             >
               <Card className="w-full max-w-md p-10 bg-white border-0 rounded-[40px] text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Confirm Purge?</h3>
                    <p className="text-slate-500 text-sm font-medium">This will permanently delete the restaurant and all associated menu items, orders, and staff profiles. This action is IRREVERSIBLE.</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-2xl border border-slate-200 text-slate-700 font-bold py-6 hover:bg-slate-50">Cancel</Button>
                    <Button 
                      onClick={() => handleDelete(deleteConfirm)} 
                      className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-2xl gap-2 font-bold py-6 shadow-lg shadow-red-500/20"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} Delete Everything
                    </Button>
                  </div>
               </Card>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Management Modal */}
      <AnimatePresence>
        {isManageModalOpen && selectedRestaurant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto py-20">
             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 50, opacity: 0 }}
               className="w-full max-w-4xl"
             >
               <Card className="bg-white border-0 rounded-[48px] shadow-2xl overflow-hidden relative">
                  {/* Modal Header */}
                  <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-[#ff5a2c]" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black tracking-tight">{selectedRestaurant.name}</h3>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">Tenant Control Center</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsManageModalOpen(false)}
                      className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-10 grid md:grid-cols-2 gap-10">
                    {/* Subscription Management */}
                    <div className="space-y-8">
                       <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                         <CreditCard className="w-5 h-5 text-[#ff5a2c]" /> Subscription Engine
                       </h4>
                       
                       <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Active Plan</p>
                            <p className="text-3xl font-black text-slate-900 capitalize">{selectedRestaurant.subscription_status || 'Trial'}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#ff5a2c] transition-all text-left group">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Override Plan</p>
                               <p className="text-sm font-black text-slate-900 group-hover:text-[#ff5a2c]">Switch to Pro</p>
                            </button>
                            <button className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#ff5a2c] transition-all text-left group">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Period</p>
                               <p className="text-sm font-black text-slate-900 group-hover:text-[#ff5a2c]">Monthly</p>
                            </button>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Manual Expiry Extension</p>
                          <div className="flex gap-2">
                             {[1, 7, 30, 365].map(days => (
                               <button key={days} className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-900 hover:bg-[#ff5a2c] hover:text-white transition-all shadow-sm">
                                 +{days}d
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Access & Security */}
                    <div className="space-y-8">
                       <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                         <ShieldCheck className="w-5 h-5 text-[#ff5a2c]" /> Permissions & Sync
                       </h4>
                       
                       <div className="space-y-4">
                          {[
                            { label: "QR Payment Processing", active: true },
                            { label: "Advanced Analytics", active: false },
                            { label: "Custom Domain Mapping", active: false },
                            { label: "API Webhook Access", active: true }
                          ].map((feat, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                               <span className="text-sm font-bold text-slate-700">{feat.label}</span>
                               <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${feat.active ? 'bg-[#ff5a2c]' : 'bg-slate-300'}`}>
                                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${feat.active ? 'translate-x-6' : 'translate-x-0'}`} />
                               </div>
                            </div>
                          ))}
                       </div>

                       <div className="pt-6 border-t border-slate-100">
                          <Button className="w-full h-14 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                            Revoke All Credentials
                          </Button>
                       </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                     <Button variant="outline" onClick={() => setIsManageModalOpen(false)} className="px-10 h-14 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-white">
                        Close Panel
                     </Button>
                     <Button className="px-10 h-14 rounded-2xl bg-[#ff5a2c] text-white font-black hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20">
                        Commit Changes
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
