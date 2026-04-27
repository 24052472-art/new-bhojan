"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  CreditCard, 
  QrCode, 
  Save, 
  Upload, 
  MapPin, 
  Phone, 
  Percent,
  Info,
  Loader2,
  Smartphone,
  CheckCircle2,
  Globe,
  Settings as SettingsIcon,
  ChevronRight,
  Download,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("identity");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<any>({
    name: "",
    slug: "",
    address: "",
    phone: "",
    logo_url: "",
    merchant_qr_url: "",
    bank_details: { account_name: "", bank_name: "", account_number: "", ifsc: "" },
    tax_percent: 5,
    service_charge_percent: 5,
    gst_number: "",
    opening_hours: [
      { day: "Monday", hours: "09:00 AM - 11:00 PM" },
      { day: "Tuesday", hours: "09:00 AM - 11:00 PM" },
      { day: "Wednesday", hours: "09:00 AM - 11:00 PM" },
      { day: "Thursday", hours: "09:00 AM - 11:00 PM" },
      { day: "Friday", hours: "09:00 AM - 12:00 AM" },
      { day: "Saturday", hours: "10:00 AM - 12:00 AM" },
      { day: "Sunday", hours: "10:00 AM - 10:00 PM" },
    ]
  });

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        fetchSettings(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSettings = async (uid: string) => {
    try {
      const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", uid).single();
      if (!profile?.restaurant_id) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.from("restaurants").select("*").eq("id", profile.restaurant_id).single();
      if (data) {
        const defaultHours = [
          { day: "Monday", hours: "09:00 AM - 11:00 PM" },
          { day: "Tuesday", hours: "09:00 AM - 11:00 PM" },
          { day: "Wednesday", hours: "09:00 AM - 11:00 PM" },
          { day: "Thursday", hours: "09:00 AM - 11:00 PM" },
          { day: "Friday", hours: "09:00 AM - 12:00 AM" },
          { day: "Saturday", hours: "10:00 AM - 12:00 AM" },
          { day: "Sunday", hours: "10:00 AM - 10:00 PM" },
        ];

        setRestaurant({
          ...data,
          bank_details: data.bank_details || { account_name: "", bank_name: "", account_number: "", ifsc: "" },
          opening_hours: (data.opening_hours && data.opening_hours.length > 0) ? data.opening_hours : defaultHours
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurant.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address,
          phone: restaurant.phone,
          logo_url: restaurant.logo_url,
          merchant_qr_url: restaurant.merchant_qr_url,
          bank_details: restaurant.bank_details,
          tax_percent: restaurant.tax_percent,
          service_charge_percent: restaurant.service_charge_percent,
          gst_number: restaurant.gst_number,
          opening_hours: restaurant.opening_hours
        })
        .eq("id", restaurant.id);

      if (error) throw error;
      toast.success("Settings Synchronized.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c]" />
    </div>
  );

  return (
    <div className="space-y-8 pb-32 md:pb-12 max-w-6xl relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-900 uppercase tracking-widest">
              <SettingsIcon size={12} /> Console
           </div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Sector <span className="text-slate-300">Settings</span></h2>
           <p className="text-slate-500 font-medium text-sm">Configure your brand, billing, and payment protocols.</p>
        </div>
        
        {/* Desktop Save Button */}
        <button 
          onClick={handleSave}
          disabled={isSaving || !restaurant?.id}
          className="hidden md:flex items-center gap-3 px-10 py-4 bg-[#ff5a2c] text-white rounded-2xl text-sm font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10 uppercase tracking-widest disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Commit Changes</>}
        </button>
      </div>

      {/* Tabs - Mobile Scrollable */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-[24px] w-max md:w-fit shadow-sm">
          {[
            { id: "identity", name: "Identity", icon: Building2 },
            { id: "operations", name: "Operations", icon: Clock },
            { id: "levies", name: "Levies", icon: Percent },
            { id: "channels", name: "Channels", icon: Globe },
            { id: "mobile", name: "Mobile", icon: Smartphone },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 md:px-8 py-3.5 rounded-[18px] text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap",
                activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <tab.icon size={14} /> {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "identity" && (
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 md:p-16 space-y-12">
              <div className="space-y-2">
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Brand <span className="text-[#ff5a2c]">Protocol</span></h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Define your visual identity and contact endpoints.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Name</label>
                       <input 
                         value={restaurant.name} onChange={(e) => setRestaurant({...restaurant, name: e.target.value})}
                         className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Slug (URL)</label>
                       <input 
                         value={restaurant.slug} onChange={(e) => setRestaurant({...restaurant, slug: e.target.value})}
                         className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Protocol</label>
                       <input 
                         value={restaurant.phone} onChange={(e) => setRestaurant({...restaurant, phone: e.target.value})}
                         className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Coordinates</label>
                       <textarea 
                         value={restaurant.address} onChange={(e) => setRestaurant({...restaurant, address: e.target.value})}
                         className="w-full h-32 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all resize-none"
                       />
                    </div>
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Brand Logo</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PNG/JPG Max 2MB</p>
                       </div>
                       <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm relative group cursor-pointer">
                          {restaurant.logo_url ? <img src={restaurant.logo_url} className="w-full h-full object-cover" /> : <Upload className="text-slate-300" />}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "operations" && (
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 md:p-16 space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                 <div className="space-y-2">
                    <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Operational <span className="text-[#ff5a2c]">Matrix</span></h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure your sector's availability and concierge protocols.</p>
                 </div>
                 <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Online</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
                 <div className="space-y-8">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff5a2c]">
                          <Clock size={20} />
                       </div>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Weekly Timings</h4>
                    </div>

                    <div className="space-y-3">
                       {restaurant.opening_hours.map((oh: any, index: number) => (
                         <div key={oh.day} className="group flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 focus-within:border-[#ff5a2c] focus-within:bg-white transition-all">
                            <div className="sm:w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{oh.day}</div>
                            <input 
                              value={oh.hours}
                              onChange={(e) => {
                                const newHours = [...restaurant.opening_hours];
                                newHours[index].hours = e.target.value;
                                setRestaurant({...restaurant, opening_hours: newHours});
                              }}
                              className="flex-1 bg-transparent border-none outline-none text-slate-900 font-bold text-sm italic placeholder:text-slate-300 px-4 sm:px-0"
                              placeholder="09:00 AM - 11:00 PM"
                            />
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-12">
                    <div className="space-y-8">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[#ff5a2c]">
                            <Phone size={18} />
                         </div>
                         <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Concierge</h4>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Support Phone</label>
                         <input 
                           value={restaurant.phone || ""} onChange={(e) => setRestaurant({...restaurant, phone: e.target.value})}
                           className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-xl font-black text-slate-900 italic outline-none focus:border-[#ff5a2c] transition-all"
                           placeholder="+91 ..."
                         />
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5a2c]/20 blur-[60px] rounded-full group-hover:bg-[#ff5a2c]/40 transition-all" />
                       <div className="relative z-10 space-y-4">
                          <Info className="text-[#ff5a2c]" size={24} />
                          <h5 className="text-sm font-black uppercase italic tracking-tighter">Live Support Sync</h5>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">Changes to operational hours are instantly broadcasted to the customer dashboard and waiter mobile units.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "levies" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 md:p-16 space-y-10">
                <div className="space-y-2">
                   <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Taxation <span className="text-[#ff5a2c]">Logic</span></h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage statutory levies and service gratuity.</p>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST / VAT (%)</label>
                         <input 
                           type="number" value={restaurant.tax_percent} onChange={(e) => setRestaurant({...restaurant, tax_percent: e.target.value})}
                           className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Charge (%)</label>
                         <input 
                           type="number" value={restaurant.service_charge_percent} onChange={(e) => setRestaurant({...restaurant, service_charge_percent: e.target.value})}
                           className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Certificate ID</label>
                      <input 
                        placeholder="e.g. 22AAAAA0000A1Z5" value={restaurant.gst_number || ""} onChange={(e) => setRestaurant({...restaurant, gst_number: e.target.value})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 md:p-16 space-y-10 flex flex-col justify-center">
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulation Preview</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between text-sm font-bold text-slate-400 uppercase">
                         <span>Sample Order</span>
                         <span className="text-slate-900">₹1,000.00</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-400 uppercase">
                         <span>Tax ({restaurant.tax_percent}%)</span>
                         <span className="text-slate-900">₹{(1000 * (restaurant.tax_percent / 100)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-400 uppercase">
                         <span>Service ({restaurant.service_charge_percent}%)</span>
                         <span className="text-slate-900">₹{(1000 * (restaurant.service_charge_percent / 100)).toFixed(2)}</span>
                      </div>
                      <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                         <span className="text-xs font-black text-[#ff5a2c] uppercase tracking-widest">Projected Total</span>
                         <span className="text-3xl md:text-5xl font-black text-slate-900">₹{(1000 * (1 + (parseFloat(restaurant.tax_percent || 0) + parseFloat(restaurant.service_charge_percent || 0)) / 100)).toFixed(0)}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === "channels" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
               { id: 'dine_in', name: 'Dine-In', icon: Building2, desc: 'Direct QR-based ordering at physical stations.' },
               { id: 'takeaway', name: 'Takeaway', icon: Smartphone, desc: 'Digital pre-ordering for external pickup.' },
               { id: 'delivery', name: 'Delivery', icon: Globe, desc: 'Logistics-enabled ordering for off-site consumption.' },
             ].map(channel => (
               <div key={channel.id} className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-200 shadow-sm space-y-6 group cursor-pointer hover:border-[#ff5a2c] transition-all">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-[#ff5a2c] transition-all">
                     <channel.icon size={32} />
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-2xl font-black text-slate-900 uppercase italic leading-tight">{channel.name}</h4>
                     <p className="text-xs text-slate-400 leading-relaxed font-medium">{channel.desc}</p>
                  </div>
                  <div className="pt-4 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} /> Active
                     </span>
                     <div className="w-12 h-6 bg-[#ff5a2c] rounded-full relative p-1 cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === "mobile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 md:p-16 space-y-10">
                <div className="space-y-2">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Payment QR</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Broadcast your UPI settlement resource.</p>
                </div>
                
                <div className="aspect-square max-w-[280px] mx-auto bg-slate-50 border-2 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-[#ff5a2c] hover:bg-orange-50 transition-all overflow-hidden relative">
                   {restaurant.merchant_qr_url ? (
                     <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain" alt="Merchant QR" />
                   ) : (
                     <QrCode size={48} className="text-slate-200 group-hover:text-[#ff5a2c] transition-colors" />
                   )}
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <input 
                  type="text" placeholder="UPI RESOURCE URL" value={restaurant.merchant_qr_url || ""} 
                  onChange={(e) => setRestaurant({...restaurant, merchant_qr_url: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[10px] font-black text-slate-400 outline-none focus:border-[#ff5a2c] transition-all uppercase tracking-widest"
                />
             </div>

             <div className="bg-slate-900 rounded-[40px] p-8 md:p-16 space-y-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a2c]/10 blur-[100px] rounded-full" />
                <div className="space-y-2 relative z-10">
                   <h3 className="text-3xl font-black tracking-tight uppercase italic leading-none">Staff Gateway</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deploy mobile units to your workforce.</p>
                </div>

                <div className="p-8 bg-white rounded-[32px] w-fit mx-auto shadow-2xl relative z-10">
                   <QrCode size={120} className="text-slate-900 md:w-[180px] md:h-[180px]" />
                </div>

                <div className="space-y-6 relative z-10">
                   <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#ff5a2c] transition-all">
                         <Download size={18} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-all">PWA Installation Protocol</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed md:hidden bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[195] flex justify-center">
         <button 
           onClick={handleSave}
           disabled={isSaving || !restaurant?.id}
           className="w-full h-16 bg-[#ff5a2c] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/20 active:scale-95 transition-all"
         >
           {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Commit Settings</>}
         </button>
      </div>
    </div>
  );
}
