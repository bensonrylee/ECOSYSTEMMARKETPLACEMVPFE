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

interface Listing {
  id: string;
  title: string;
  kind: string;
  price_cents: number;
  pricing_unit: string;
  address_city: string;
  address_region: string;
  primary_photo_url: string | null;
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
  } | null;
  customer: {
    email: string;
  } | null;
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError('Please sign in to access your dashboard');
        return;
      }
      
      setUser(session.user);
      
      // Load provider listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('provider_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (listingsError) throw listingsError;
      setListings(listingsData || []);
      
      // Load recent bookings
      const { data: bookingsData, error: bookingsError } = await supabase
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
        .eq('provider_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (bookingsError) throw bookingsError;
      
      const processedBookings = (bookingsData || []).map(booking => ({
        ...booking,
        listing: Array.isArray(booking.listings) ? booking.listings[0] : booking.listings,
        customer: Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles
      }));
      
      setRecentBookings(processedBookings);
      
      // Calculate stats
      const totalListings = listingsData?.length || 0;
      const activeListings = listingsData?.filter(l => l.active).length || 0;
      const totalBookings = bookingsData?.length || 0;
      const totalRevenue = bookingsData?.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount_cents, 0) || 0;
      const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0;
      
      setStats({
        totalListings,
        activeListings,
        totalBookings,
        totalRevenue,
        pendingBookings
      });
      
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'service': return '🔧';
      case 'event': return '🎉';
      case 'space': return '🏠';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Please sign in to access your provider dashboard'}
          </p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your listings and bookings</p>
          </div>
          <Link
            to="/listings/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeListings}</div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${(stats.totalRevenue / 100).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              {stats.pendingBookings > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {stats.pendingBookings}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Your Listings</h2>
              <Link
                to="/listings/new"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all
              </Link>
            </div>

            {listings.length > 0 ? (
              <div className="space-y-4">
                {listings.slice(0, 5).map((listing) => (
                  <div key={listing.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    {listing.primary_photo_url ? (
                      <img
                        src={listing.primary_photo_url}
                        alt={listing.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{getKindIcon(listing.kind)}</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="capitalize">{listing.kind}</span>
                        <span>${(listing.price_cents / 100).toFixed(2)}{listing.pricing_unit === 'hour' && '/hr'}</span>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {listing.address_city}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-600 mb-6">Create your first listing to start accepting bookings</p>
                <Link
                  to="/listings/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Link>
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
              <Link
                to="/bookings"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all
              </Link>
            </div>

            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {booking.listing?.title || 'Unknown Listing'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{formatDateTime(booking.start_at)}</div>
                        <div>{booking.customer?.email || 'No customer email'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(booking.amount_cents / 100).toFixed(2)}
                      </div>
                      {booking.status === 'paid' && (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-auto mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600">Your bookings will appear here once customers start booking</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}