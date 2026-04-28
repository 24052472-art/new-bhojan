const fs = require('fs');
const path = require('path');

const pages = [
  { 
    path: 'features', 
    title: 'Features', 
    desc: 'Discover all the powerful features Bhojan offers to supercharge your restaurant.',
    content: `
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
    `,
    imports: `import { Smartphone, BarChart3, Layers, ChefHat } from "lucide-react";`
  },
  { 
    path: 'analytics', 
    title: 'Analytics & Reporting', 
    desc: 'Gain deep insights into your business with our advanced analytics.',
    content: `
      <div className="space-y-12">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-black">Real-time Telemetry</h3>
            <p className="text-slate-500 text-lg">Watch your revenue grow in real-time. Our dashboard provides up-to-the-second synchronization of all transactions across your restaurant.</p>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={20} className="text-[#ff5a2c]"/> Live daily revenue tracking</li>
              <li className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={20} className="text-[#ff5a2c]"/> Active table status</li>
              <li className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={20} className="text-[#ff5a2c]"/> Average preparation time monitoring</li>
            </ul>
          </div>
          <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <span className="font-bold">Daily Revenue</span>
              <span className="text-emerald-500 font-bold">+12.5%</span>
            </div>
            <div className="h-32 bg-gradient-to-t from-orange-100 to-transparent rounded-lg border-b-2 border-[#ff5a2c]"></div>
          </div>
        </div>
      </div>
    `,
    imports: `import { CheckCircle2 } from "lucide-react";`
  },
  { 
    path: 'qr-ordering', 
    title: 'QR Ordering System', 
    desc: 'Seamless and contact-free ordering experience for your customers.',
    content: `
      <div className="space-y-8">
        <div className="bg-[#ff5a2c] text-white p-8 md:p-12 rounded-3xl shadow-xl shadow-orange-500/20 text-center">
          <Smartphone size={48} className="mx-auto mb-6 opacity-80" />
          <h3 className="text-3xl md:text-4xl font-black mb-4">The Digital Matrix</h3>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto">Transform your guest experience with instant, zero-latency ordering directly from their smartphones.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-xl mb-2">Instant Menus</h4>
            <p className="text-slate-500">Update prices and items instantly across all digital touchpoints.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-xl mb-2">Direct to Kitchen</h4>
            <p className="text-slate-500">Orders flow directly to the Kitchen Display System without waiter intervention.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-xl mb-2">Smart Upselling</h4>
            <p className="text-slate-500">Automated recommendations based on order history and pairings.</p>
          </div>
        </div>
      </div>
    `,
    imports: `import { Smartphone } from "lucide-react";`
  },
  { 
    path: 'about', 
    title: 'About Bhojan', 
    desc: 'Cloud Infrastructure for the worlds most innovative culinary brands.',
    content: `
      <div className="prose prose-lg max-w-none text-slate-600">
        <p className="text-xl leading-relaxed mb-6">
          Bhojan was founded with a single mission: to provide modern restaurants with the operating system they need to scale without friction.
        </p>
        <p className="mb-6">
          The restaurant industry has historically relied on fragmented systems—a POS from one company, an analytics dashboard from another, and a completely disconnected QR ordering system. Bhojan unifies these into a single, cohesive ecosystem.
        </p>
        <div className="bg-slate-900 text-white p-8 rounded-3xl my-10">
          <h3 className="text-2xl font-black mb-4 text-white">Our Vision</h3>
          <p className="text-slate-300">To be the invisible infrastructure powering the world's most successful culinary operations, allowing chefs and owners to focus on what matters most: the food and the guest experience.</p>
        </div>
      </div>
    `,
    imports: ``
  },
  { 
    path: 'customers', 
    title: 'Our Customers', 
    desc: 'Join 500+ premium restaurants worldwide using Bhojan.',
    content: `
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
    `,
    imports: ``
  },
  { 
    path: 'contact', 
    title: 'Contact Us', 
    desc: 'Get in touch with our team for support, enterprise pricing, or general inquiries.',
    content: `
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Email Support</h3>
            <p className="text-slate-500 mb-6">For general queries, billing, and technical support.</p>
            <a href="mailto:abhi.kush047@gmail.com" className="inline-flex items-center gap-2 font-bold text-[#ff5a2c] hover:underline">
              abhi.kush047@gmail.com
            </a>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-4">WhatsApp Direct</h3>
            <p className="text-slate-500 mb-6">For immediate assistance and sales inquiries.</p>
            <a href="https://wa.me/9779749939797" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-emerald-600 hover:underline">
              +977 9749939797
            </a>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-2xl font-black mb-6">Global Operations</h3>
          <p className="text-slate-400 mb-8">While our software powers restaurants globally, our core team operates from our primary headquarters.</p>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Location</p>
              <p className="font-medium">Kathmandu, Nepal</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Hours</p>
              <p className="font-medium">24/7 Support Available</p>
            </div>
          </div>
        </div>
      </div>
    `,
    imports: ``
  },
  { 
    path: 'privacy', 
    title: 'Privacy Policy', 
    desc: 'How we protect your data and privacy.',
    content: `
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm prose prose-slate max-w-none">
        <h3 className="text-2xl font-bold mb-4">1. Data Collection</h3>
        <p className="text-slate-600 mb-6">We collect minimal data required to run your restaurant operations efficiently. This includes transaction logs, menu data, and anonymized staff performance metrics.</p>
        
        <h3 className="text-2xl font-bold mb-4">2. Guest Privacy</h3>
        <p className="text-slate-600 mb-6">For QR ordering, we do not require guests to create accounts or download apps. Any payment information processed is heavily encrypted and tokenized by our payment partners.</p>

        <h3 className="text-2xl font-bold mb-4">3. Data Security</h3>
        <p className="text-slate-600">All data is encrypted in transit using TLS 1.3 and at rest using AES-256. We undergo regular security audits to ensure compliance with global data protection standards.</p>
      </div>
    `,
    imports: ``
  },
  { 
    path: 'terms', 
    title: 'Terms of Service', 
    desc: 'Our terms of service and usage policies.',
    content: `
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm prose prose-slate max-w-none">
        <h3 className="text-2xl font-bold mb-4">1. Service Level Agreement</h3>
        <p className="text-slate-600 mb-6">Bhojan guarantees a 99.99% uptime for our core OS and digital matrix services. Scheduled maintenance will be communicated 48 hours in advance.</p>
        
        <h3 className="text-2xl font-bold mb-4">2. Subscription Terms</h3>
        <p className="text-slate-600 mb-6">Subscriptions are billed on a monthly or annual basis. You may cancel at any time, but refunds are not provided for partial billing periods.</p>

        <h3 className="text-2xl font-bold mb-4">3. Acceptable Use</h3>
        <p className="text-slate-600">You agree not to misuse our services or help anyone else do so. You must not attempt to bypass our security protocols or access unauthorized data.</p>
      </div>
    `,
    imports: ``
  },
  { 
    path: 'security', 
    title: 'Security Infrastructure', 
    desc: 'Enterprise-grade security for your peace of mind.',
    content: `
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
    `,
    imports: `import { Shield, Lock } from "lucide-react";`
  }
];

pages.forEach(p => {
  const dir = path.join(__dirname, '..', 'src', 'app', p.path);
  fs.mkdirSync(dir, { recursive: true });
  
  const content = `"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
${p.imports}

export default function ${p.path.replace(/-/g, '')}Page() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">${p.title}</h1>
          <p className="text-xl text-slate-500 mb-12">${p.desc}</p>
          
          ${p.content}
        </motion.div>
      </main>
      
      <footer className="py-12 px-6 border-t border-slate-100 bg-white mt-20 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});

console.log("Detailed pages generated successfully!");
