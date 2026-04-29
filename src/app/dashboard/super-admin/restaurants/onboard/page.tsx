"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  User, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Utensils,
  ShieldCheck,
  Zap,
  Globe,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { onboardTenant } from "@/app/dashboard/super-admin/actions";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function OnboardTenantPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    owner: { name: "", email: "", phone: "", address: "" },
    restaurant: { name: "", category: "Cafe", location: "", slug: "" },
    plan: { id: "starter", duration: 30 }
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value }
    }));
    
    // Auto-generate slug from restaurant name
    if (section === "restaurant" && field === "name") {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        restaurant: { ...prev.restaurant, slug }
      }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await onboardTenant(formData);
      if (res.success) {
        setInviteLink(res.inviteLink ?? null);
        setStep(5);
        toast.success("Tenant onboarded successfully!");
      } else {
        throw new Error(res.error || "Onboarding failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Invite link copied!");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-12 pb-20 animate-fade-in px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-8">
        <div className="space-y-2">
          <Link href="/dashboard/super-admin/restaurants" className="text-sm font-bold text-[#ff5a2c] flex items-center gap-2 mb-4 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Restaurants
          </Link>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Onboard <span className="text-[#ff5a2c]">Tenant.</span></h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest opacity-60">System Protocol: New Entity Initialization</p>
        </div>
        
        {/* Progress Dots */}
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#ff5a2c] scale-125' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Owner Details */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step1">
            <Card className="bg-white border-0 rounded-[48px] shadow-2xl overflow-hidden">
               <div className="p-12 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#ff5a2c]/10 rounded-2xl flex items-center justify-center text-[#ff5a2c]">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Owner Credentials</h3>
                      <p className="text-sm font-bold text-slate-400">Primary account identity for the restaurant.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Full Legal Name</label>
                      <input 
                        value={formData.owner.name}
                        onChange={(e) => handleInputChange("owner", "name", e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Primary Email (ID)</label>
                      <input 
                        value={formData.owner.email}
                        onChange={(e) => handleInputChange("owner", "email", e.target.value)}
                        placeholder="owner@example.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Contact Number</label>
                      <input 
                        value={formData.owner.phone}
                        onChange={(e) => handleInputChange("owner", "phone", e.target.value)}
                        placeholder="+91 00000 00000"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Physical Address</label>
                      <input 
                        value={formData.owner.address}
                        onChange={(e) => handleInputChange("owner", "address", e.target.value)}
                        placeholder="City, State"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <Button onClick={() => setStep(2)} className="h-14 px-10 rounded-2xl bg-[#ff5a2c] text-white font-black hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20 flex items-center gap-2">
                      Next Step <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
               </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Restaurant Details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step2">
             <Card className="bg-white border-0 rounded-[48px] shadow-2xl overflow-hidden">
               <div className="p-12 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#ff5a2c]/10 rounded-2xl flex items-center justify-center text-[#ff5a2c]">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Restaurant Identity</h3>
                      <p className="text-sm font-bold text-slate-400">Public profile and operational parameters.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Restaurant Name</label>
                      <input 
                        value={formData.restaurant.name}
                        onChange={(e) => handleInputChange("restaurant", "name", e.target.value)}
                        placeholder="e.g. The Blue Frog"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-black outline-none focus:border-[#ff5a2c] transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Category</label>
                      <select 
                        value={formData.restaurant.category}
                        onChange={(e) => handleInputChange("restaurant", "category", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      >
                        <option>Cafe</option>
                        <option>Fine Dining</option>
                        <option>Fast Food</option>
                        <option>Bakery</option>
                        <option>Bar & Kitchen</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Market Slug (URL)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">bhojan.app/</span>
                        <input 
                          value={formData.restaurant.slug}
                          onChange={(e) => handleInputChange("restaurant", "slug", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-28 pr-6 py-4 text-[#ff5a2c] font-black outline-none focus:border-[#ff5a2c] transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Location / Area</label>
                      <input 
                        value={formData.restaurant.location}
                        onChange={(e) => handleInputChange("restaurant", "location", e.target.value)}
                        placeholder="e.g. Connaught Place, Delhi"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-[#ff5a2c] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between">
                    <Button onClick={() => setStep(1)} variant="outline" className="h-14 px-10 rounded-2xl border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all">
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="h-14 px-10 rounded-2xl bg-[#ff5a2c] text-white font-black hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20 flex items-center gap-2">
                      Next Step <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
               </div>
             </Card>
          </motion.div>
        )}

        {/* Step 3: Plan Assignment */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="step3">
            <Card className="bg-white border-0 rounded-[48px] shadow-2xl overflow-hidden">
               <div className="p-12 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#ff5a2c]/10 rounded-2xl flex items-center justify-center text-[#ff5a2c]">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Subscription Protocol</h3>
                      <p className="text-sm font-bold text-slate-400">Define access limits and billing cycle.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { id: "starter", name: "Starter", price: "₹999", limit: "5 Tables" },
                      { id: "pro", name: "Pro", price: "₹2,499", limit: "Unlimited" },
                      { id: "enterprise", name: "Enterprise", price: "Custom", limit: "Multi-Unit" }
                    ].map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleInputChange("plan", "id", p.id)}
                        className={`p-8 rounded-[32px] border-2 text-left transition-all relative overflow-hidden ${formData.plan.id === p.id ? 'border-[#ff5a2c] bg-[#ff5a2c]/5 shadow-xl shadow-[#ff5a2c]/10' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                      >
                         <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${formData.plan.id === p.id ? 'text-[#ff5a2c]' : 'text-slate-400'}`}>{p.name} Plan</p>
                         <h4 className="text-3xl font-black text-slate-900">{p.price}</h4>
                         <p className="text-xs font-bold text-slate-500 mt-4">{p.limit}</p>
                         {formData.plan.id === p.id && <CheckCircle2 className="absolute top-8 right-8 w-6 h-6 text-[#ff5a2c]" />}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Duration (Days)</label>
                    <div className="flex gap-4">
                       {[30, 90, 365].map(d => (
                         <button 
                           key={d}
                           onClick={() => handleInputChange("plan", "duration", d)}
                           className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${formData.plan.duration === d ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                         >
                           {d} Days
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between">
                    <Button onClick={() => setStep(2)} variant="outline" className="h-14 px-10 rounded-2xl border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all">
                      Back
                    </Button>
                    <Button onClick={() => setStep(4)} className="h-14 px-10 rounded-2xl bg-[#ff5a2c] text-white font-black hover:bg-[#ff5a2c]/90 transition-all shadow-lg shadow-[#ff5a2c]/20 flex items-center gap-2">
                      Review & Deploy <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
               </div>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Review & Deploy */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key="step4">
            <Card className="bg-white border-0 rounded-[48px] shadow-2xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-20 opacity-5 text-[#ff5a2c] pointer-events-none">
                 <ShieldCheck className="w-80 h-80" />
               </div>
               
               <div className="p-12 space-y-10 relative z-10">
                  <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">Final Protocol Review</h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Verify all entity parameters before deployment</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                        <h4 className="text-[10px] font-black text-[#ff5a2c] uppercase tracking-widest border-b border-[#ff5a2c]/20 pb-4">Owner Profile</h4>
                        <div className="space-y-4">
                           <div className="flex justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase">Name</span>
                              <span className="text-sm font-black text-slate-900">{formData.owner.name}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase">Email ID</span>
                              <span className="text-sm font-black text-slate-900">{formData.owner.email}</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                        <h4 className="text-[10px] font-black text-[#ff5a2c] uppercase tracking-widest border-b border-[#ff5a2c]/20 pb-4">Entity Profile</h4>
                        <div className="space-y-4">
                           <div className="flex justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase">Restaurant</span>
                              <span className="text-sm font-black text-slate-900">{formData.restaurant.name}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase">Plan</span>
                              <span className="text-sm font-black text-slate-900 uppercase">{formData.plan.id} ({formData.plan.duration}d)</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-10 flex flex-col items-center gap-6">
                     <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 px-6 py-2 rounded-full border border-emerald-100">
                        <Zap className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">System Ready for Initialization</span>
                     </div>
                     
                     <div className="flex gap-4 w-full">
                        <Button onClick={() => setStep(3)} variant="outline" className="flex-1 h-16 rounded-2xl border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">
                          Modify Details
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="flex-[2] h-16 rounded-2xl bg-[#ff5a2c] text-white font-black hover:bg-[#ff5a2c]/90 transition-all shadow-xl shadow-[#ff5a2c]/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4"
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Deploy Entity Now"}
                        </Button>
                     </div>
                  </div>
               </div>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Success & Access Link */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} key="step5">
            <Card className="bg-slate-900 border-0 rounded-[56px] shadow-3xl overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-[#ff5a2c]/20 to-transparent pointer-events-none" />
               
               <div className="p-16 text-center space-y-12 relative z-10">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-5xl font-black text-white tracking-tight">Entity Deployed.</h3>
                    <p className="text-white/50 font-bold uppercase text-xs tracking-[0.4em]">Activation Protocol Successfully Initialized</p>
                  </div>

                  <div className="max-w-md mx-auto p-10 bg-white/5 border border-white/10 rounded-[40px] space-y-8 backdrop-blur-md">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#ff5a2c] uppercase tracking-widest">Protocol Success</p>
                        <p className="text-white/40 text-[9px] font-bold text-center">Account initialized in Firebase. Share the credentials below with the owner.</p>
                     </div>

                     <div className="space-y-6">
                        <div className="relative group">
                           <p className="text-[8px] font-black text-white/30 uppercase mb-2 text-left">Login Email</p>
                           <div className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-[#ff5a2c] font-black text-xs break-all text-left">
                              {formData.owner.email}
                           </div>
                        </div>

                        <div className="relative group">
                           <p className="text-[8px] font-black text-white/30 uppercase mb-2 text-left">Temporary Password</p>
                           <div className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-emerald-400 font-black text-xs break-all text-left">
                              Bhojan@2026
                           </div>
                           <p className="text-[8px] font-bold text-white/20 mt-2 italic">* Owner should change this after first login.</p>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="text-left">
                           <p className="text-[8px] font-black text-white/30 uppercase mb-1">Status</p>
                           <p className="text-xs font-bold text-emerald-400">Account Active</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-black text-white/30 uppercase mb-1">Identity</p>
                           <p className="text-xs font-bold text-white truncate">{formData.owner.email}</p>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6">
                    <Link href="/dashboard/super-admin/restaurants">
                      <Button className="px-12 h-16 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">
                        Return to Command Center
                      </Button>
                    </Link>
                  </div>
               </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
