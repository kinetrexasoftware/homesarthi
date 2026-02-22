import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Star, TrendingUp, Users, Heart, ClipboardCheck, Phone, CheckCircle, ChevronDown, ChevronUp, FileText, MessageCircle, Key, Plus, Minus, HelpCircle, Sparkles, Zap, Target, ShieldCheck, Home as HomeIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import RoomCard from '../components/rooms/RoomCard';
import LocationSearch from '../components/common/LocationSearch';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [metrics, setMetrics] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [activity, setActivity] = useState([]);
  const [locations, setLocations] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Featured Rooms
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // UI States
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [howItWorksTab, setHowItWorksTab] = useState('student');

  const studentSteps = [
    { icon: <Search size={28} />, title: 'Smart Search', desc: 'Find premium rooms near your college or city instantly.' },
    { icon: <ShieldCheck size={28} />, title: 'Verified Only', desc: 'Every listing is manually vetted. Review owner docs & real photos.' },
    { icon: <MessageCircle size={28} />, title: 'Direct Chat', desc: 'Talk to owners directly. Save thousands by skipping brokers.' },
    { icon: <Sparkles size={28} />, title: 'Move In', desc: 'Secure your room and start your hassle-free semester!' }
  ];

  const ownerSteps = [
    { icon: <Target size={28} />, title: 'Post Property', desc: 'Upload property details & photos to reach 10k+ students.' },
    { icon: <Zap size={28} />, title: 'Quick Approval', desc: 'Get your listing verified and live in under 24 hours.' },
    { icon: <Users size={28} />, title: 'Direct Inquiries', desc: 'Students contact you directly through our secure chat.' },
    { icon: <HomeIcon size={28} />, title: 'Fill Vacancies', desc: 'Get verified student tenants with zero middleman apps or fees.' }
  ];

  const defaultFaqs = [
    { question: "Is HomeSarthi free for students?", answer: "Yes, it is 100% free for students. No hidden charges or commissions." },
    { question: "How do I contact an owner?", answer: "Simply click the 'Chat' button on any room page to start a direct conversation." },
    { question: "Are the listings verified?", answer: "Yes, we verify ownership documents for every listing to ensure your safety." },
    { question: "Can I list my property for free?", answer: "Yes! Owners can list their property for free and connect with students." },
    { question: "Is my personal data safe?", answer: "Absolutely. We use industry-standard encryption and never share your data." },
    { question: "What is Zero Brokerage?", answer: "It means you pay directly to the owner. There is no middleman or fee." }
  ];

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  useEffect(() => {
    fetchHomeData();
    fetchFeaturedRooms();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [metricsRes, testimonialsRes, activityRes, locationsRes, faqsRes] =
        await Promise.allSettled([
          api.get('/metrics/home'),
          api.get('/testimonials?limit=3'),
          api.get('/activity/recent'),
          api.get('/locations/featured'),
          api.get('/faqs?category=general')
        ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data.data);
      if (testimonialsRes.status === 'fulfilled') setTestimonials(testimonialsRes.value.data.data);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data.data);
      if (locationsRes.status === 'fulfilled') setLocations(locationsRes.value.data.data);
      if (faqsRes.status === 'fulfilled') setFaqs(faqsRes.value.data.data);
    } catch (error) {
      console.error('Failed to load home data', error);
    }
  };

  const fetchFeaturedRooms = async () => {
    try {
      setLoadingRooms(true);
      const { data } = await api.get(`/rooms?limit=3&sortBy=-createdAt`);
      setFeaturedRooms(data.data.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return '1d ago';
  };

  return (
    <div className="overflow-hidden bg-white">
      {/* 1. HERO SECTION - TRUST & REAL METRICS */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 py-20 bg-gradient-to-br from-blue-600 to-purple-800 text-white overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Trust Badge / Metrics Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
          >
            <Shield size={16} className="text-green-400" />
            <span className="text-sm font-medium">
              {metrics ? (
                `Verified listings across ${metrics.citiesCovered || 1} cities`
              ) : (
                '100% Verified Student Housing Platform'
              )}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-green-300">Safe Haven</span>
            <br />Near Campus
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
          >
            Directly connect with verified owners. No brokers, no hidden fees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <LocationSearch
              placeholder="Enter your college (e.g., 'IIT Delhi' or 'Amity')"
              onLocationSelect={(location) => {
                navigate(`/rooms?lat=${location.latitude}&lng=${location.longitude}&address=${encodeURIComponent(location.address)}`);
              }}
            />
          </motion.div>

          {/* Trust Signals below search */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
            <span className="flex items-center gap-1"><CheckCircle size={14} /> 24hr Verification</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} /> Instant Chats</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} /> Secure </span>
          </div>
        </div>
      </section>

      {/* 2. REAL METRICS STRIP (Only if data exists) */}
      {metrics && (
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto py-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.activeListings || 0}</div>
              <div className="text-gray-500 text-sm">Active Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.verifiedOwners || 0}</div>
              <div className="text-gray-500 text-sm">Verified Owners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.avgResponseTimeHours || 2}h</div>
              <div className="text-gray-500 text-sm">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.citiesCovered || 1}</div>
              <div className="text-gray-500 text-sm">Cities Active</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RECENT REAL ACTIVITY FEED */}
      {activity.length > 0 && (
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-8 text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium uppercase tracking-wider">Happening Now on HomeSarthi</span>
            </div>
            <div className="grid gap-3">
              {activity.slice(0, 3).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white px-4 py-3 rounded-lg shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-full">
                      {item.type === 'ROOM_FOUND' ? <Heart size={16} /> : <TrendingUp size={16} />}
                    </span>
                    <span className="text-gray-700 text-sm">
                      {item.type === 'ROOM_FOUND' ? (
                        <>Someone found a room in <span className="font-semibold">{item.location}</span></>
                      ) : (
                        <>New verified listing added in <span className="font-semibold">{item.location}</span></>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{formatTimeAgo(item.timestamp)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. WHY CHOOSE ROOMSARTHI (with Cartoon) */}
      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Left: Animated Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 relative"
            >
              <div className="relative z-10 w-full max-w-lg mx-auto">
                <img
                  src="/why-choose-us.png"
                  alt="Happy students finding a room"
                  className="w-full h-auto drop-shadow-xl hover:scale-105 transition-transform duration-500 ease-in-out"
                />
              </div>
              {/* Blobs */}
              <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            </motion.div>

            {/* Right: Value Props */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2"
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">
                More Than Just A <span className="text-blue-600">Room Finder</span>
              </h2>
              <p className="text-lg text-gray-600 mb-10">
                We built HomeSarthi because we were students too. We know the struggle of fake brokers and unsafe locations. Here's why 10,000+ students trust us.
              </p>

              <div className="space-y-8">
                {[
                  {
                    icon: <Shield className="text-blue-600" size={24} />,
                    title: "100% Verified Owners",
                    desc: "Every listing is vetted. We verify ownership documents so you don't have to worry about scams."
                  },
                  {
                    icon: <CheckCircle className="text-green-500" size={24} />,
                    title: "Zero Brokerage",
                    desc: "Connect directly with landlords. Save thousands in brokerage fees and spend it on your studies (or parties)."
                  },
                  {
                    icon: <MapPin className="text-purple-600" size={24} />,
                    title: "Campus-First Search",
                    desc: "Don't just search by city. Search by 'Distance from IIT' or 'Walking distance to Metro'."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. VERIFIED TESTIMONIALS (Only shows if verified=true) */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-blue-900 text-white px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Trusted by Students Like You</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-blue-800 p-8 rounded-2xl border border-blue-700"
                >
                  <div className="mb-4 text-green-300 flex gap-1">
                    {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-lg mb-6 leading-relaxed">"{t.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {t.studentName[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{t.studentName}</div>
                      <div className="text-xs text-blue-300">{t.college || t.city} • Verified User</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. HOW IT WORKS - INTERACTIVE CHAIN */}
      <section className="py-24 px-4 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="flex justify-center mt-8">
              <div className="inline-flex p-1 bg-gray-100 rounded-2xl">
                <button
                  onClick={() => setHowItWorksTab('student')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${howItWorksTab === 'student' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  I'm a Student
                </button>
                <button
                  onClick={() => setHowItWorksTab('owner')}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${howItWorksTab === 'owner' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  I'm an Owner
                </button>
              </div>
            </div>
          </div>

          <div className="relative mt-20">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
              {(howItWorksTab === 'student' ? studentSteps : ownerSteps).map((step, idx) => (
                <motion.div
                  key={idx + howItWorksTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 text-center group hover:border-blue-500 transition-all"
                >
                  <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all ${howItWorksTab === 'student' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED ROOMS */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Recently Added</h2>
              <p className="text-gray-600">Fresh listings verified by our team</p>
            </div>
            <Link to="/rooms" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
              View All <TrendingUp size={16} />
            </Link>
          </div>

          {loadingRooms ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : featuredRooms.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredRooms.map(room => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
              <p>New verified listings launch every morning at 10 AM.</p>
            </div>
          )}
        </div>
      </section>

      {/* 7. FEATURED LOCATIONS */}
      {locations.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Popular Student Cities</h2>
            <div className="flex flex-wrap gap-4">
              {locations.map((loc, i) => (
                <Link
                  to={`/rooms?city=${loc.cityName}`}
                  key={i}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <MapPin size={16} />
                  <span className="font-medium">{loc.cityName}</span>
                  <span className="text-gray-400 text-xs">({loc.listingCount})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FAQ SECTION */}
      <section className="py-24 px-4 bg-blue-50/50">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
          {/* Left: Illustration & Title */}
          <div className="lg:w-1/3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-bold text-sm mb-6">
              <HelpCircle size={16} />
              <span>SUPPORT CENTER</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Common Questions</h2>
            <p className="text-gray-600 text-lg mb-8">Can't find what you're looking for? Our team is available 24/7 to help you find the perfect room.</p>
            <img src="/faq-help.png" alt="Help Center" className="w-full max-w-sm rounded-3xl mix-blend-multiply" />
          </div>

          {/* Right: Accordion */}
          <div className="lg:w-2/3 space-y-4">
            {displayFaqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-transparent hover:border-blue-200 transition-all">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-lg text-gray-900">{faq.question}</span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${openFaqIndex === index ? 'bg-blue-600 text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                    {openFaqIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 pt-2 text-gray-600 border-t border-gray-100 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to find your new home?</h2>
            <p className="text-xl opacity-90 mb-8">Join thousands of students who trust HomeSarthi.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/rooms" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all">
                  Browse Rooms
                </Link>
              ) : (
                <>
                  <Link to="/register?role=student" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all">
                    I'm a Student
                  </Link>
                  <Link to="/register?role=owner" className="px-8 py-4 bg-blue-800 text-white rounded-xl font-bold hover:bg-blue-900 transition-all">
                    I'm an Owner
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
