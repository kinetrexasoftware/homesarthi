import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Store
} from 'lucide-react';
import logo from '../../assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const navigation = {
    platform: [
      { name: 'Find Rooms', path: '/rooms' },
      { name: 'Post Property', path: '/register' },
      { name: 'How it Works', path: '/#how-it-works' },
      { name: 'Safety Guide', path: '#' }
    ],
    company: [
      { name: 'About Us', path: '#' },
      { name: 'Contact Support', path: 'mailto:homesarthi247@gmail.com' },
      { name: 'Privacy Policy', path: '#' },
      { name: 'Delete Account', path: '/delete-account' }
    ]
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0A0D14] text-gray-400 font-sans border-t border-gray-800/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Brand & Mission */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="HomeSarthi" className="w-12 h-12 object-contain" />
              <div className="leading-tight">
                <h2 className="text-2xl font-black text-white tracking-tighter">HomeSarthi</h2>
                <p className="text-[9px] font-bold text-blue-500 tracking-[0.3em] uppercase">Verified Student Living</p>
              </div>
            </Link>
            <p className="text-base text-gray-500 leading-relaxed max-w-sm">
              We are building India's most trusted student housing ecosystem. Verified owners, direct contact, and zero brokerage—always.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Linkedin, Twitter].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  whileHover={{ y: -3, color: '#3b82f6' }}
                  className="w-10 h-10 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-center transition-colors"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Platform</h4>
            <ul className="space-y-4">
              {navigation.platform.map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm font-medium hover:text-blue-500 transition-colors flex items-center group">
                    <ChevronRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2 text-blue-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Company</h4>
            <ul className="space-y-4">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm font-medium hover:text-blue-500 transition-colors flex items-center group">
                    <ChevronRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2 text-blue-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Download */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-gradient-to-br from-blue-600/10 to-transparent p-8 rounded-[2rem] border border-blue-500/10 space-y-6">
              <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Contact & Support</h4>
              <div className="space-y-4">
                <a href="tel:+917880717527" className="flex items-center gap-4 text-white group">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Phone size={18} />
                  </div>
                  <span className="font-bold tracking-tight">+91 7880717527</span>
                </a>
                <a href="mailto:homesarthi247@gmail.com" className="flex items-center gap-4 text-white group">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Mail size={18} />
                  </div>
                  <span className="font-bold tracking-tight truncate">homesarthi247@gmail.com</span>
                </a>
              </div>

              {/* Play Store Button */}
              <div className="pt-2">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between gap-4 bg-white text-black p-1.5 pl-5 rounded-2xl shadow-xl hover:shadow-blue-500/10 transition-all group"
                >
                  <div className="flex flex-col py-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Download App</span>
                    <span className="text-xl font-black italic tracking-tighter">Google Play</span>
                  </div>
                  <div className="w-12 h-12 bg-[#0A0D14] rounded-xl flex items-center justify-center text-white group-hover:bg-blue-600 transition-colors">
                    <Store size={22} />
                  </div>
                </motion.a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-gray-800/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
              © {currentYear} <span className="text-gray-300">KineTrexa Software Private Limited</span>
            </p>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Engineering Student Liberty • Made with ❤️ in India</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest italic">100% Secure Listing</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-red-500" />
              <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest italic">Mainframe UP, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Blue Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
    </footer>
  );
};

export default Footer;
