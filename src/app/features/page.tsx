"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Smartphone, BarChart3, Layers, ChefHat } from "lucide-react";

export default function featuresPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111827] font-sans selection:bg-[#ff5a2c]/10">
      <nav className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-[#ff5a2c] tracking-tighter italic">BHOJAN</h1>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Features</h1>
          <p className="text-xl text-slate-500 mb-12">Discover all the powerful features Bhojan offers to supercharge your restaurant.</p>
          
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-orange-50 text-[#ff5a2c] rounded-xl flex items-center justify-center mb-6"><Smartphone size={24} /></div>
          <h3 className="text-2xl font-bold mb-3">Digital Matrix</h3>
          <p className="text-slate-500">Direct guest-to-kitchen QR ordering protocol with zero latency. Seamless digital menus that update in real-time.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-6"><BarChart3 size={24} /></div>
          <h3 className="text-2xl font-bold mb-3">Deep Analytics</h3>
          <p className="text-slate-500">Real-time revenue telemetry and staff performance metrics. Track average prep times and table turnover rates.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-6"><Layers size={24} /></div>
          <h3 className="text-2xl font-bold mb-3">Station Control</h3>
          <p className="text-slate-500">Visual floor planning with live density mapping and status. Manage dine-in, takeout, and delivery from one unified interface.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-6"><ChefHat size={24} /></div>
          <h3 className="text-2xl font-bold mb-3">Kitchen Display System</h3>
          <p className="text-slate-500">Streamline back-of-house operations with smart ticket routing and preparation time tracking.</p>
        </div>
      </div>
    
        </motion.div>
      </main>
      
      <footer className="py-12 px-6 border-t border-slate-100 bg-white mt-20 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  );
}
