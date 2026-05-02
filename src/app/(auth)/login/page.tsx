"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isError, setIsError] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setSession(user);
    });
    return () => unsubscribe();
  }, []);

  const handleEnter = async (e?: any) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No active session");
      if (user.email === 'abhi.kush047@gmail.com') return window.location.assign("/dashboard/super-admin");

      const { getProfileByAuth } = await import('@/app/(auth)/actions');
      const { profile, error } = await getProfileByAuth(user.uid, user.email || "");
      if (error || !profile) throw new Error(error || "Profile not found. Please sign up first.");

      let target = "/dashboard/admin";
      if (profile.role === 'super_admin') target = "/dashboard/super-admin";
      if (profile.role === 'owner') target = "/dashboard/admin";
      if (profile.role === 'waiter') target = "/dashboard/waiter";
      if (profile.role === 'kitchen') target = "/dashboard/kitchen";
      window.location.assign(target);
    } catch (err: any) {
      toast.error(err.message);
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleEnter();
    } catch (error: any) {
      setIsError(true);
      setTimeout(() => setIsError(false), 600);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         toast.error("Invalid email or password. Please try again.");
      } else {
         toast.error(error.message);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9fb] font-sans">
      {/* Left Panel: Visual/Marketing */}
      <div className="hidden lg:flex flex-1 bg-slate-900 p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute inset-0 bg-[#ff5a2c]/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <Link href="/" className="relative z-10">
          <h1 className="text-3xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-black text-white tracking-tight leading-[1.1] mb-8">
            The infrastructure for <span className="text-[#ff5a2c]"> culinary innovation.</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            Join the elite circle of 500+ restaurants scaling their operations with precision.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
           <div className="w-8 h-[1px] bg-slate-800" />
           Trusted by Global Chains
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back.</h3>
            <p className="text-slate-500 font-medium italic">Authenticate to access your dashboard.</p>
          </div>

          {session ? (
            <div className="space-y-6">
               <div className="p-6 bg-white border border-slate-200 rounded-[20px] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-[#ff5a2c] flex items-center justify-center font-bold">
                     {session.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Logged In As</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{session.email}</p>
                  </div>
               </div>
               
               <button 
                 onClick={handleEnter}
                 disabled={isLoading}
                 className="w-full bg-[#ff5a2c] text-white py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
               >
                 {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><LayoutDashboard size={20} /> Launch Dashboard</>}
               </button>

               <button 
                 onClick={() => auth.signOut().then(() => window.location.reload())}
                 className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-all"
               >
                 Sign out of current account
               </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div 
                className="space-y-4"
                animate={isError ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isError ? 'text-red-400' : 'text-slate-400'}`}>Work Email</label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#ff5a2c]'}`} />
                    <input 
                      required 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@restaurant.com" 
                      className={`w-full h-12 bg-white border rounded-[12px] pl-12 pr-4 outline-none focus:ring-4 transition-all font-medium text-sm ${isError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 text-red-900 bg-red-50/50' : 'border-slate-200 focus:border-[#ff5a2c] focus:ring-orange-500/5'}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isError ? 'text-red-400' : 'text-slate-400'}`}>Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#ff5a2c]'}`} />
                    <input 
                      required 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className={`w-full h-12 bg-white border rounded-[12px] pl-12 pr-12 outline-none focus:ring-4 transition-all font-medium text-sm ${isError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 text-red-900 bg-red-50/50' : 'border-slate-200 focus:border-[#ff5a2c] focus:ring-orange-500/5'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>

              <button 
                disabled={isLoading} 
                type="submit" 
                className="w-full bg-[#ff5a2c] text-white py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Sign In
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className="text-center">
                <Link href="/signup" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-[#ff5a2c] transition-all">
                  Don't have an account? <span className="text-[#ff5a2c]">Register</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
