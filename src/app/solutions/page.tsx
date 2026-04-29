"use client";
import Link from "next/link";
import { ArrowLeft, Utensils, Coffee, Pizza, Wine, ShoppingBag, Globe, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SolutionsPage() {
  const solutions = [
    {
      icon: Coffee,
      title: "Cafes & Bakeries",
      desc: "Optimized for high-volume transactions and quick turnaround. Manage loyalty and simple menus with ease.",
      features: ["Quick QR Payments", "Digital Loyalty Cards", "Morning Rush Management"],
      bg: "bg-amber-50",
      color: "text-amber-600"
    },
    {
      icon: Utensils,
      title: "Fine Dining",
      desc: "Elevate the guest experience with elegant digital menus and table-side service optimization.",
      features: ["Premium Menu Displays", "Sommelier Mode", "Reservation Integration"],
      bg: "bg-slate-900",
      color: "text-white"
    },
    {
      icon: Pizza,
      title: "Fast Food & QSR",
      desc: "Engineered for speed. Reduce queue times and automate order routing to multiple prep stations.",
      features: ["Self-Service Kiosks", "KDS Routing", "Live Order Tracking"],
      bg: "bg-rose-50",
      color: "text-rose-600"
    },
    {
      icon: Wine,
      title: "Bars & Kitchens",
      desc: "Manage open tabs, shared plates, and inventory across multiple serving stations seamlessly.",
      features: ["Tab Management", "Stock Alerts", "Happy Hour Automation"],
      bg: "bg-indigo-50",
      color: "text-indigo-600"
    },
    {
      icon: ShoppingBag,
      title: "Cloud Kitchens",
      desc: "Aggregate orders from multiple platforms into one unified dashboard. Optimize delivery logistics.",
      features: ["Platform Aggregation", "Dispatch Analytics", "Inventory Sync"],
      bg: "bg-emerald-50",
      color: "text-emerald-600"
    },
    {
      icon: Globe,
      title: "Multi-Unit Chains",
      desc: "Centralized control for growing brands. Manage 10 or 100 locations from a single command center.",
      features: ["Global Menu Sync", "Cross-Outlet Reporting", "Staff Transfers"],
      bg: "bg-blue-50",
      color: "text-blue-600"
    }
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-8"
          >
            <Globe size={14} /> Global Solutions
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-none mb-8 italic uppercase"
          >
            Tailored <span className="text-[#ff5a2c]">Industries.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            No matter the scale or style, Bhojan provides the specialized infrastructure required to dominate your market.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group ${s.bg === 'bg-slate-900' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} p-12 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between h-full`}
            >
              <div>
                <div className={`w-16 h-16 ${s.bg === 'bg-slate-900' ? 'bg-white/10' : s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                  <s.icon size={32} strokeWidth={2} />
                </div>
                <h3 className="text-3xl font-black mb-6 tracking-tight uppercase italic">{s.title}</h3>
                <p className={`${s.bg === 'bg-slate-900' ? 'text-slate-400' : 'text-slate-500'} font-medium leading-relaxed mb-10`}>{s.desc}</p>
                
                <div className="space-y-4">
                  {s.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-[#ff5a2c]" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-80">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5">
                <Link href="/login">
                  <button className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${s.bg === 'bg-slate-900' ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    Deploy Solution
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
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
