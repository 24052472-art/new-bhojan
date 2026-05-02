"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  Trash2,
  Edit2,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, verified, unverified
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    is_verified: false
  });

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { getProfileByAuth } = await import('@/app/(auth)/actions');
        const { profile } = await getProfileByAuth(user.uid, user.email || "");
        if (profile?.restaurant_id) {
          setRestaurantId(profile.restaurant_id);
          fetchCustomers(profile.restaurant_id);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCustomers = async (resId: string) => {
    setIsLoading(true);
    const { getAdminCustomers } = await import('@/app/dashboard/admin/actions');
    const { data, error } = await getAdminCustomers(resId);
    
    if (!error) setCustomers(data || []);
    setIsLoading(false);
  };

  const handleAddCustomer = async () => {
    if (!formData.name) return toast.error("Name is required");
    try {
      if (editingId) {
        const { error } = await supabase.from("customers").update(formData).eq("id", editingId);
        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        const { error } = await supabase.from("customers").insert({
          ...formData,
          restaurant_id: restaurantId
        });
        if (error) throw error;
        toast.success("Customer added successfully");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", is_verified: false });
      fetchCustomers(restaurantId);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer entry?")) return;
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Customer removed from directory");
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery);
    
    if (activeTab === "verified") return matchesSearch && c.is_verified;
    if (activeTab === "unverified") return matchesSearch && !c.is_verified;
    return matchesSearch;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Customer <span className="text-[#ff5a2c]">Directory</span></h2>
           <p className="text-sm font-medium text-slate-400 mt-1">Manage your verified and manual customer database.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#ff5a2c] text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/10 uppercase tracking-widest"
        >
          <Plus size={16} /> Add Manual Entry
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            {["all", "verified", "unverified"].map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {tab}
              </button>
            ))}
         </div>
         <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" placeholder="Search by name, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ff5a2c] transition-all shadow-sm"
            />
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <motion.div 
            layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={customer.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${customer.is_verified ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                  {customer.is_verified ? <ShieldCheck size={24} /> : <Users size={24} />}
               </div>
               <div className="flex items-center gap-1">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${customer.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {customer.is_verified ? 'Verified' : 'Unverified'}
                  </span>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{customer.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer ID: {customer.id.slice(-8).toUpperCase()}</p>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-500">
                     <Mail size={14} className="text-slate-300" />
                     <span className="text-xs font-medium">{customer.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                     <Phone size={14} className="text-slate-300" />
                     <span className="text-xs font-medium">{customer.phone || 'No phone provided'}</span>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Added {new Date(customer.created_at).toLocaleDateString()}</span>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => {
                      setEditingId(customer.id);
                      setFormData({
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone,
                        is_verified: customer.is_verified
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
             <Users size={40} className="mx-auto text-slate-200 mb-4" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No customers found</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl space-y-8"
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{editingId ? 'Edit' : 'Add'} <span className="text-[#ff5a2c]">Customer</span></h3>
                   <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: "", email: "", phone: "", is_verified: false }); }} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
                </div>

                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" placeholder="Enter name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        type="email" placeholder="customer@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="tel" placeholder="+91 ..." value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                   </div>
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        type="checkbox" checked={formData.is_verified} onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                        className="w-5 h-5 accent-[#ff5a2c]"
                      />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Mark as Verified</span>
                   </div>
                </div>

                <button 
                  onClick={handleAddCustomer}
                  className="w-full h-16 bg-[#ff5a2c] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 hover:bg-[#ea580c] transition-all"
                >
                  {editingId ? 'Update Entry' : 'Create Entry'}
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
