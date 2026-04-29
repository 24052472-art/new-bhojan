"use client";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Zap, CreditCard, ShieldCheck, Globe, HelpCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function PricingPage() {
  const plans = [
    { 
      name: "Starter", 
      price: "₹999", 
      desc: "Perfect for small cafes and cloud kitchens.",
      color: "text-slate-700", 
      bg: "bg-white", 
      border: "border-slate-100 hover:border-slate-300", 
      features: ["Up to 5 Tables", "2 Staff Members", "Basic Analytics", "Digital Menu", "Email Support"],
      cta: "Launch Starter"
    },
    { 
      name: "Pro", 
      price: "₹2,499", 
      desc: "Ideal for growing restaurants and busy bars.",
      color: "text-[#ff5a2c]", 
      bg: "bg-white", 
      border: "border-[#ff5a2c] shadow-2xl shadow-[#ff5a2c]/10", 
      features: ["Unlimited Tables", "10 Staff Members", "Advanced Analytics", "QR Payments", "Priority Support", "Kitchen Display System"], 
      popular: true,
      cta: "Initialize Pro"
    },
    { 
      name: "Enterprise", 
      price: "₹4,999", 
      desc: "Scalable infrastructure for large chains.",
      color: "text-slate-900", 
      bg: "bg-slate-900", 
      border: "border-slate-900", 
      features: ["Custom Branded App", "Unlimited Staff", "API Access", "Multi-Unit Support", "Dedicated Manager", "White-Labeling"],
      cta: "Contact Enterprise"
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111827] font-sans selection:bg-[#ff5a2c]/10">
      <nav className="px-6 md:px-12 py-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-3xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
          <ArrowLeft size={16} /> Home
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-24 md:py-40">
        <div className="text-center max-w-4xl mx-auto mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff5a2c]/10 text-[10px] font-black text-[#ff5a2c] uppercase tracking-[0.2em] mb-8"
          >
            <Star size={14} /> Transparent Protocol
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-none mb-8 italic uppercase"
          >
            Subscription <span className="text-[#ff5a2c]">Tiers.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Simple, predictable pricing for world-class restaurant infrastructure. No hidden fees, just pure performance.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden group rounded-[48px] ${plan.bg} border-2 ${plan.border} transition-all duration-500 flex flex-col p-12 h-full shadow-sm hover:shadow-2xl`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-12 bg-[#ff5a2c] text-white px-6 py-2 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-10">
                <h3 className={`text-3xl font-black tracking-tight uppercase italic mb-2 ${plan.name === 'Enterprise' ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm font-medium ${plan.name === 'Enterprise' ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mt-8">
                  <span className={`text-5xl font-black tracking-tighter ${plan.name === 'Enterprise' ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className={`text-sm font-bold uppercase tracking-widest ${plan.name === 'Enterprise' ? 'text-slate-500' : 'text-slate-400'}`}>/month</span>
                </div>
              </div>

              <div className="space-y-4 flex-1 border-t border-slate-100 pt-10">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-4">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-[#ff5a2c]' : 'text-emerald-500'}`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${plan.name === 'Enterprise' ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-12">
                <Link href="/login">
                  <button 
                    className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all text-xs
                      ${plan.popular 
                        ? 'bg-[#ff5a2c] text-white hover:bg-[#ea580c] shadow-xl shadow-[#ff5a2c]/20' 
                        : plan.name === 'Enterprise' 
                        ? 'bg-white text-slate-900 hover:bg-slate-100' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security & Trust */}
        <div className="mt-32 grid md:grid-cols-3 gap-12 border-t border-slate-200 pt-20">
           <div className="flex gap-6">
              <ShieldCheck className="w-12 h-12 text-slate-900 shrink-0" />
              <div>
                 <h4 className="text-lg font-black uppercase italic tracking-tight mb-2">Secure Processing</h4>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">Enterprise-grade encryption for all financial transactions and sensitive data.</p>
              </div>
           </div>
           <div className="flex gap-6">
              <Zap className="w-12 h-12 text-orange-500 shrink-0" />
              <div>
                 <h4 className="text-lg font-black uppercase italic tracking-tight mb-2">Zero Latency</h4>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">Our infrastructure is globally distributed to ensure 99.9% uptime and speed.</p>
              </div>
           </div>
           <div className="flex gap-6">
              <HelpCircle className="w-12 h-12 text-blue-500 shrink-0" />
              <div>
                 <h4 className="text-lg font-black uppercase italic tracking-tight mb-2">Expert Support</h4>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">Dedicated engineering support to help you scale your culinary brand.</p>
              </div>
           </div>
        </div>
      </main>

      <footer className="py-20 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <h1 className="text-2xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
          <p className="text-sm text-slate-400 font-black uppercase tracking-[0.3em]">© 2026 Bhojan Cloud Infrastructure</p>
          <div className="flex gap-8">
             <Link href="/privacy" className="text-xs font-bold text-slate-400 hover:text-slate-900">PRIVACY</Link>
             <Link href="/terms" className="text-xs font-bold text-slate-400 hover:text-slate-900">TERMS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
