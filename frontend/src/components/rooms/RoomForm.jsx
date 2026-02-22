import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Loader from '../common/Loader';
import ImageUploader from './ImageUploader';
import MapLocationPicker from './MapLocationPicker';
import { MapPin, Navigation, Search, FileText, Upload, Building, Users, Grid, Home } from 'lucide-react';

const RoomForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  submitButtonText = 'Create Room',
  loading: externalLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deposit: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    latitude: '',
    longitude: '',
    roomType: '', // Start empty for mandatory selection
    furnishing: 'semi-furnished',
    availableFrom: new Date().toISOString().split('T')[0],
    preferredGender: 'any',
    amenities: [],
    rules: '',
    contactNumber: '',
    images: [],
    electricBill: null,
    aadhaarCard: null,
    sharingType: 'private',
    availabilityStatus: 'available',
    locationVisibility: 'approximate',
    exactLatitude: '',
    exactLongitude: '',
    electricityBillIncluded: false
  });

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('approximate');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        price: initialData.rent?.amount || initialData.price || '',
        deposit: initialData.rent?.deposit || initialData.deposit || '',
        address: initialData.location?.address?.street || initialData.address || '',
        city: initialData.location?.address?.city || initialData.city || '',
        state: initialData.location?.address?.state || initialData.state || '',
        pincode: initialData.location?.address?.zipCode || initialData.pincode || '',
        landmark: initialData.location?.address?.landmark || initialData.landmark || '',
        latitude: initialData.location?.coordinates?.[1] || initialData.latitude || '',
        longitude: initialData.location?.coordinates?.[0] || initialData.longitude || '',
        exactLatitude: initialData.location?.exactLocation?.coordinates?.[1] || '',
        exactLongitude: initialData.location?.exactLocation?.coordinates?.[0] || '',
        locationVisibility: initialData.location?.locationVisibility || 'approximate',
        roomType: initialData.roomType || 'single',
        furnishing: initialData.furnishing || 'semi-furnished',
        availableFrom: (initialData.availability?.availableFrom || initialData.availableFrom) ?
          new Date(initialData.availability?.availableFrom || initialData.availableFrom).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0],
        preferredGender: initialData.genderPreference || initialData.preferredGender || 'any',
        amenities: initialData.amenities || [],
        rules: Array.isArray(initialData.rules) ? initialData.rules.join('\n') : (initialData.rules || ''),
        contactNumber: initialData.contactNumber || '',
        images: initialData.images || [],
        electricBill: initialData.verification?.electricBill || null,
        aadhaarCard: initialData.verification?.aadhaarCard || null,
        sharingType: initialData.sharingType || 'private',
        availabilityStatus: initialData.availability?.status || 'available',
        electricityBillIncluded: initialData.rent?.electricityBillIncluded || false
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'amenities') {
        setFormData(prev => ({
          ...prev,
          amenities: checked
            ? [...prev.amenities, value]
            : prev.amenities.filter(amenity => amenity !== value)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    const toastId = toast.loading('Fetching your exact location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          // If accuracy is poor (e.g. > 3000m), it's likely a cell-tower location, not GPS
          const isPrecise = accuracy < 2000;

          const { reverseGeocodeAddress } = await import('../../utils/helpers');
          const data = await reverseGeocodeAddress(latitude, longitude);

          const rawAddr = data.raw?.address || {};
          const detectedLandmark = rawAddr.amenity || rawAddr.building || rawAddr.landmark || rawAddr.historic || '';

          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: data.address || prev.address,
            city: data.city || prev.city,
            state: data.state || prev.state,
            pincode: data.pincode || prev.pincode,
            landmark: detectedLandmark || prev.landmark
          }));

          if (!isPrecise) {
            toast.success('Location detected, but precision is low. Please check address!', { id: toastId });
          } else if (!data.isPincodeVerified) {
            toast.success('Location detected! Please verify your PIN code.', { id: toastId });
          } else {
            toast.success('Location detected successfully!', { id: toastId });
          }
        } catch (error) {
          toast.error('Failed to get address details.', { id: toastId });
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        toast.error('Unable to detect location.', { id: toastId });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Slightly longer timeout for better precision
        maximumAge: 0
      }
    );
  };

  const handleFetchCoordinates = async () => {
    const query = [formData.address, formData.city, formData.state].filter(Boolean).join(', ');
    if (!query) {
      toast.error('Enter address or city');
      return;
    }
    setGeoLoading(true);
    const toastId = toast.loading('Finding coordinates...');
    try {
      const { geocodeAddress } = await import('../../utils/helpers');
      const results = await geocodeAddress(query);
      if (results && results.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: results[0].latitude.toString(),
          longitude: results[0].longitude.toString()
        }));
        toast.success('GPS synced!', { id: toastId });
      } else {
        toast.error('Location not found', { id: toastId });
      }
    } catch (error) {
      toast.error('Error finding coordinates', { id: toastId });
    } finally {
      setGeoLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title required';
    if (!formData.description.trim()) newErrors.description = 'Description required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price required';
    if (!formData.address.trim()) newErrors.address = 'Address required';
    if (!formData.city.trim()) newErrors.city = 'City required';
    if (!formData.state.trim()) newErrors.state = 'State required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode required';
    if (!formData.latitude) newErrors.latitude = 'GPS required';
    if (!formData.contactNumber) newErrors.contactNumber = 'Contact required';
    if (!formData.roomType) newErrors.roomType = 'Category selection mandatory';
    if (formData.images.length === 0) newErrors.images = 'At least 1 image required';
    if (!formData.electricBill) newErrors.electricBill = 'Electric bill photo is mandatory';
    if (!formData.aadhaarCard) newErrors.aadhaarCard = 'Aadhaar card photo is mandatory';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      // Obfuscation logic for privacy
      let finalLat = parseFloat(formData.latitude);
      let finalLng = parseFloat(formData.longitude);

      if (formData.locationVisibility === 'approximate') {
        // Add a random offset of roughly 200-400 meters
        // 0.001 degree is approx 111 meters
        const latOffset = (Math.random() * 0.004 - 0.002); // ±200m
        const lngOffset = (Math.random() * 0.004 - 0.002); // ±200m
        finalLat += latOffset;
        finalLng += lngOffset;
      }

      const submissionData = {
        title: formData.title,
        description: formData.description,
        roomType: formData.roomType,
        furnishing: formData.furnishing,
        sharingType: formData.sharingType,
        contactNumber: formData.contactNumber,
        genderPreference: formData.preferredGender,
        amenities: formData.amenities,
        rules: formData.rules.split('\n').map(r => r.trim()).filter(Boolean),
        images: formData.images,
        rent: {
          amount: Number(formData.price),
          deposit: Number(formData.deposit || 0),
          currency: 'INR',
          period: 'month',
          electricityBillIncluded: formData.electricityBillIncluded
        },
        location: {
          type: 'Point',
          coordinates: [finalLng, finalLat],
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.pincode,
            landmark: formData.landmark,
            country: 'India'
          },
          locationVisibility: formData.locationVisibility,
          exactLocation: {
            type: 'Point',
            coordinates: formData.exactLongitude && formData.exactLatitude
              ? [parseFloat(formData.exactLongitude), parseFloat(formData.exactLatitude)]
              : [parseFloat(formData.longitude), parseFloat(formData.latitude)]
          }
        },
        verification: {
          status: initialData.verification?.status || 'pending',
          electricBill: formData.electricBill,
          aadhaarCard: formData.aadhaarCard
        },
        availability: { status: formData.availabilityStatus, availableFrom: formData.availableFrom }
      };
      await onSubmit(submissionData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (formData.images.length + files.length > 5) {
      toast.error('Only 5 images allowed total (1 thumbnail + 4 room images)');
      return;
    }
    try {
      setImageUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post('/upload/image', fd);
        return res.data.data;
      });
      const uploaded = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
      toast.success('Images uploaded');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleElectricBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd);
      setFormData(prev => ({ ...prev, electricBill: res.data.data }));
      toast.success('Electric bill uploaded');
    } catch (e) {
      toast.error('Electric bill upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleAadhaarCardUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd);
      setFormData(prev => ({ ...prev, aadhaarCard: res.data.data }));
      toast.success('Aadhaar card uploaded');
    } catch (e) {
      toast.error('Aadhaar upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleMapLocationSelect = (loc) => {
    if (mapPickerTarget === 'approximate') {
      setFormData(prev => ({ ...prev, latitude: loc.latitude, longitude: loc.longitude, address: loc.address || prev.address }));
    } else {
      setFormData(prev => ({ ...prev, exactLatitude: loc.latitude, exactLongitude: loc.longitude, locationVisibility: 'exact' }));
    }
    setShowMapPicker(false);
  };

  const isLoading = loading || externalLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Basic Info */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          🏠 Basic Property Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Room Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter a catchy title..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Description *</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Describe your room..." />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Monthly Rent (₹) *</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="5000" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Security Deposit (₹)</label>
            <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="10000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Contact Number *</label>
            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="+91 ..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">What are you listing? *</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '1RK', label: '1 RK', icon: Layout },
                { value: '1BHK', label: '1 BHK', icon: Grid },
                { value: '2BHK', label: '2 BHK', icon: Grid },
                { value: '3BHK', label: '3 BHK', icon: Building },
                { value: 'PG', label: 'PG / Co-Living', icon: Building },
                { value: 'Hostel', label: 'Hostel', icon: Users },
                { value: 'Flat', label: 'Flats / Apartment', icon: Grid },
                { value: 'Individual', label: 'Individual Room', icon: Home }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, roomType: type.value })}
                  className={`p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group ${formData.roomType === type.value
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20'
                    : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.roomType === type.value ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                    <type.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                </button>
              ))}
            </div>
            {errors.roomType && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase">{errors.roomType}</p>}
          </div>
        </div>
      </div>

      {/* 2. Room Details */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          🛏️ Room & Lifestyle Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Sharing Type</label>
            <select name="sharingType" value={formData.sharingType} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500">
              <option value="private">Private (1-sharing)</option>
              <option value="shared">Shared (2+ sharing)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Furnishing</label>
            <select name="furnishing" value={formData.furnishing} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500">
              <option value="unfurnished">Unfurnished</option>
              <option value="semi-furnished">Semi Furnished</option>
              <option value="furnished">Furnished</option>
              <option value="fully-furnished">Fully Furnished</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Availability</label>
            <select name="availabilityStatus" value={formData.availabilityStatus} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold">
              <option value="available">Available Now</option>
              <option value="occupied">Available from Date</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Available From</label>
            <input type="date" name="availableFrom" value={formData.availableFrom} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Preference</label>
            <select name="preferredGender" value={formData.preferredGender} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold">
              <option value="any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Electricity Bill</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, electricityBillIncluded: !prev.electricityBillIncluded }))}
              className={`w-full px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${formData.electricityBillIncluded ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'}`}
            >
              {formData.electricityBillIncluded ? 'Included in Rent' : 'Extra Monthly'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. High Accuracy Location! */}
      <div className="bg-white p-8 rounded-[3rem] border-4 border-blue-50 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          <MapPin size={100} className="text-blue-500/5 rotate-12" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-gray-900">📍 Verified Location</h3>
          <p className="text-gray-400 font-bold uppercase tracking-tighter text-xs">High accuracy GPS ensures trust from students</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button type="button" onClick={handleUseCurrentLocation} disabled={geoLoading} className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest hover:scale-[1.02] transform transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50">
            <Navigation size={20} className={geoLoading ? 'animate-ping' : ''} />
            {geoLoading ? 'Detecting Precise Location...' : 'Use My Current GPS'}
          </button>
          <button type="button" onClick={handleFetchCoordinates} disabled={geoLoading} className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50">
            <Search size={20} />
            Sync GPS from Address
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Street Address *</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 transition-all" placeholder="House/Flat No, Apartment, Street..." />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">City *</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 transition-all" placeholder="City" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">State *</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 transition-all" placeholder="State" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Pincode *</label>
            <div className="relative">
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-2xl font-black focus:border-blue-500 transition-all ${formData.pincode && formData.pincode.length !== 6 ? 'border-amber-200' : 'border-transparent'}`} placeholder="6-digit PIN..." />
              {formData.pincode && formData.pincode.length !== 6 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 text-[10px] font-black uppercase">Short</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">📍 Nearby Landmark (Famous Area)</label>
            <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 transition-all" placeholder="e.g. Near Bansal Hospital" />
          </div>

          <div className="md:col-span-2 p-6 bg-blue-50/30 rounded-[2rem] border-2 border-dashed border-blue-100 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <MapPin className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Captured GPS</p>
                  <p className="text-lg font-black text-gray-900 tracking-tight">
                    {formData.latitude ? `${parseFloat(formData.latitude).toFixed(5)}°, ${parseFloat(formData.longitude).toFixed(5)}°` : 'Awaiting Location Capture...'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => { setMapPickerTarget('approximate'); setShowMapPicker(true); }} className="px-6 py-3 bg-white text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 hover:shadow-lg transition-all active:scale-95">Adjust Pin</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Privacy Controls</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, locationVisibility: 'approximate' }))} className={`p-6 rounded-3xl border-4 transition-all text-left group ${formData.locationVisibility === 'approximate' ? 'border-blue-600 bg-blue-50' : 'border-gray-50 bg-gray-50/30 hover:border-gray-100'}`}>
                <p className={`font-black uppercase tracking-widest text-[10px] mb-1 ${formData.locationVisibility === 'approximate' ? 'text-blue-600' : 'text-gray-400'}`}>Broad</p>
                <p className="font-black text-gray-900">Approximate</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Shows only neighborhood to general public.</p>
              </button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, locationVisibility: 'exact' }))} className={`p-6 rounded-3xl border-4 transition-all text-left ${formData.locationVisibility === 'exact' ? 'border-blue-600 bg-blue-50' : 'border-gray-50 bg-gray-50/30 hover:border-gray-100'}`}>
                <p className={`font-black uppercase tracking-widest text-[10px] mb-1 ${formData.locationVisibility === 'exact' ? 'text-blue-600' : 'text-gray-400'}`}>Direct</p>
                <p className="font-black text-gray-900">Exact Spot</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Shows doorstep pin-point to interested students.</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Amenities */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          ✨ Amenities & Extras
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: 'wifi', label: 'WiFi', icon: '📶' },
            { value: 'ac', label: 'AC', icon: '❄️' },
            { value: 'parking', label: 'Parking', icon: '🅿️' },
            { value: 'security', label: 'Security', icon: '🔒' },
            { value: 'food', label: 'Food Inc.', icon: '🍽️' },
            { value: 'laundry', label: 'Laundry', icon: '🧺' },
            { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
            { value: 'furnished', label: 'Furnished', icon: '🛋️' },
            { value: 'water_purifier', label: 'RO Water', icon: '🚰' }
          ].map((item) => (
            <label key={item.value} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.amenities.includes(item.value) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-100'}`}>
              <input type="checkbox" name="amenities" value={item.value} checked={formData.amenities.includes(item.value)} onChange={handleChange} className="hidden" />
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-tight ${formData.amenities.includes(item.value) ? 'text-blue-700' : 'text-gray-500'}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Images & Documents */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-10">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-1">📸 Property Gallery</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max 5 images: 1 Thumbnail + 4 Room Photos</p>
            </div>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
              {formData.images.length} / 5 Images
            </div>
          </div>

          <div className="relative">
            <ImageUploader
              images={formData.images}
              onUpload={handleImageUpload}
              onRemove={removeImage}
              loading={imageUploading}
              maxImages={5}
            />
            {formData.images.length >= 5 && (
              <p className="mt-3 text-amber-600 text-[10px] font-black uppercase flex items-center gap-1">
                ⚠️ Maximum 5 images reached. Remove an image to upload a new one.
              </p>
            )}
          </div>
          {errors.images && <p className="text-red-500 text-xs font-bold mt-2">{errors.images}</p>}
        </div>

        <div className="pt-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-1">📄 Verification Documents</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Both documents are mandatory for verification</p>
            </div>
            <div className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
              Mandatory
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Electric Bill</p>
              <div className={`group relative p-6 rounded-[2.5rem] border-2 border-dashed transition-all duration-300 ${formData.electricBill ? 'border-green-500 bg-green-50/20' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400'}`}>
                <label className="flex flex-col items-center justify-center cursor-pointer min-h-[140px]">
                  {formData.electricBill ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                        <img src={formData.electricBill.url} className="w-full h-full object-cover" alt="Electric Bill" />
                      </div>
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Uploaded ✓</p>
                    </div>
                  ) : (
                    <>
                      <FileText size={32} className="text-gray-300 mb-2" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Upload Bill</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleElectricBillUpload} />
                </label>
              </div>
              {errors.electricBill && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.electricBill}</p>}
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Aadhaar Card</p>
              <div className={`group relative p-6 rounded-[2rem] border-2 border-dashed transition-all duration-300 ${formData.aadhaarCard ? 'border-green-500 bg-green-50/20' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400'}`}>
                <label className="flex flex-col items-center justify-center cursor-pointer min-h-[140px]">
                  {formData.aadhaarCard ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                        <img src={formData.aadhaarCard.url} className="w-full h-full object-cover" alt="Aadhaar Card" />
                      </div>
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Uploaded ✓</p>
                    </div>
                  ) : (
                    <>
                      <FileText size={32} className="text-gray-300 mb-2" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Upload ID Proof</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAadhaarCardUpload} />
                </label>
              </div>
              {errors.aadhaarCard && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.aadhaarCard}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-12 bg-gray-900 p-8 rounded-[3rem]">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-10 py-5 bg-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
            Cancel
          </button>
        )}
        <button type="submit" disabled={isLoading} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all">
          {isLoading ? 'Publishing Room...' : submitButtonText}
        </button>
      </div>

      {showMapPicker && (
        <MapLocationPicker
          onLocationSelect={handleMapLocationSelect}
          onClose={() => setShowMapPicker(false)}
          initialLocation={{
            latitude: mapPickerTarget === 'approximate' ? (parseFloat(formData.latitude) || 28.6139) : (parseFloat(formData.exactLatitude) || parseFloat(formData.latitude) || 28.6139),
            longitude: mapPickerTarget === 'approximate' ? (parseFloat(formData.longitude) || 77.2090) : (parseFloat(formData.exactLongitude) || parseFloat(formData.longitude) || 77.2090),
            address: formData.address
          }}
        />
      )}
    </form>
  );
};

export default RoomForm;
