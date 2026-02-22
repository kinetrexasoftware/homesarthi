import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Users, AlertCircle, FileCheck, XCircle, Search, Calendar, MapPin, Phone, Mail, Building, CheckCircle, Filter, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';

const OwnerVerification = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'no-listings', 'with-listings'
    const [stats, setStats] = useState({
        total: 0,
        verified: 0,
        pending: 0,
        noListings: 0,
        withListings: 0
    });

    useEffect(() => {
        fetchOwners();
    }, []);

    const fetchOwners = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/users?role=owner');

            if (data.success) {
                const ownersData = data.data.users || [];

                // Calculate stats
                const totalOwners = ownersData.length;
                const verified = ownersData.filter(o => o.verified).length;
                const pending = ownersData.filter(o => !o.verified).length;
                const noListings = ownersData.filter(o => !o.listingCount || o.listingCount === 0).length;
                const withListings = ownersData.filter(o => o.listingCount && o.listingCount > 0).length;

                setStats({
                    total: totalOwners,
                    verified,
                    pending,
                    noListings,
                    withListings
                });

                setOwners(ownersData);
            }
        } catch (error) {
            console.error('Failed to fetch owners:', error);
            toast.error('Failed to load owners data');
        } finally {
            setLoading(false);
        }
    };

    // Filter owners
    const filteredOwners = owners.filter(owner => {
        const matchesSearch =
            owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' ? true :
                filterStatus === 'no-listings' ? (!owner.listingCount || owner.listingCount === 0) :
                    filterStatus === 'with-listings' ? (owner.listingCount && owner.listingCount > 0) :
                        true;

        return matchesSearch && matchesFilter;
    });

    // Export owners without listings to Excel
    const exportToExcel = () => {
        const ownersWithoutListings = owners.filter(o => !o.listingCount || o.listingCount === 0);

        if (ownersWithoutListings.length === 0) {
            toast.error('No owners without listings to export');
            return;
        }

        // Prepare data for Excel
        const excelData = ownersWithoutListings.map(owner => ({
            'Owner ID': owner.customId || owner._id,
            'Name': owner.name,
            'Email': owner.email,
            'Phone': owner.phoneNumber || 'N/A',
            'City': owner.city || 'N/A',
            'State': owner.state || 'N/A',
            'Verified': owner.verified ? 'Yes' : 'No',
            'Email Verified': owner.emailVerified ? 'Yes' : 'No',
            'Mobile Verified': owner.mobileVerified ? 'Yes' : 'No',
            'Joined Date': new Date(owner.createdAt).toLocaleDateString('en-IN'),
            'Listings Count': owner.listingCount || 0,
            'Status': owner.accountStatus || 'Active'
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Owners Without Listings');

        // Auto-size columns
        const maxWidth = excelData.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => String(v).length)), 10);
        worksheet['!cols'] = Array(Object.keys(excelData[0] || {}).length).fill({ wch: maxWidth });

        // Download file
        const fileName = `owners_without_listings_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toast.success(`Exported ${ownersWithoutListings.length} owners to Excel`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <RefreshCw className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading owners data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Owner Verification</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage and verify property owners</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 font-bold"
                >
                    <Download size={18} />
                    Export Owners Without Listings
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                    <Users className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-3xl font-black">{stats.total}</p>
                    <p className="text-sm font-medium opacity-90">Total Owners</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
                    <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-3xl font-black">{stats.verified}</p>
                    <p className="text-sm font-medium opacity-90">Verified</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-3xl font-black">{stats.pending}</p>
                    <p className="text-sm font-medium opacity-90">Pending</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg">
                    <XCircle className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-3xl font-black">{stats.noListings}</p>
                    <p className="text-sm font-medium opacity-90">No Listings</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                    <Building className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-3xl font-black">{stats.withListings}</p>
                    <p className="text-sm font-medium opacity-90">With Listings</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${filterStatus === 'all'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilterStatus('no-listings')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${filterStatus === 'no-listings'
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            No Listings ({stats.noListings})
                        </button>
                        <button
                            onClick={() => setFilterStatus('with-listings')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${filterStatus === 'with-listings'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            With Listings ({stats.withListings})
                        </button>
                    </div>
                </div>
            </div>

            {/* Owners Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">Owner Details</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">Verification</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">Listings</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOwners.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users className="w-16 h-16 text-gray-300 mb-4" />
                                            <p className="text-gray-600 font-medium">No owners found</p>
                                            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOwners.map((owner) => (
                                    <tr key={owner._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {owner.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{owner.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {owner.customId || owner._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <span className="text-gray-700">{owner.email}</span>
                                                </div>
                                                {owner.phoneNumber && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span className="text-gray-700">{owner.phoneNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-700">
                                                    {owner.location?.city || owner.city || 'N/A'}{owner.location?.state || owner.state ? `, ${owner.location?.state || owner.state}` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${owner.verified
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {owner.verified ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                    {owner.verified ? 'Verified' : 'Pending'}
                                                </span>
                                                <div className="flex gap-1">
                                                    {owner.emailVerified && (
                                                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Email ✓</span>
                                                    )}
                                                    {owner.mobileVerified && (
                                                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">Mobile ✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-sm ${!owner.listingCount || owner.listingCount === 0
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                <Building size={14} />
                                                {owner.listingCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} className="text-gray-400" />
                                                {formatDate(owner.createdAt)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <FileCheck className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 mb-2">Export Summary</h3>
                        <p className="text-sm text-blue-700">
                            {filteredOwners.length} owners currently displayed • {stats.noListings} owners without any listings •{' '}
                            {stats.verified} verified owners • {stats.pending} pending verification
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerVerification;
