"use client";

import { 
  ChefHat, 
  Smartphone, 
  BarChart3, 
  Zap,
  ChevronRight,
  ArrowRight,
  LayoutDashboard,
  Layers,
  Globe,
  CheckCircle2,
  Menu as MenuIcon
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111827] font-sans selection:bg-[#ff5a2c]/10 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-bold text-slate-600 hover:text-[#ff5a2c] transition-colors">Features</Link>
          <Link href="#solutions" className="text-sm font-bold text-slate-600 hover:text-[#ff5a2c] transition-colors">Solutions</Link>
          <Link href="#pricing" className="text-sm font-bold text-slate-600 hover:text-[#ff5a2c] transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
          <Link href="/login">
            <button className="bg-[#ff5a2c] text-white px-6 py-2.5 rounded-[10px] text-sm font-bold hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 md:pb-40 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-[#ff5a2c] mb-8"
          >
            <Zap size={14} /> Next-Gen Restaurant OS
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8"
          >
            The Operating System for <br />
            <span className="text-[#ff5a2c]">Modern Restaurants.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium mb-12"
          >
            Unified POS, real-time analytics, and premium QR ordering. 
            Everything you need to scale your culinary empire.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link href="/login">
              <button className="w-full sm:w-auto bg-[#ff5a2c] text-white px-10 py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2">
                Launch System <ChevronRight size={20} />
              </button>
            </Link>
            <button className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-10 py-4 rounded-[12px] text-lg font-bold hover:bg-slate-50 transition-all">
              Watch Demo
            </button>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="absolute inset-0 bg-[#ff5a2c]/5 blur-[120px] rounded-full" />
            <div className="relative bg-white p-2 rounded-[24px] shadow-2xl border border-slate-100">
              <img 
                src="/assets/saas_dashboard_preview.png" 
                alt="Dashboard Preview" 
                className="w-full h-auto rounded-[20px] shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Restaurants", value: "500+" },
            { label: "Daily Orders", value: "25k+" },
            { label: "Uptime", value: "99.99%" },
            { label: "Support", value: "24/7" }
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-40 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Built for Operational <span className="text-[#ff5a2c]">Excellence.</span></h2>
          <p className="text-slate-500 font-medium text-lg">Every tool is engineered for speed, accuracy, and growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Smartphone,
              title: "Digital Matrix",
              desc: "Direct guest-to-kitchen QR ordering protocol. Zero latency.",
              color: "text-orange-500",
              bg: "bg-orange-50"
            },
            {
              icon: BarChart3,
              title: "Deep Analytics",
              desc: "Real-time revenue telemetry and staff performance metrics.",
              color: "text-blue-500",
              bg: "bg-blue-50"
            },
            {
              icon: Layers,
              title: "Station Control",
              desc: "Visual floor planning with live density mapping and status.",
              color: "text-emerald-500",
              bg: "bg-emerald-50"
            }
          ].map((f, i) => (
            <div key={i} className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <f.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-40 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff5a2c]/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">Ready to Scale Your <br /> <span className="text-[#ff5a2c]">Kitchen?</span></h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto font-medium">Join 500+ premium restaurants worldwide using Bhojan to automate their operations.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/login">
                <button className="w-full sm:w-auto bg-[#ff5a2c] text-white px-10 py-4 rounded-[12px] text-lg font-bold hover:bg-[#ea580c] transition-all">Create Free Account</button>
              </Link>
              <button className="w-full sm:w-auto text-white font-bold flex items-center gap-2 hover:gap-4 transition-all">Talk to Sales <ArrowRight size={20} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h2>
            <p className="text-slate-400 max-w-xs font-medium">Cloud Infrastructure for the world's most innovative culinary brands.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
            <div>
              <p className="font-bold mb-6">Product</p>
              <ul className="space-y-4 text-slate-500 font-medium text-sm">
                <li><Link href="#">Features</Link></li>
                <li><Link href="#">Analytics</Link></li>
                <li><Link href="#">QR Ordering</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-6">Company</p>
              <ul className="space-y-4 text-slate-500 font-medium text-sm">
                <li><Link href="#">About</Link></li>
                <li><Link href="#">Customers</Link></li>
                <li><Link href="#">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-6">Legal</p>
              <ul className="space-y-4 text-slate-500 font-medium text-sm">
                <li><Link href="#">Privacy</Link></li>
                <li><Link href="#">Terms</Link></li>
                <li><Link href="#">Security</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-400 font-medium">© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
          <div className="flex gap-6 text-slate-400">
             <Globe size={20} />
             <p className="text-sm font-bold uppercase tracking-widest">Global Ops</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
