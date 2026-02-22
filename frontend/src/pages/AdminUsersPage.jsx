import { useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import OwnerVerification from '../components/admin/OwnerVerification';

const AdminUsersPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all flex-1 ${activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          <Users size={18} />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('owners')}
          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all flex-1 ${activeTab === 'owners'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          <ShieldCheck size={18} />
          Owner Verification
        </button>
      </div>

      {/* Tab Content */}
      <div className="fade-in">
        {activeTab === 'users' ? <UserManagement /> : <OwnerVerification />}
      </div>
    </div>
  );
};

export default AdminUsersPage;
