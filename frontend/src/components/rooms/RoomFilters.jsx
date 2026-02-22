import { X, Filter } from 'lucide-react';
import { getAmenityIcon } from '../../utils/helpers';

const RoomFilters = ({ filters, onFilterChange, onReset, onClose }) => {
  const amenitiesList = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'ac', label: 'AC' },
    { value: 'food', label: 'Food' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'parking', label: 'Parking' },
    { value: 'gym', label: 'Gym' },
    { value: 'security', label: 'Security' }
  ];

  const toggleAmenity = (amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    onFilterChange('amenities', newAmenities);
  };

  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={24} className="text-blue-600" />
          <h3 className="text-xl font-bold">Filters</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Min Rent (₹)</label>
          <input
            type="number"
            value={filters.minRent}
            onChange={(e) => onFilterChange('minRent', e.target.value)}
            className="input-field"
            placeholder="2000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Max Rent (₹)</label>
          <input
            type="number"
            value={filters.maxRent}
            onChange={(e) => onFilterChange('maxRent', e.target.value)}
            className="input-field"
            placeholder="10000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Room Type</label>
          <select
            value={filters.roomType}
            onChange={(e) => onFilterChange('roomType', e.target.value)}
            className="input-field"
          >
            <option value="">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="shared">Shared</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Gender Preference</label>
          <select
            value={filters.genderPreference}
            onChange={(e) => onFilterChange('genderPreference', e.target.value)}
            className="input-field"
          >
            <option value="">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-3">Amenities</label>
        <div className="flex flex-wrap gap-3">
          {amenitiesList.map((amenity) => (
            <button
              key={amenity.value}
              onClick={() => toggleAmenity(amenity.value)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                filters.amenities.includes(amenity.value)
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {getAmenityIcon(amenity.value)} {amenity.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button onClick={onReset} className="btn-secondary">
          Reset Filters
        </button>
        <button onClick={onClose} className="btn-primary">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default RoomFilters;
