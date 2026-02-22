import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, MapPin, Info, IndianRupee, Sparkles, Image,
  CheckCircle, ChevronRight, ChevronLeft, Eye, ScrollText,
  Phone, FileText, Check, AlertCircle, Trash2, Edit3, Upload,
  Users, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploader from '../components/rooms/ImageUploader';
import LocationSettings from '../components/owner/LocationSettings';
import Loader from '../components/common/Loader';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROOM_TYPES, GENDER_PREFERENCES, AMENITIES, FURNISHING_STATUS } from '../utils/constants';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    latitude: '',
    longitude: '',
    rent: '',
    deposit: '',
    roomType: '', // Start empty for mandatory selection
    amenities: [],
    genderPreference: 'any',
    rules: [],
    locationVisibility: 'approximate',
    exactLocation: null,
    availabilityStatus: 'available',
    availableFrom: new Date().toISOString().split('T')[0],
    contactNumber: '',
    furnishing: 'unfurnished',
    electricityBillIncluded: false
  });

  const [images, setImages] = useState([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [electricBill, setElectricBill] = useState(null);
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [billUploading, setBillUploading] = useState(false);
  const [idUploading, setIdUploading] = useState(false);

  const steps = [
    { title: 'Basic Info', icon: Info, description: 'Title and description', group: 'start' },
    { title: 'Location', icon: MapPin, description: 'Address and GPS', group: 'pair' },
    { title: 'Visibility', icon: Eye, description: 'Privacy settings', group: 'pair' },
    { title: 'Pricing', icon: IndianRupee, description: 'Rent and details', group: 'pair' },
    { title: 'Amenities', icon: Sparkles, description: 'Features offered', group: 'pair' },
    { title: 'Photos', icon: Image, description: 'Upload images', group: 'pair' },
    { title: 'Policies', icon: ScrollText, description: 'Rules and terms', group: 'pair' },
    { title: 'Review', icon: CheckCircle, description: 'Check and submit', group: 'end' },
  ];

  const isStepComplete = (stepIndex) => {
    switch (stepIndex) {
      case 0: return formData.title && formData.description && formData.contactNumber && formData.roomType;
      case 1: return formData.city && formData.state && formData.latitude;
      case 2: return true; // Visibility - optional
      case 3: return formData.rent && formData.deposit;
      case 4: return true; // Amenities - optional
      case 5: return images.length > 0 && electricBill && aadhaarCard;
      case 6: return true; // Policies - optional
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (!isStepComplete(currentStep)) {
        toast.error('Please fill all required fields');
        return;
      }
      // Jump logic for paired steps: 0->1, 1->3, 3->5, 5->7
      if (currentStep === 0) setCurrentStep(1);
      else if (currentStep === 1) setCurrentStep(3);
      else if (currentStep === 3) setCurrentStep(5);
      else if (currentStep === 5) setCurrentStep(7);
      else setCurrentStep(prev => prev + 1);

      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      // Jump logic for paired steps: 7->5, 5->3, 3->1, 1->0
      if (currentStep === 7) setCurrentStep(5);
      else if (currentStep === 5) setCurrentStep(3);
      else if (currentStep === 3) setCurrentStep(1);
      else if (currentStep === 1) setCurrentStep(0);
      else setCurrentStep(prev => prev - 1);

      window.scrollTo(0, 0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleAmenity = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity]
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));
        setLocationLoading(false);
        toast.success('Location captured!');
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Failed to get location');
      }
    );
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await resp.json();
      if (data && data.address) {
        setFormData(prev => ({
          ...prev,
          street: data.address.road || data.address.suburb || '',
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          pincode: data.address.postcode || ''
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setBillUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd);
      setElectricBill(res.data.data);
      toast.success('Electric bill uploaded!');
    } catch (err) {
      toast.error('Failed to upload electric bill');
    } finally {
      setBillUploading(false);
    }
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIdUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd);
      setAadhaarCard(res.data.data);
      toast.success('Aadhaar card uploaded!');
    } catch (err) {
      toast.error('Failed to upload Aadhaar card');
    } finally {
      setIdUploading(false);
    }
  };

  const handleImageUpload = async (files) => {
    try {
      setImagesUploading(true);
      const uploadPromises = files.map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post('/upload/image', fd);
        return res.data.data;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages].slice(0, 5));
      toast.success('Photos uploaded!');
    } catch (err) {
      toast.error('Failed to upload photos');
    } finally {
      setImagesUploading(false);
    }
  };

  const handleImageRemove = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const geocodeAddress = async () => {
    const q = `${formData.street}, ${formData.city}, ${formData.state}, ${formData.pincode}, India`;
    setGeoLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon
        }));
        toast.success('Coordinates found!');
      } else {
        toast.error('Could not find address');
      }
    } catch (err) {
      toast.error('Geocoding failed');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepComplete(7)) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        images: images.filter(img => img.url && img.publicId).slice(0, 5),
        rent: {
          amount: Number(formData.rent),
          deposit: Number(formData.deposit || 0),
          currency: 'INR',
          period: 'month'
        },
        verification: {
          electricBill: electricBill,
          aadhaarCard: aadhaarCard,
          status: 'pending'
        },
        location: {
          type: 'Point',
          coordinates: [Number(formData.longitude), Number(formData.latitude)],
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.pincode,
            landmark: formData.landmark
          },
          locationVisibility: formData.locationVisibility,
          exactLocation: formData.exactLocation
        },
        furnishing: formData.furnishing,
        electricityBillIncluded: formData.electricityBillIncluded
      };

      await api.post('/rooms', payload);
      toast.success('Room listed successfully!');
      navigate('/rooms');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row min-h-screen items-stretch gap-4 p-4 lg:p-6">
        <aside className="lg:w-[400px] w-full shrink-0 hidden lg:flex flex-col z-10 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/50 shadow-[0_40px_120px_rgba(0,0,0,0.06)] flex flex-col h-full overflow-y-auto scrollbar-hide">
            {/* Compact Side Heading */}
            <div className="mb-8 p-4 bg-white/50 rounded-3xl border border-white/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
                  <Home size={22} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-black text-gray-900 tracking-tight truncate">
                    List <span className="text-blue-600">Property</span>
                  </h1>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Partner Portal</p>
                </div>

                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100 shrink-0"
                  title="Discard & Exit"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="relative flex flex-col gap-3">
              <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-100 z-0" />

              {/* Basic Info - Standalone */}
              {(() => {
                const idx = 0;
                const step = steps[idx];
                const isActive = currentStep === idx;
                const isCompleted = idx < currentStep;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left relative z-10 group ${isActive ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-white/40'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : (isCompleted ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : <step.icon size={18} />}
                    </div>
                    <div className="flex flex-col pt-0.5">
                      <span className={`text-[13px] font-black leading-none mb-1.5 ${isActive ? 'text-gray-900' : (isCompleted ? 'text-emerald-600' : 'text-gray-400')}`}>{step.title}</span>
                      <p className={`text-[10px] font-medium ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                    </div>
                  </button>
                );
              })()}

              {/* Location + Visibility Pair */}
              <div className={`bg-white/40 backdrop-blur-sm rounded-2xl p-3 border transition-all relative z-10 ${currentStep === 1 ? 'border-blue-200 bg-white/60' : 'border-white/50'}`}>
                {[1, 2].map((idx) => {
                  const step = steps[idx];
                  const isActive = currentStep === 1;
                  const isCompleted = 1 < currentStep;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(1)}
                      className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left mb-2 last:mb-0 ${isActive ? 'bg-white shadow-sm' : 'hover:bg-white/40'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : (isCompleted ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                        {isCompleted ? <Check size={16} strokeWidth={3} /> : <step.icon size={16} />}
                      </div>
                      <div className="flex flex-col pt-0.5">
                        <span className={`text-[12px] font-black leading-none mb-1 ${isActive ? 'text-gray-900' : (isCompleted ? 'text-emerald-600' : 'text-gray-400')}`}>{step.title}</span>
                        <p className={`text-[9px] font-medium ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pricing + Amenities Pair */}
              <div className={`bg-white/40 backdrop-blur-sm rounded-2xl p-3 border transition-all relative z-10 ${currentStep === 3 ? 'border-blue-200 bg-white/60' : 'border-white/50'}`}>
                {[3, 4].map((idx) => {
                  const step = steps[idx];
                  const isActive = currentStep === 3;
                  const isCompleted = 3 < currentStep;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(3)}
                      className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left mb-2 last:mb-0 ${isActive ? 'bg-white shadow-sm' : 'hover:bg-white/40'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : (isCompleted ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                        {isCompleted ? <Check size={16} strokeWidth={3} /> : <step.icon size={16} />}
                      </div>
                      <div className="flex flex-col pt-0.5">
                        <span className={`text-[12px] font-black leading-none mb-1 ${isActive ? 'text-gray-900' : (isCompleted ? 'text-emerald-600' : 'text-gray-400')}`}>{step.title}</span>
                        <p className={`text-[9px] font-medium ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Photos + Policies Pair */}
              <div className={`bg-white/40 backdrop-blur-sm rounded-2xl p-3 border transition-all relative z-10 ${currentStep === 5 ? 'border-blue-200 bg-white/60' : 'border-white/50'}`}>
                {[5, 6].map((idx) => {
                  const step = steps[idx];
                  const isActive = currentStep === 5;
                  const isCompleted = 5 < currentStep;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(5)}
                      className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left mb-2 last:mb-0 ${isActive ? 'bg-white shadow-sm' : 'hover:bg-white/40'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : (isCompleted ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                        {isCompleted ? <Check size={16} strokeWidth={3} /> : <step.icon size={16} />}
                      </div>
                      <div className="flex flex-col pt-0.5">
                        <span className={`text-[12px] font-black leading-none mb-1 ${isActive ? 'text-gray-900' : (isCompleted ? 'text-emerald-600' : 'text-gray-400')}`}>{step.title}</span>
                        <p className={`text-[9px] font-medium ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Review - Standalone */}
              {(() => {
                const idx = 7;
                const step = steps[idx];
                const isActive = currentStep === idx;
                const isCompleted = idx < currentStep;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left relative z-10 group ${isActive ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-white/40'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : (isCompleted ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : <step.icon size={18} />}
                    </div>
                    <div className="flex flex-col pt-0.5">
                      <span className={`text-[13px] font-black leading-none mb-1.5 ${isActive ? 'text-gray-900' : (isCompleted ? 'text-emerald-600' : 'text-gray-400')}`}>{step.title}</span>
                      <p className={`text-[10px] font-medium ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>{step.description}</p>
                    </div>
                  </button>
                );
              })()}
            </div>
            <div className="mt-auto pt-6">
              <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/20 relative overflow-hidden">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1.5">Need Help?</p>
                <h4 className="text-gray-900 text-[11px] font-bold mb-3">Our support team is here for you.</h4>
                <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2">
                  <Phone size={12} /><span>Live Chat</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full flex flex-col min-w-0">
          {/* Mobile Header - Visible only on small screens */}
          <div className="lg:hidden flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Home size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900 leading-tight">List Property</h1>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Partner Portal</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.04)] border border-white/50 relative overflow-hidden flex flex-col flex-1 min-h-[600px]">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

              <div className="relative z-10 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep === 0 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Basic <span className="text-blue-600">Details</span></h2>
                          <p className="text-gray-500 font-medium">Start with the essentials of your property.</p>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Property Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold" placeholder="e.g., Spacious Room near Main Market" required />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number *</label>
                            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold" placeholder="+91 9876543210" required />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold resize-none" placeholder="Describe your property..." required />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest text-[10px]">What are you listing? *</label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {ROOM_TYPES.map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, roomType: type })}
                                  className={`p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${formData.roomType === type
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:bg-gray-50'
                                    }`}
                                >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.roomType === type ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                    {['PG', 'Hostel', 'Flat', 'Individual'].includes(type) ? (
                                      <>
                                        {type === 'PG' && <Home size={20} />}
                                        {type === 'Hostel' && <Users size={20} />}
                                        {type === 'Flat' && <Layers size={20} />}
                                        {type === 'Individual' && <Edit3 size={20} />}
                                      </>
                                    ) : (
                                      <span className="text-sm font-black">{type}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-[1000] uppercase tracking-widest">{type}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="space-y-10">
                        <div>
                          <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Location <span className="text-blue-600">&</span> Visibility</h2>
                          <p className="text-gray-500 font-medium">Where is your property and who can see it?</p>
                        </div>

                        {/* Location Section */}
                        <div className="space-y-6">
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><MapPin size={20} className="text-blue-600" /> Address Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button type="button" onClick={getCurrentLocation} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-600 text-white font-bold"><MapPin size={20} /><span>{locationLoading ? 'Locating...' : 'Use GPS'}</span></button>
                            <button type="button" onClick={geocodeAddress} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border-2 border-blue-100 text-blue-600 font-bold"><Sparkles size={20} /><span>{geoLoading ? 'Finding...' : 'Verify Address'}</span></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Street" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold" required />
                            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold" required />
                            <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold" required />
                            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold" required />
                            <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Lat" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold" required />
                            <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Lon" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold" required />
                          </div>
                        </div>

                        {/* Visibility Section */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Eye size={20} className="text-blue-600" /> Privacy Settings</h3>
                          <LocationSettings locationVisibility={formData.locationVisibility} exactLocation={formData.exactLocation} onVisibilityChange={(v) => setFormData({ ...formData, locationVisibility: v })} onExactLocationChange={(l) => setFormData({ ...formData, exactLocation: l })} />
                        </div>
                      </div>
                    )}



                    {currentStep === 3 && (
                      <div className="space-y-10">
                        <div>
                          <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Pricing <span className="text-blue-600">&</span> Amenities</h2>
                          <p className="text-gray-500 font-medium">Set your rates and showcase features</p>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-6">
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><IndianRupee size={20} className="text-blue-600" /> Rent Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="number" name="rent" value={formData.rent} onChange={handleChange} placeholder="Monthly Rent" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl font-bold" required />
                            <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} placeholder="Security Deposit" className="px-5 py-4 bg-white border border-gray-100 rounded-2xl font-bold" required />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Furnishing Status</label>
                              <div className="grid grid-cols-2 gap-2">
                                {FURNISHING_STATUS.map(status => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, furnishing: status })}
                                    className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${formData.furnishing === status ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
                                  >
                                    {status.replace('-', ' ')}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Electricity Included?</label>
                              <div className="flex bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, electricityBillIncluded: true })}
                                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.electricityBillIncluded ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, electricityBillIncluded: false })}
                                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.electricityBillIncluded ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Available From</label>
                            <input
                              type="date"
                              name="availableFrom"
                              value={formData.availableFrom}
                              onChange={handleChange}
                              className="w-full md:w-fit px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Amenities Section */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Sparkles size={20} className="text-blue-600" /> Available Amenities</h3>
                          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                            {AMENITIES.map((amenity) => (
                              <label key={amenity.value} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.amenities.includes(amenity.value) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100'}`}>
                                <input type="checkbox" checked={formData.amenities.includes(amenity.value)} onChange={() => toggleAmenity(amenity.value)} className="hidden" />
                                <span className="text-xl">{amenity.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-wider">{amenity.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}



                    {currentStep === 5 && (
                      <div className="space-y-10">
                        <div>
                          <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Photos <span className="text-blue-600">&</span> Policies</h2>
                          <p className="text-gray-500 font-medium">Showcase your property and set house rules</p>
                        </div>

                        {/* Photos Section */}
                        <div className="space-y-10">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Image size={20} className="text-blue-600" /> Property Gallery</h3>
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">{images.length} / 5</span>
                            </div>
                            <ImageUploader
                              images={images}
                              onUpload={handleImageUpload}
                              onRemove={handleImageRemove}
                              loading={imagesUploading}
                              maxImages={5}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Electric Bill</h3>
                                <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Required</div>
                              </div>
                              <div className={`group relative p-6 rounded-[2rem] border-2 border-dashed transition-all duration-300 ${electricBill ? 'border-green-500 bg-green-50/20' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400'}`}>
                                <label className="flex flex-col items-center justify-center cursor-pointer min-h-[140px]">
                                  {electricBill ? (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                                        <img src={electricBill.url} className="w-full h-full object-cover" alt="Electric Bill" />
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm font-black text-green-700">Uploaded ✓</p>
                                        <p className="text-[10px] font-bold text-green-600/60 lowercase tracking-wide">Click to replace</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all mx-auto">
                                        {billUploading ? <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={24} />}
                                      </div>
                                      <p className="text-sm font-black text-gray-900 leading-tight">Property Utility Bill</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Latest Electric/Water Bill</p>
                                    </div>
                                  )}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleBillUpload} disabled={billUploading} />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Aadhaar Card</h3>
                                <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Required</div>
                              </div>
                              <div className={`group relative p-6 rounded-[2rem] border-2 border-dashed transition-all duration-300 ${aadhaarCard ? 'border-green-500 bg-green-50/20' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400'}`}>
                                <label className="flex flex-col items-center justify-center cursor-pointer min-h-[140px]">
                                  {aadhaarCard ? (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                                        <img src={aadhaarCard.url} className="w-full h-full object-cover" alt="Aadhaar Card" />
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm font-black text-green-700">Uploaded ✓</p>
                                        <p className="text-[10px] font-bold text-green-600/60 lowercase tracking-wide">Click to replace</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all mx-auto">
                                        {idUploading ? <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={24} />}
                                      </div>
                                      <p className="text-sm font-black text-gray-900 leading-tight">Identity Proof</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Owner's Aadhaar Card</p>
                                    </div>
                                  )}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleIdUpload} disabled={idUploading} />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Policies Section */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><ScrollText size={20} className="text-blue-600" /> House Rules</h3>
                          <textarea name="rules" value={formData.rules.join('\n')} onChange={(e) => setFormData({ ...formData, rules: e.target.value.split('\n') })} rows="8" className="w-full p-6 border border-gray-100 rounded-2xl font-bold resize-none" placeholder="Enter house rules (one per line)..." />
                        </div>
                      </div>
                    )}



                    {currentStep === 7 && (
                      <div className="space-y-10">
                        <div className="text-center mb-10">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-xl">
                            <CheckCircle size={40} />
                          </motion.div>
                          <h2 className="text-4xl font-[1000] text-gray-900 mb-2 tracking-tighter">Review <span className="text-blue-600">Details</span></h2>
                          <p className="text-gray-500 font-medium text-lg">Check your listing one last time.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm group relative">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-black text-gray-900 tracking-tight">Basic Info</h3>
                              <button type="button" onClick={() => setCurrentStep(0)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">{formData.roomType}</div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Category</p>
                              </div>
                              <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Title</p><p className="font-bold text-gray-900 line-clamp-1">{formData.title}</p></div>
                              <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Contact</p><p className="font-bold text-gray-700">{formData.contactNumber}</p></div>
                            </div>
                          </div>

                          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-black text-gray-900 tracking-tight">Location</h3>
                              <button type="button" onClick={() => setCurrentStep(1)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                            </div>
                            <div className="space-y-3">
                              <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Address</p><p className="font-bold text-gray-900 leading-tight">{formData.street}, {formData.city}</p><p className="text-xs text-gray-500 font-medium">{formData.state}, {formData.pincode}</p></div>
                            </div>
                          </div>

                          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-black text-gray-900 tracking-tight">Rent & Details</h3>
                              <button type="button" onClick={() => setCurrentStep(3)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                            </div>
                            <div className="flex items-end justify-between">
                              <div><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Monthly Rent</p><p className="text-2xl font-[1000] text-gray-900">₹{formData.rent}</p></div>
                              <div className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Deposit: ₹{formData.deposit}</div>
                            </div>
                          </div>

                          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-black text-gray-900 tracking-tight">Facilities</h3>
                              <button type="button" onClick={() => setCurrentStep(4)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.amenities.slice(0, 4).map(a => (
                                <div key={a} className="p-2 bg-gray-50 rounded-lg text-sm">{AMENITIES.find(item => item.value === a)?.icon}</div>
                              ))}
                              {formData.amenities.length > 4 && <div className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold">+{formData.amenities.length - 4}</div>}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                          <div className="relative z-10">
                            <h3 className="text-xl font-black text-white mb-2 tracking-tight">Ready to launch?</h3>
                            <p className="text-gray-400 text-sm font-medium">Click below to list your property.</p>
                          </div>
                          <button type="submit" disabled={loading} className="relative z-10 w-full md:w-auto px-12 py-4 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl">
                            {loading ? <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><span>Publish Property</span><Sparkles size={16} /></>}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <button type="button" onClick={prevStep} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-900'}`}><ChevronLeft size={16} /><span>Back</span></button>
                {currentStep < steps.length - 1 && (
                  <button type="button" onClick={nextStep} className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all">
                    <span>Save & Continue</span><ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateRoomPage;