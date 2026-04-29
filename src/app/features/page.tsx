"use client";
import Link from "next/link";
import { ArrowLeft, Smartphone, BarChart3, Layers, ChefHat, Zap, ShieldCheck, Globe, Clock, Zap as ZapIcon, Cpu, LayoutDashboard, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesPage() {
  const features = [
    {
      icon: QrCode,
      title: "Digital Matrix",
      desc: "Direct guest-to-kitchen QR ordering protocol with zero latency. Seamless digital menus that update in real-time.",
      detail: "Enable table-side ordering that reduces wait times by 40% and increases average order value by 15% through smart upselling.",
      color: "text-orange-500",
      bg: "bg-orange-50"
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      desc: "Real-time revenue telemetry and staff performance metrics. Track average prep times and table turnover rates.",
      detail: "Visualize your restaurant's performance with heatmaps, trend analysis, and automated reports delivered to your inbox.",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: ChefHat,
      title: "Kitchen Control",
      desc: "Streamline back-of-house operations with smart ticket routing and preparation time tracking.",
      detail: "Avoid ticket confusion with a digital KDS that prioritizes orders based on preparation complexity and urgency.",
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      icon: LayoutDashboard,
      title: "Station Control",
      desc: "Visual floor planning with live density mapping and status. Manage dine-in, takeout, and delivery.",
      detail: "Drag-and-drop table management with real-time status updates (Occupied, Cleaning, Reserved).",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      icon: Cpu,
      title: "AI Forecasting",
      desc: "Predictive inventory and demand modeling using machine learning algorithms.",
      detail: "Reduce waste by predicting busy periods and optimizing your inventory orders based on historical data.",
      color: "text-rose-500",
      bg: "bg-rose-50"
    },
    {
      icon: ShieldCheck,
      title: "Secure Vault",
      desc: "Enterprise-grade security for your financial and customer data. PCI-compliant processing.",
      detail: "Rest easy knowing your data is encrypted at rest and in transit, with role-based access control for all staff.",
      color: "text-indigo-500",
      bg: "bg-indigo-50"
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[10px] font-black text-[#ff5a2c] uppercase tracking-[0.2em] mb-8"
          >
            <ZapIcon size={14} /> Powering Innovation
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-none mb-8 italic uppercase"
          >
            Built for <span className="text-[#ff5a2c]">Excellence.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Discover the core protocols that transform traditional kitchens into high-performance culinary enterprises.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2"
            >
              <div className={`w-20 h-20 ${f.bg} ${f.color} rounded-[24px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6`}>
                <f.icon size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight uppercase italic">{f.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-6">{f.desc}</p>
              <div className="pt-6 border-t border-slate-50">
                 <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wider">{f.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="mt-40 bg-slate-900 rounded-[64px] p-12 md:p-32 relative overflow-hidden text-center">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#ff5a2c_0%,transparent_40%)] opacity-20" />
           <div className="relative z-10 max-w-3xl mx-auto space-y-12">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase italic">Still using paper and <span className="text-[#ff5a2c]">chaos?</span></h2>
              <p className="text-xl text-slate-400 font-medium">It's time to upgrade your infrastructure. Join 500+ restaurants that have already evolved.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <Link href="/login" className="w-full sm:w-auto">
                    <button className="w-full bg-[#ff5a2c] text-white px-12 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-[#ea580c] transition-all shadow-2xl shadow-orange-500/20">Initialize System</button>
                 </Link>
                 <Link href="/pricing" className="w-full sm:w-auto">
                    <button className="w-full bg-white/10 text-white px-12 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">View Pricing</button>
                 </Link>
              </div>
           </div>
        </section>
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
