import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Calendar, MessageCircle,
  Heart, Share2, AlertTriangle, Star, CheckCircle,
  Navigation, Info, ShieldCheck, ChevronLeft,
  ArrowRight, ShieldAlert, Zap, Users, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { formatCurrency, formatDate, getAmenityIcon, buildGoogleMapsLink, formatRoomAddress, fetchNearbyLandmarks, formatDistance } from '../utils/helpers';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import RoomMapView from '../components/rooms/RoomMapView';
import RoutePreview from '../components/rooms/RoutePreview';
import { Bus, School, Activity, Building2, Train, Map as MapIconIcon } from 'lucide-react';

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [identityProof, setIdentityProof] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [landmarksLoading, setLandmarksLoading] = useState(false);
  const [reviewCriteria, setReviewCriteria] = useState({
    cleanliness: 5,
    communication: 5,
    accuracy: 5,
    location: 5,
    value: 5
  });

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchRoomDetails();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    if (room?.location?.coordinates) {
      loadLandmarks();
    }
  }, [room]);

  const loadLandmarks = async () => {
    try {
      setLandmarksLoading(true);
      const data = await fetchNearbyLandmarks(room.location.coordinates[1], room.location.coordinates[0]);
      setLandmarks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLandmarksLoading(false);
    }
  };

  useEffect(() => {
    if (user && reviews.length > 0) {
      const userReview = reviews.find(r => (r.student?._id || r.student) === (user._id || user));
      setHasReviewed(!!userReview);
    }
  }, [user, reviews]);

  const fetchRoomDetails = async () => {
    try {
      const { data } = await api.get(`/rooms/${id}`);
      setRoom(data.data.room);
    } catch (error) {
      toast.error('Failed to load room details');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/room/${id}`);
      setReviews(data.data?.reviews || []);
    } catch (error) {
      setReviews([]);
    }
  };

  const shareListing = () => {
    if (navigator.share) {
      navigator.share({
        title: room.title,
        text: `Check out this room at HomeSarthi: ${room.title}`,
        url: window.location.href,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Listing URL copied to clipboard');
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      toast.error('Please login to contact owner');
      navigate('/login');
      return;
    }
    navigate('/chat', {
      state: { recipientId: room.owner._id, roomId: room._id, recipientInfo: room.owner }
    });
  };

  const handleScheduleVisit = async () => {
    if (!isAuthenticated || user?.role !== 'student') {
      toast.error('Only logged-in students can schedule visits');
      return;
    }
    if (!visitDate || !visitTime) {
      toast.error('Please select date and time');
      return;
    }
    if (!identityProof) {
      toast.error('Please upload your ID proof (Aadhar/College ID)');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('roomId', room._id);
      formData.append('ownerId', room.owner._id);
      formData.append('requestedDate', visitDate);
      formData.append('requestedTime', visitTime);
      formData.append('notes', visitNotes);
      formData.append('identityProof', identityProof);

      await api.post('/visits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Visit request sent! The owner will contact you.');
      setShowVisitModal(false);
      setVisitDate('');
      setVisitTime('');
      setVisitNotes('');
      setIdentityProof(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportListing = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to report a listing');
      return;
    }
    if (!reportReason || !reportDescription) {
      toast.error('Please provide a reason and description');
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await api.post(`/rooms/${room._id}/report`, {
        reason: reportReason,
        description: reportDescription
      });
      toast.success(data.message);
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    try {
      setReviewSubmitting(true);
      await api.post('/reviews', {
        roomId: room._id,
        rating: reviewRating,
        criteria: reviewCriteria,
        comment: reviewComment
      });
      toast.success('Review Shared!');
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment('');
      fetchReviews();
      fetchRoomDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Property Details...</p>
    </div>
  );

  if (!room) return null;

  const hasExact = room.location?.locationVisibility === 'exact' && room.location?.exactLocation?.coordinates?.length === 2;
  const displayLoc = hasExact
    ? {
      lat: room.location.exactLocation.coordinates[1],
      lng: room.location.exactLocation.coordinates[0]
    }
    : {
      lat: room.location.coordinates[1],
      lng: room.location.coordinates[0]
    };

  return (
    <div className="bg-[#FCFCFD] min-h-screen">

      {/* Dynamic Header */}
      <header className="bg-white border-b border-gray-100 sticky top-[80px] z-20 md:block hidden">
        {room.verification?.status !== 'approved' && (
          <div className="bg-amber-50 border-b border-amber-100 py-3">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
              <Zap size={16} className="text-amber-600 animate-pulse" />
              <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                This listing is <span className="underline decoration-amber-400 decoration-2 italic">{room.verification?.status}</span>. Only you can see it until an admin authorizes it.
              </p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-black text-gray-900 truncate max-w-xs">{room.title}</h2>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${room.verification?.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                {room.verification?.status === 'approved' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                <span className="text-[10px] font-black uppercase tracking-tight">
                  {room.verification?.status === 'approved' ? 'Verified' : 'Pending Approval'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={shareListing} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <Share2 size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart size={20} />
            </button>
            <div className="h-8 w-[1px] bg-gray-100 mx-2" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-gray-900">{formatCurrency(room.rent)}</span>
              <span className="text-xs font-bold text-gray-400">/mo</span>
            </div>
            <button onClick={handleContact} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
              Book Now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* CONTENT COLUMN */}
          <div className="lg:col-span-8 space-y-12">

            {/* Gallery Section */}
            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-[250px] xs:h-[300px] md:h-[500px] bg-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-gray-200"
              >
                <img src={room.images[selectedImage]?.url} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 md:top-6 md:left-6 flex flex-wrap gap-1.5 md:gap-2">
                  <div className="px-3 py-1 bg-white/90 backdrop-blur-md text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {room.roomType}
                  </div>
                  <div className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {room.availability?.status === 'available' ? 'Available Now' :
                      room.availability?.status === 'occupied' ? 'Opening Soon' : 'Maintenance'}
                  </div>
                </div>

                <button className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/90 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 hover:bg-white transition-all shadow-xl group/btn">
                  <Camera size={16} className="text-blue-600 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Photos ({room.images.length})</span>
                </button>
              </motion.div>

              <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2">
                {room.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 md:w-32 h-16 md:h-24 rounded-xl md:rounded-2xl overflow-hidden transition-all shrink-0 ${selectedImage === i ? 'ring-2 md:ring-4 ring-blue-600 scale-95 shadow-lg' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </section>

            {/* Core Info */}
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 pb-6 md:mb-8 md:pb-8 border-b border-gray-100">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                      <Zap size={10} className="fill-blue-400 text-blue-400" /> Instant Book
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                      <Users size={10} /> {room.sharingType}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-5xl font-black text-gray-900 leading-tight break-words">{room.title}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin size={16} className="text-blue-600 shrink-0" />
                      <span className="text-sm font-bold break-words">{formatRoomAddress(room.location?.address)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Star size={16} className="text-amber-500 fill-amber-400" />
                      <span className="text-sm font-black text-gray-900">{room.rating?.average || 0}</span>
                      <span className="text-xs font-bold text-gray-400">({reviews.length} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Rent</p>
                  <p className="text-lg md:text-xl font-black text-gray-900">{formatCurrency(room.rent)}</p>
                  {room.rent?.electricityBillIncluded && (
                    <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">Electricity Inc.</span>
                  )}
                </div>
                <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Deposit</p>
                  <p className="text-lg md:text-xl font-black text-gray-900">{formatCurrency(room.rent?.deposit ?? ((room.rent?.amount || 0) * 2))}</p>
                </div>
                <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Furnishing</p>
                  <p className="text-lg md:text-xl font-black text-gray-900 capitalize truncate">{room.furnishing?.replace('-', ' ')}</p>
                </div>
                <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-lg md:text-xl font-black text-gray-900 capitalize truncate">{room.genderPreference}</p>
                </div>
                <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm md:text-base font-black ${room.availability?.status === 'available' ? 'text-green-600' : 'text-amber-600'}`}>
                    {room.availability?.status === 'available' ? 'Available' : 'Booked'}
                  </p>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="p-6 md:p-12 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 md:space-y-6">
              <h3 className="text-xl md:text-2xl font-black text-gray-900">About this Property</h3>
              <p className="text-gray-600 font-medium leading-relaxed md:leading-loose text-base md:text-lg whitespace-pre-line break-words">
                {room.description}
              </p>
              <div className="pt-4 md:pt-6 border-t border-gray-50 flex flex-wrap gap-2 md:gap-4">
                {room.rules?.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-50 text-red-600 rounded-xl text-[10px] md:text-xs font-bold">
                    <ShieldAlert size={12} className="shrink-0" /> {rule}
                  </div>
                ))}
              </div>
            </section>

            {/* Amenities Grid */}
            <section className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900">What this place offers</h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {room.amenities?.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-100 transition-colors group">
                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-blue-50 text-gray-600 group-hover:text-blue-600 rounded-2xl flex items-center justify-center text-2xl transition-all">
                      {getAmenityIcon(amenity)}
                    </div>
                    <span className="text-sm font-black text-gray-700 uppercase tracking-widest capitalize">{amenity.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Location Section */}
            <section className="space-y-6 md:space-y-8 bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="min-w-0">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <MapIcon className="text-blue-600 shrink-0" size={24} /> Location Details
                  </h3>
                  <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[9px] md:text-[10px] break-words line-clamp-2 md:line-clamp-none">
                    {formatRoomAddress(room.location?.address)}
                  </p>
                </div>
                <button onClick={() => window.open(buildGoogleMapsLink(displayLoc.lat, displayLoc.lng), '_blank')} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-900 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all w-full md:w-auto">
                  <Navigation size={16} /> Open in Maps
                </button>
              </div>

              <div className="h-[300px] md:h-[400px] rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 relative group">
                <RoomMapView room={room} height="100%" />
              </div>

              {/* Landmark discovery row */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Nearby Landmarks</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {landmarksLoading ? (
                    [1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-2 bg-gray-200 rounded w-1/3" />
                        </div>
                      </div>
                    ))
                  ) : landmarks.length > 0 ? (
                    landmarks.map((landmark, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-gray-50 rounded-2xl hover:border-blue-100 transition-all group">
                        <div className="w-10 h-10 bg-gray-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                          {landmark.type?.includes('university') || landmark.type?.includes('college') ? <School size={18} /> :
                            landmark.type?.includes('hospital') || landmark.type?.includes('clinic') ? <Activity size={18} /> :
                              landmark.type?.includes('bus') ? <Bus size={18} /> : <Train size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 truncate uppercase tracking-widest">{landmark.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {formatDistance(landmark.distance)} away
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 bg-gray-50 rounded-3xl text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No major landmarks tracked in this exact radius</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl flex items-start gap-4">
                <Info className="text-blue-600 shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Safety First</p>
                  <p className="text-sm font-bold text-blue-700 leading-relaxed">
                    We display the approximate location until your visit is approved. The exact door number will be shared via direct message.
                  </p>
                </div>
              </div>

              {/* Exact Location - Visible when owner shares exact location publicly */}
              {room.location?.locationVisibility === 'exact' && room.location?.exactLocation && (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-200 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <MapIconIcon className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-900 uppercase tracking-widest">Exact Doorstep Location Shared</p>
                      <p className="text-[10px] font-bold text-blue-600 mt-0.5">Owner has enabled public exact location</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-xs font-mono font-bold text-blue-900 mb-3">
                      📍 {room.location.exactLocation.coordinates?.[1]?.toFixed(6)}°, {room.location.exactLocation.coordinates?.[0]?.toFixed(6)}°
                    </p>
                    <button
                      onClick={() => window.open(
                        `https://www.google.com/maps?q=${room.location.exactLocation.coordinates[1]},${room.location.exactLocation.coordinates[0]}`,
                        '_blank'
                      )}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Navigation size={18} />
                      Open Exact Location in Maps
                    </button>
                  </div>
                  <p className="text-[10px] text-blue-700 font-bold text-center">
                    ✓ This property's exact doorstep location is available to all users
                  </p>
                </div>
              )}

              {/* Security Details Section */}
              <div id="security-details" className="pt-8 mt-8 border-t border-gray-100">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-green-600" /> Security & Trust
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-900 uppercase">Data Privacy</p>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Your contact details are only shared with the owner after a visit is confirmed.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-900 uppercase">Deposit Safety</p>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Payments made through the platform are held in escrow until move-in.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-900 uppercase">Scam Protection</p>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">AI-driven listing verification ensures all properties are real and active.</p>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gray-900 rounded-2xl flex items-center justify-between">
                  <p className="text-[10px] text-white font-black uppercase tracking-widest">Learn more about our Safety Protocol</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowReportModal(true)} className="text-[10px] text-red-400 hover:text-red-300 font-black uppercase tracking-widest border-b border-red-900/50 pb-0.5">Report Listing</button>
                    <ArrowRight size={16} className="text-blue-400" />
                  </div>
                </div>
              </div>
            </section>

            {/* Why Book This - Repositioned for stability */}
            <section className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[1.5rem] md:rounded-[2.5rem] p-7 md:p-10 text-white relative overflow-hidden group shadow-2xl">
              <div className="relative z-10 grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div>
                  <h4 className="text-2xl md:text-3xl font-black mb-4 md:mb-6">Why book this property?</h4>
                  <ul className="space-y-4 md:space-y-6">
                    <li className="flex items-center gap-4">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
                        <ShieldCheck size={18} className="md:size-20" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-black uppercase tracking-widest">Verified Owner</p>
                        <p className="text-[9px] md:text-[10px] text-blue-200 font-bold uppercase tracking-widest">Identity & Property Confirmed</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/10 flex items-center justify-center text-green-300">
                        <Zap size={18} className="md:size-20" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-black uppercase tracking-widest">Instant Approval</p>
                        <p className="text-[9px] md:text-[10px] text-green-200 font-bold uppercase tracking-widest">Responses within 2 hours</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-4 md:p-6 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/10">
                    <p className="text-[9px] md:text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Support</p>
                    <p className="text-base md:text-lg font-black italic">24/7 Care</p>
                  </div>
                  <div className="p-4 md:p-6 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/10">
                    <p className="text-[9px] md:text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Safety</p>
                    <p className="text-base md:text-lg font-black italic">Protected</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            </section>

            {/* Reviews Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Student Reviews</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black text-amber-900">{room.rating?.average?.toFixed(1) || 0}</span>
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{reviews.length} Verified Reviews</p>
                  </div>
                </div>
                {isAuthenticated && (
                  <button onClick={() => {
                    if (hasReviewed) {
                      const myReview = reviews.find(r => (r.student?._id || r.student) === (user._id || user));
                      if (myReview) {
                        setReviewRating(myReview.rating);
                        setReviewComment(myReview.comment);
                        if (myReview.criteria) setReviewCriteria(myReview.criteria);
                      }
                    }
                    setShowReviewModal(true);
                  }} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">
                    {hasReviewed ? <><Camera size={18} /> Edit My Review</> : <><CheckCircle size={18} /> Write Review</>}
                  </button>
                )}
              </div>

              {/* Criteria Bars (Flipkart style) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 md:p-8 bg-gray-50 rounded-[1.5rem] md:rounded-[2.5rem]">
                {['Cleanliness', 'Accuracy', 'Communication', 'Location', 'Value'].map(c => (
                  <div key={c} className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c}</p>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(room.rating?.average || 4.5) * 20}%` }}
                        className="h-full bg-blue-600"
                      />
                    </div>
                    <p className="text-[10px] font-black text-gray-900">{room.rating?.average?.toFixed(1) || '4.5'}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6">
                {reviews.length > 0 ? reviews.map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 md:p-8 bg-white border border-gray-100 rounded-2xl md:rounded-[2rem] shadow-sm relative group hover:border-blue-100 transition-all"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
                          {review.student?.name?.[0]}
                        </div>
                        <div>
                          <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">{review.student?.name}</h5>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={12} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                            ))}
                            <span className="text-[10px] font-bold text-gray-400 ml-2">• {formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg">
                        <ShieldCheck size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tight">Verified Stay</span>
                      </div>
                    </div>
                    <p className="text-gray-600 font-medium leading-relaxed italic">"{review.comment}"</p>
                  </motion.div>
                )) : (
                  <div className="py-12 md:py-20 text-center bg-gray-50 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <MessageCircle className="mx-auto mb-4 text-gray-300" size={40} />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No reviews yet. Be the first!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR COLUMN */}
          <aside className="lg:col-span-4 lg:sticky lg:top-36 h-fit space-y-8">

            {/* Action Card */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-2xl shadow-gray-200/50 sticky top-32">
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-black text-gray-900">{formatCurrency(room.rent)}</span>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">/ MONTH</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 cursor-pointer transition-all group">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">CHECK-IN</p>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                      {room.availability?.status === 'available' ? 'Immediate' :
                        room.availability?.availableFrom ? new Date(room.availability.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) :
                          'Flexible'}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">OCCUPANCY</p>
                  <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{room.roomType} Shared Room</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleContact}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <MessageCircle size={18} className="group-hover:scale-110 transition-transform" /> Chat with Owner
                </button>
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-gray-900/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <Calendar size={18} className="group-hover:scale-110 transition-transform" /> Schedule a Visit
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-widest leading-relaxed">
                Trusted by 2,000+ students across India.<br />Safe & Secure Payments.
              </p>

              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden shadow-md shrink-0">
                  <img src={room.owner?.avatar?.url || `https://ui-avatars.com/api/?name=${room.owner?.name}`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs md:text-sm font-black text-gray-900 truncate uppercase tracking-widest">Hosted by {room.owner?.name}</h5>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={10} className="text-green-500" /> Identity Verified
                  </p>
                </div>
              </div>
            </div>

            {/* Safety Badges Container - Compacted for sidebar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-2">
                <ShieldCheck className="text-blue-600" size={24} />
                <span className="text-[10px] font-black text-blue-900 uppercase">Verified</span>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center text-center gap-2">
                <Zap className="text-green-600" size={24} />
                <span className="text-[10px] font-black text-green-900 uppercase">Instant</span>
              </div>
            </div>

            {/* Listing Support Section */}
            <div className="pt-8 mt-8 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Listing Support</h4>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 hover:border-red-200 group"
              >
                <AlertTriangle size={14} className="group-hover:animate-pulse" /> Report Listing Details
              </button>
              <p className="text-[9px] text-gray-400 font-bold mt-3 text-center uppercase tracking-tight">
                Reported listings are reviewed within 24 hours.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* FOOTER CTA MOBILE */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 md:hidden z-30">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency(room.rent)}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Rent</p>
          </div>
          <button onClick={handleContact} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">
            Message Owner
          </button>
        </div>
      </footer>

      {/* --- Modals Section (Maintained Logic) --- */}
      {/* ... keeping the original modal JSX structure for Visit, Report, Review but with polished styling ... */}

      {/* Visit Modal */}
      <AnimatePresence>
        {showVisitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVisitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 overflow-hidden shadow-2xl"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">Schedule a Visit</h3>
              <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-[10px]">Pick a time that works for you</p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time</label>
                    <input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message to Owner</label>
                  <textarea rows={4} value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="Anything you'd like to ask before visiting?" className="w-full px-5 py-5 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm resize-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Proof (Mandatory)</label>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 hover:border-blue-500 transition-colors text-center cursor-pointer relative">
                    <input
                      type="file"
                      onChange={(e) => setIdentityProof(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,.pdf"
                    />
                    {identityProof ? (
                      <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                        <CheckCircle size={18} />
                        <span className="truncate max-w-[200px]">{identityProof.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-400 font-bold text-sm">
                        <span className="text-blue-600">Click to upload</span> Aadhar Card / College ID
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={() => setShowVisitModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={handleScheduleVisit} disabled={submitting} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all">
                  {submitting ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReviewModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[2.5rem] w-full max-w-xl p-10 overflow-hidden shadow-2xl">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Write a Review</h3>
              <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-[10px]">Help other students by sharing your experience</p>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Overall Experience</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setReviewRating(s)} className="p-1">
                        <Star size={32} className={`transition-all ${s <= reviewRating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-gray-200 hover:text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criteria Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(reviewCriteria).map(key => (
                    <div key={key} className="space-y-3 p-4 bg-gray-50 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key}</label>
                        <span className="text-xs font-black text-blue-600">{reviewCriteria[key]}.0</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={() => setReviewCriteria(prev => ({ ...prev, [key]: s }))}
                            className={`flex-1 h-3 rounded-full transition-all ${s <= reviewCriteria[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Detailed Feedback</label>
                  <textarea rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="What was good? Any issues?" className="w-full px-5 py-5 bg-gray-50 rounded-[2rem] border-none outline-none font-bold text-sm resize-none" />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 overflow-hidden shadow-2xl">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Report Listing</h3>
              <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-[10px]">What's the issue with this listing?</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason</label>
                  <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none font-black text-xs uppercase tracking-widest cursor-pointer highlight-none">
                    <option value="">Select a reason</option>
                    <option value="misleading_location">Misleading Location</option>
                    <option value="privacy_violation">Privacy/Security Violation</option>
                    <option value="unsafe_area">Unsafe Environment</option>
                    <option value="scam_fraud">Scam or Fraudulent Owner</option>
                    <option value="inappropriate_behavior">Inappropriate Behavior</option>
                    <option value="incorrect_info">Incorrect Amenities/Photos</option>
                    <option value="other">Other Issues</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <span className={`text-[9px] font-black uppercase ${reportDescription.length < 20 ? 'text-red-400' : 'text-green-500'}`}>
                      {reportDescription.length}/1000 (Min 20)
                    </span>
                  </div>
                  <textarea rows={4} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Please provide specific details to help our investigation..." className="w-full px-5 py-5 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm resize-none" />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={() => setShowReportModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Close</button>
                <button
                  onClick={handleReportListing}
                  disabled={submitting || reportDescription.length < 20}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Simple Map icon if Map is not available
const MapIcon = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 15 22 23 18 23 2 15 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="15" y1="6" x2="15" y2="22"></line>
  </svg>
);

export default RoomDetailPage;