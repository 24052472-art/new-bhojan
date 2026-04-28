"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


export default function privacyPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Privacy Policy</h1>
          <p className="text-xl text-slate-500 mb-12">How we protect your data and privacy.</p>
          
          
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm prose prose-slate max-w-none">
        <h3 className="text-2xl font-bold mb-4">1. Data Collection</h3>
        <p className="text-slate-600 mb-6">We collect minimal data required to run your restaurant operations efficiently. This includes transaction logs, menu data, and anonymized staff performance metrics.</p>
        
        <h3 className="text-2xl font-bold mb-4">2. Guest Privacy</h3>
        <p className="text-slate-600 mb-6">For QR ordering, we do not require guests to create accounts or download apps. Any payment information processed is heavily encrypted and tokenized by our payment partners.</p>

        <h3 className="text-2xl font-bold mb-4">3. Data Security</h3>
        <p className="text-slate-600">All data is encrypted in transit using TLS 1.3 and at rest using AES-256. We undergo regular security audits to ensure compliance with global data protection standards.</p>
      </div>
    
        </motion.div>
      </main>
      
      <footer className="py-12 px-6 border-t border-slate-100 bg-white mt-20 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  );
}
