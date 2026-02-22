import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, MapPin, Phone, HelpCircle, MessageCircle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full">
        <div className="card p-8 md:p-12">
          {/* 404 Illustration */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <span className="text-4xl font-bold text-white">404</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The page you're looking for doesn't exist or has been moved.
              Let's get you back on track to finding your perfect room!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              to="/"
              className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Home className="mr-3" size={20} />
              Go to Homepage
            </Link>
            <Link
              to="/rooms"
              className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Search className="mr-3" size={20} />
              Browse Rooms
            </Link>
          </div>

          {/* Popular Locations */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Popular Locations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Delhi', path: '/rooms?city=Delhi' },
                { name: 'Mumbai', path: '/rooms?city=Mumbai' },
                { name: 'Bangalore', path: '/rooms?city=Bangalore' },
                { name: 'Chennai', path: '/rooms?city=Chennai' }
              ].map((location) => (
                <Link
                  key={location.name}
                  to={location.path}
                  className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
                >
                  <MapPin className="mr-2 text-blue-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">{location.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Need Help?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="tel:+919876543210"
                className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <Phone className="mr-3 text-gray-600" size={18} />
                <span className="text-gray-700">Call Support</span>
              </a>
              <Link
                to="/help"
                className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <HelpCircle className="mr-3 text-gray-600" size={18} />
                <span className="text-gray-700">Help Center</span>
              </Link>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="mr-2" size={16} />
              Go Back
            </button>
          </div>

          {/* Fun Footer Message */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Lost? Don't worry, even the best explorers get off track sometimes! 🏠✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
