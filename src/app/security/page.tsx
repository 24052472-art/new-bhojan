"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";

export default function securityPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Security Infrastructure</h1>
          <p className="text-xl text-slate-500 mb-12">Enterprise-grade security for your peace of mind.</p>
          
          
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-6"><Shield size={24} /></div>
            <h3 className="text-2xl font-bold mb-3">End-to-End Encryption</h3>
            <p className="text-slate-500">All data transmitted between the cloud and your local stations is fully encrypted. We use industry-standard TLS protocols.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-6"><Lock size={24} /></div>
            <h3 className="text-2xl font-bold mb-3">Role-Based Access</h3>
            <p className="text-slate-500">Strict permission controls ensure that waitstaff, kitchen crew, and management only have access to the data they need.</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl text-center">
          <h3 className="text-3xl font-black mb-4">99.99% Uptime Guarantee</h3>
          <p className="text-slate-400 max-w-2xl mx-auto">Our distributed cloud infrastructure is designed to handle immense scale. Even during peak dinner rushes, Bhojan remains fast, responsive, and secure.</p>
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
