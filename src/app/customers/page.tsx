"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


export default function customersPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Our Customers</h1>
          <p className="text-xl text-slate-500 mb-12">Join 500+ premium restaurants worldwide using Bhojan.</p>
          
          
      <div className="space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-center h-32">
            <span className="font-black text-2xl text-slate-300">BISTRO 99</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-center h-32">
            <span className="font-black text-2xl text-slate-300">LUMIÈRE</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-center h-32">
            <span className="font-black text-2xl text-slate-300">THE GRILL</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-center h-32">
            <span className="font-black text-2xl text-slate-300">ZEN SUSHI</span>
          </div>
        </div>
        <div className="bg-orange-50 p-8 md:p-12 rounded-3xl border border-orange-100">
          <p className="text-xl md:text-2xl font-medium text-slate-800 italic mb-6">
            "Since switching to Bhojan, our table turnover rate has improved by 20% and our kitchen communication is flawless. It is truly the operating system of the future."
          </p>
          <p className="font-bold text-[#ff5a2c]">Executive Chef, Lumière</p>
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
