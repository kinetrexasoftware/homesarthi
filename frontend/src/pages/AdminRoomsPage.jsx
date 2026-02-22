import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PendingRooms from '../components/admin/PendingRooms';
import ApprovedRooms from '../components/admin/ApprovedRooms';

const AdminRoomsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'pending';
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'pending', label: 'Pending Approval', component: PendingRooms },
    { id: 'active', label: 'Active Listings', component: ApprovedRooms },
  ];

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['pending', 'active'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', id);
    setSearchParams(newParams);
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PendingRooms;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {activeTab === 'pending' ? 'Room Approvals' : 'Active Listings'}
        </h1>
        <p className="mt-2 text-gray-600">
          {activeTab === 'pending' ? 'Review and vet incoming property listings' : 'Manage live inventory and occupancy'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminRoomsPage;
