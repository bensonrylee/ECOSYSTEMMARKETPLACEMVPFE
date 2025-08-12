import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  MoreHorizontal,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalListings: number;
  totalBookings: number;
  totalEarnings: number;
  pendingBookings: number;
}

interface Listing {
  id: string;
  title: string;
  kind: string;
  price_cents: number;
  pricing_unit: string;
  created_at: string;
  active: boolean;
}

interface Booking {
  id: string;
  status: string;
  amount_cents: number;
  start_at: string;
  end_at: string;
  listing: {
    title: string;
  };
  customer: {
    email: string;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    totalBookings: 0,
    totalEarnings: 0,
    pendingBookings: 0
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'bookings'>('overview');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Check if user is a provider
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!provider) {
        setLoading(false);
        return;
      }

      // Load dashboard data
      await Promise.all([
        loadStats(session.user.id),
        loadListings(session.user.id),
        loadRecentBookings(session.user.id)
      ]);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(providerId: string) {
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id, price_cents')
          .eq('provider_id', providerId),
        supabase
          .from('bookings')
          .select('status, amount_cents')
          .eq('provider_id', providerId)
      ]);

      const totalListings = listingsRes.data?.length || 0;
      const bookings = bookingsRes.data || [];
      const totalBookings = bookings.length;
      const totalEarnings = bookings
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.amount_cents, 0);
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;

      setStats({
        totalListings,
        totalBookings,
        totalEarnings,
        pendingBookings
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function loadListings(providerId: string) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, kind, price_cents, pricing_unit, created_at, active')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Error loading listings:', err);
    }
  }

  async function loadRecentBookings(providerId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          amount_cents,
          start_at,
          end_at,
          listings:listing_id (title),
          profiles:customer_id (email)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const bookings = data?.map(booking => ({
        ...booking,
        listing: Array.isArray(booking.listings) ? booking.listings[0] : booking.listings,
        customer: Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles
      })) || [];

      setRecentBookings(bookings);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  }

  function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your provider dashboard.</p>
          <Link 
            to="/onboarding" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your listings and track your earnings</p>
            </div>
            <Link
              to="/listings/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Listing
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Listings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalListings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(stats.totalEarnings)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingBookings}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', icon: TrendingUp },
                { id: 'listings', name: 'My Listings', icon: BarChart3 },
                { id: 'bookings', name: 'Bookings', icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {getStatusIcon(booking.status)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              Booking for {booking.listing?.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(booking.start_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(booking.amount_cents)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {recentBookings.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No recent bookings</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to="/listings/new"
                      className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-900">Create New Listing</p>
                        <p className="text-sm text-blue-700">Add a new service, event, or space</p>
                      </div>
                    </Link>
                    
                    <Link
                      to="/onboarding"
                      className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">Account Settings</p>
                        <p className="text-sm text-green-700">Update payment and profile info</p>
                      </div>
                    </Link>
                    
                    <div className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-purple-900">Analytics</p>
                        <p className="text-sm text-purple-700">View detailed performance metrics</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Your Listings</h3>
                  <Link
                    to="/listings/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{listing.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {listing.kind} • {formatPrice(listing.price_cents)}
                          {listing.pricing_unit === 'hour' ? '/hr' : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/listings/${listing.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {listings.length === 0 && (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No listings yet</p>
                      <Link
                        to="/listings/new"
                        className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Listing
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Bookings</h3>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getStatusIcon(booking.status)}
                          <h4 className="font-medium text-gray-900 ml-2">
                            {booking.listing?.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Customer: {booking.customer?.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(booking.start_at)} - {formatDateTime(booking.end_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 mb-2">
                          {formatPrice(booking.amount_cents)}
                        </p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentBookings.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}