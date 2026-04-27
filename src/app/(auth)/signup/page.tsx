"use client";

import { useState } from "react";
import { 
  Utensils, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock,
  ChevronLeft,
  Smartphone,
  Globe,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    restaurantName: "",
    fullName: "",
    serviceType: "Dine-in"
  });
  
  const router = useRouter();
  const supabase = createClient();

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.fullName });

      const isSuperAdmin = formData.email.toLowerCase() === "abhi.kush047@gmail.com";

      if (isSuperAdmin) {
        await supabase.from("profiles").upsert({ 
          id: user.uid,
          role: 'super_admin',
          full_name: formData.fullName
        });
        toast.success("Platform Master Account Created!");
        router.push("/dashboard/super-admin");
      } else {
        const randomSuffix = Math.floor(Math.random() * 1000);
        const slug = `${formData.restaurantName.toLowerCase().replace(/\s+/g, '-')}-${randomSuffix}`;
        
        const { data: resData, error: resError } = await supabase.from("restaurants").insert([
          { name: formData.restaurantName, slug: slug, is_active: true }
        ]).select().single();

        if (resError) throw resError;

        await supabase.from("profiles").upsert({ 
          id: user.uid,
          restaurant_id: resData.id,
          role: 'owner',
          full_name: formData.fullName,
          email: formData.email
        });

        setStep(5);
        toast.success("Onboarding complete!");
        setTimeout(() => router.push("/dashboard/admin"), 2000);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: "Account", desc: "Security first" },
    { title: "Profile", desc: "Tell us who you are" },
    { title: "Restaurant", desc: "Build your brand" },
    { title: "Experience", desc: "Choose your flow" }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col font-sans">
      {/* Header */}
      <header className="p-8 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
        </Link>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400">Step {step > 4 ? 4 : step} of 4</span>
           <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#ff5a2c]" 
                animate={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
              />
           </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="mb-10">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Create Your Account.</h2>
                  <p className="text-slate-500 font-medium italic">Join 500+ restaurants worldwide.</p>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                     <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" />
                       <input 
                         required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                         placeholder="name@restaurant.com" 
                         className="w-full h-12 bg-white border border-slate-200 rounded-[12px] pl-12 pr-4 outline-none focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-sm" 
                       />
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                     <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" />
                       <input 
                         required type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                         placeholder="••••••••" 
                         className="w-full h-12 bg-white border border-slate-200 rounded-[12px] pl-12 pr-12 outline-none focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-sm" 
                       />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                     </div>
                   </div>
                </div>

                <button 
                  onClick={nextStep}
                  disabled={!formData.email || !formData.password}
                  className="w-full bg-[#ff5a2c] text-white py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <button onClick={prevStep} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="mb-10">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">What's your name?</h2>
                  <p className="text-slate-500 font-medium italic">We'd love to know who we're working with.</p>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                   <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" />
                     <input 
                       required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                       placeholder="Abhi Kushwaha" 
                       className="w-full h-12 bg-white border border-slate-200 rounded-[12px] pl-12 pr-4 outline-none focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-sm" 
                     />
                   </div>
                </div>

                <button 
                  onClick={nextStep}
                  disabled={!formData.fullName}
                  className="w-full bg-[#ff5a2c] text-white py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <button onClick={prevStep} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="mb-10">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Your Restaurant.</h2>
                  <p className="text-slate-500 font-medium italic">Give your establishment a name.</p>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Name</label>
                   <div className="relative group">
                     <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff5a2c] transition-colors" />
                     <input 
                       required type="text" value={formData.restaurantName} onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                       placeholder="The Grand Palace" 
                       className="w-full h-12 bg-white border border-slate-200 rounded-[12px] pl-12 pr-4 outline-none focus:border-[#ff5a2c] focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-sm" 
                     />
                   </div>
                </div>

                <button 
                  onClick={nextStep}
                  disabled={!formData.restaurantName}
                  className="w-full bg-[#ff5a2c] text-white py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <button onClick={prevStep} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="mb-10">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Service Type.</h2>
                  <p className="text-slate-500 font-medium italic">Select your primary ordering flow.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {[
                     { id: 'Dine-in', icon: Utensils, desc: 'Tables, QR, and Service' },
                     { id: 'Takeaway', icon: ShoppingBag, desc: 'Quick pickup and counter' },
                     { id: 'Delivery', icon: Globe, desc: 'External order management' },
                     { id: 'Digital', icon: Smartphone, desc: 'QR only, no staff' }
                   ].map(type => (
                     <button 
                       key={type.id}
                       onClick={() => setFormData({...formData, serviceType: type.id})}
                       className={`p-6 rounded-[24px] border-2 text-left transition-all ${
                         formData.serviceType === type.id 
                          ? 'border-[#ff5a2c] bg-orange-50 shadow-lg shadow-orange-500/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                       }`}
                     >
                       <type.icon className={formData.serviceType === type.id ? 'text-[#ff5a2c]' : 'text-slate-400'} size={24} />
                       <p className="text-base font-bold mt-4">{type.id}</p>
                       <p className="text-xs font-medium text-slate-400 mt-1">{type.desc}</p>
                     </button>
                   ))}
                </div>

                <button 
                  onClick={handleSignup}
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-[12px] text-lg font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Launch Your Suite"}
                </button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-20">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 mx-auto">
                   <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-900">Deployment Initiated.</h2>
                  <p className="text-slate-500 font-medium italic">Provisioning your cloud infrastructure...</p>
                </div>
                <Loader2 className="w-8 h-8 animate-spin text-[#ff5a2c] mx-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-12 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Already using Bhojan? <Link href="/login" className="text-[#ff5a2c] hover:underline">Sign In</Link>
        </p>
      </footer>
    </div>
  );
}
