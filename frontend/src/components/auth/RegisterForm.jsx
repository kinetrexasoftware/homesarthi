import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../common/Loader';
import { getStates, getCities } from '../../utils/indianCities';

const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    // When open, if we have a value matching options, show it, otherwise keep search term
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  useEffect(() => {
    // Handle outside click
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative mb-4" ref={wrapperRef}>
      <label className="block text-sm font-bold text-gray-700 mb-1">
        {label} *
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {Icon ? <Icon size={18} className="text-gray-400" /> : <Search size={18} className="text-gray-400" />}
        </div>
        <input
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full pl-10 pr-10 py-3 border ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'
            } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setSearchTerm(option);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm font-medium border-b border-gray-50 last:border-none"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const { handleRegister, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
    college: '',
    address: '',
    state: '',
    city: ''
  });

  const [errors, setErrors] = useState({});
  const [availableCities, setAvailableCities] = useState([]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.state) {
      setAvailableCities(getCities(formData.state));
      // Clear city if it doesn't belong to new state
      if (formData.city) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setAvailableCities([]);
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [formData.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStateChange = (value) => {
    setFormData(prev => ({ ...prev, state: value }));
    if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
  };

  const handleCityChange = (value) => {
    setFormData(prev => ({ ...prev, city: value }));
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';

    if (formData.role === 'student' && !formData.college.trim()) {
      newErrors.college = 'College name is required for students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await handleRegister(registerData);

      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`block w-full px-4 py-3 border ${errors.name ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-xs font-bold text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className={`block w-full px-4 py-3 border ${errors.phone ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="mt-1 text-xs font-bold text-red-500">{errors.phone}</p>}
            </div>

            {/* State & City Drawers */}
            <div className="grid grid-cols-1 gap-4">
              <SearchableSelect
                label="State"
                value={formData.state}
                onChange={handleStateChange}
                options={getStates()}
                placeholder="Select State"
                icon={MapPin}
              />

              <SearchableSelect
                label="City"
                value={formData.city}
                onChange={handleCityChange}
                options={availableCities}
                placeholder={formData.state ? "Select City" : "Select State First"}
                disabled={!formData.state}
                icon={MapPin}
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-bold text-gray-700 mb-1">
                I am a *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              >
                <option value="student">Student</option>
                <option value="owner">Property Owner</option>
              </select>
            </div>

            {/* College (student) */}
            {formData.role === 'student' && (
              <div>
                <label htmlFor="college" className="block text-sm font-bold text-gray-700 mb-1">
                  College Name *
                </label>
                <input
                  id="college"
                  name="college"
                  type="text"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${errors.college ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                  placeholder="Enter your college name"
                />
                {errors.college && <p className="mt-1 text-xs font-bold text-red-500">{errors.college}</p>}
              </div>
            )}

            {/* Address (owner) */}
            {formData.role === 'owner' && (
              <div>
                <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-1">
                  Street Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
                  placeholder="House No, Street, Landmark"
                />
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                  placeholder="••••••"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-1">
                  Confirm *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none`}
                  placeholder="••••••"
                />
              </div>
            </div>
            {(errors.password || errors.confirmPassword) && (
              <p className="text-xs font-bold text-red-500">
                {errors.password || errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader size="small" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 font-bold hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 font-bold hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
