"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


export default function termsPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Terms of Service</h1>
          <p className="text-xl text-slate-500 mb-12">Our terms of service and usage policies.</p>
          
          
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm prose prose-slate max-w-none">
        <h3 className="text-2xl font-bold mb-4">1. Service Level Agreement</h3>
        <p className="text-slate-600 mb-6">Bhojan guarantees a 99.99% uptime for our core OS and digital matrix services. Scheduled maintenance will be communicated 48 hours in advance.</p>
        
        <h3 className="text-2xl font-bold mb-4">2. Subscription Terms</h3>
        <p className="text-slate-600 mb-6">Subscriptions are billed on a monthly or annual basis. You may cancel at any time, but refunds are not provided for partial billing periods.</p>

        <h3 className="text-2xl font-bold mb-4">3. Acceptable Use</h3>
        <p className="text-slate-600">You agree not to misuse our services or help anyone else do so. You must not attempt to bypass our security protocols or access unauthorized data.</p>
      </div>
    
        </motion.div>
      </main>
      
      <footer className="py-12 px-6 border-t border-slate-100 bg-white mt-20 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  );
}
