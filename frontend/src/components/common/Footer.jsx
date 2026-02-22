import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Send,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  Globe,
  Smartphone,
  Zap,
  Shield,
  Search,
  Award,
  Download
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Consolidated Link Management
  const navigationHub = [
    { name: 'Find Rooms', path: '/rooms' },
    { name: 'About Our Story', path: '#' },
    { name: 'Post Property', path: '/register' },
    { name: 'Student Guide', path: '#' },
    { name: 'Safe Living', path: '#' },
    { name: 'Privacy & Terms', path: '#' },
    { name: 'Delete Account', path: '/delete-account' }
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail('');
    }
  };

  return (
    <footer className="relative bg-[#050810] text-gray-400 pt-24 pb-8 overflow-hidden border-t border-blue-900/10 transition-all font-sans">
      {/* Dynamic Background Ambiance */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -mr-48 -mt-48"></div>
      <div className="absolute bottom-10 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -ml-24"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* --- MAIN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-20">

          {/* SEGMENT 1: IDENTITY & NEWSLETTER */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="w-16 h-16 flex items-center justify-center group-hover:rotate-3 transition-transform duration-500">
                  <img
                    src="/logo.png"
                    alt="HomeSarthi Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter leading-none italic uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">HomeSarthi</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mt-2">Next-Gen Housing Ecosystem</p>
                </div>
              </Link>
              <p className="text-xl leading-relaxed text-gray-500 font-medium italic max-w-md">
                We're on a mission to organize India's student living. Organized listing, verified owners, and zero brokerage.
              </p>
            </div>

            {/* Newsletter Integrated */}
            <div className="relative p-8 rounded-[2.5rem] bg-white/[0.02] border border-blue-500/10 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-2xl rounded-full"></div>
              {!subscribed ? (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <h4 className="text-white font-black italic tracking-tight text-lg">Join the Elite Student Hub</h4>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-blue-500/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="University Email"
                      className="w-full bg-gray-950/50 border border-blue-500/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    />
                    <button className="absolute right-2 bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-500 transition-colors shadow-lg">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-4 py-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <p className="text-white font-bold leading-tight uppercase text-xs tracking-widest">You're in the inner circle.</p>
                </div>
              )}
            </div>

            {/* Clean Social Connect */}
            <div className="flex gap-4">
              {[Instagram, Facebook, Linkedin, Twitter, Youtube].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  whileHover={{ y: -5, backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
                  className="w-11 h-11 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-500 hover:text-blue-400 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* SEGMENT 2: NAVIGATION & HUB */}
          <div className="lg:col-span-3 space-y-12">
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 border-l-2 border-blue-600 pl-4 italic">Navigation</h4>
              <ul className="space-y-5">
                {navigationHub.map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="group flex items-center font-bold text-gray-500 transition-all hover:text-blue-500 leading-none">
                      <span className="group-hover:translate-x-2 transition-transform duration-300 text-sm tracking-wide">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase">PCI-DSS Secure</span>
              </div>
              <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
                <Globe className="w-6 h-6 text-blue-500" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase font-sans">Global Platform Architecture</span>
              </div>
            </div>
          </div>

          {/* SEGMENT 3: DIRECT ACCESS & PLAYSTORE */}
          <div className="lg:col-span-4 space-y-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 border-l-2 border-green-600 pl-4 italic">Direct Access</h4>

            {/* Direct Access Card - Polished */}
            <div className="relative group p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600/[0.08] to-transparent border border-blue-500/10 flex flex-col gap-8 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 shadow-lg">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/40 mb-1">Corporate Support</p>
                  <a href="mailto:support@homesarthi.com" className="text-white font-black text-lg hover:text-blue-500 tracking-tighter truncate block">homesarthi247@gmail.com</a>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 border border-green-500/20 shadow-lg">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500/40 mb-1">24/7 Helpline</p>
                  <a href="tel:+918000000000" className="text-white font-black text-lg hover:text-green-500 tracking-tighter">+91 7880717527</a>
                </div>
              </div>

              <motion.a
                href="https://wa.me/918000000000"
                whileHover={{ y: -5, shadow: "0 20px 30px -10px rgb(37 211 102 / 0.3)" }}
                className="flex items-center justify-center gap-3 bg-[#25D366] text-black font-black py-4.5 rounded-[1.5rem] transition-all shadow-xl shadow-green-600/10"
              >
                <MessageCircle className="w-12 h-12" />
                WhatsApp Expert
              </motion.a>
            </div>

            {/* Google Play Button - Professional Layout */}
            <div className="pt-2">
              <motion.a
                href="#"
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between gap-6 bg-white text-black pl-6 pr-1.5 py-1.5 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] group transition-all"
              >
                <div className="text-left font-black tracking-tighter uppercase leading-none space-y-1 py-1">
                  <p className="text-[10px] text-gray-400 tracking-widest italic leading-none">Available on</p>
                  <p className="text-2xl italic">Google Play</p>
                </div>
                <div className="w-14 h-14 bg-gray-950 rounded-[1.5rem] flex items-center justify-center text-white group-hover:bg-blue-600 transition-all duration-300">
                  <Smartphone className="w-7 h-7" />
                </div>
              </motion.a>
            </div>
          </div>
        </div>

        {/* --- REFINED BOTTOM BAR --- */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 py-4">

            {/* Copyright & Tagline Group */}
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="space-y-1">
                <p className="text-gray-600 font-black uppercase tracking-[0.2em] text-[10px] italic">
                  &copy; {currentYear} <span className="text-white opacity-90 border-b-2 border-blue-600 shadow-blue-500/50 pb-0.5">Kintrexa Software Private Limited</span>
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-800 italic mt-1 leading-none">Engineering Student Liberty</p>
              </div>
            </div>

            {/* Location & Made with Love Hub */}
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-3 bg-white/[0.03] px-5 py-2 rounded-full border border-white/5 shadow-inner">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] italic leading-none">
                  Mainframe UP, India
                </p>
              </div>

              <div className="flex items-center gap-2.5 px-6 py-2 bg-blue-600/5 rounded-full border border-blue-500/10">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] italic">Made in</p>
                <motion.span
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-rose-600 text-lg leading-none"
                >
                  ❤
                </motion.span>
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] italic">India</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Signature Thick Blue Bar */}
      <div className="h-3 w-full bg-blue-600 shadow-[0_-15px_50px_rgba(37,99,235,0.4)] mt-4 relative z-20"></div>
    </footer>
  );
};

export default Footer;
