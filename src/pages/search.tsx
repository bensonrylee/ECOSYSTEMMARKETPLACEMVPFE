import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  price_cents: number;
  currency: string;
  pricing_unit: string;
  address_city: string;
  address_region: string;
  primary_photo_url: string | null;
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    kind: searchParams.get('kind') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  useEffect(() => {
    if (searchTerm || Object.values(filters).some(v => v)) {
      performSearch();
    }
  }, [searchTerm, filters]);

  async function performSearch() {
    setLoading(true);
    try {
      let query = supabase
        .from('public_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filters.kind) {
        query = query.eq('kind', filters.kind);
      }

      if (filters.city) {
        query = query.ilike('address_city', `%${filters.city}%`);
      }

      if (filters.minPrice) {
        query = query.gte('price_cents', parseInt(filters.minPrice) * 100);
      }

      if (filters.maxPrice) {
        query = query.lte('price_cents', parseInt(filters.maxPrice) * 100);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
    performSearch();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (filters.kind) params.set('kind', filters.kind);
    if (filters.city) params.set('city', filters.city);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({ kind: '', city: '', minPrice: '', maxPrice: '' });
    setSearchParams(new URLSearchParams());
    setListings([]);
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'service': return '🔧';
      case 'event': return '🎉';
      case 'space': return '🏠';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Results</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services, events, or spaces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={filters.kind}
                  onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="service">Services</option>
                  <option value="event">Events</option>
                  <option value="space">Spaces</option>
                </select>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                
                {(searchTerm || Object.values(filters).some(v => v)) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Found {listings.length} {listings.length === 1 ? 'result' : 'results'}
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listings/${listing.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    {listing.primary_photo_url ? (
                      <img
                        src={listing.primary_photo_url}
                        alt={listing.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl">{getKindIcon(listing.kind)}</span>
                      </div>
                    )}
                    
                    {/* Kind Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white bg-opacity-90 text-gray-800 rounded-full text-xs font-medium capitalize">
                      {listing.kind}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {listing.title}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{listing.address_city}, {listing.address_region}</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm text-gray-600">4.8</span>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          ${(listing.price_cents / 100).toFixed(2)}
                        </div>
                        {listing.pricing_unit === 'hour' && (
                          <div className="text-sm text-gray-600">/hour</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : searchTerm || Object.values(filters).some(v => v) ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={clearSearch}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600 mb-6">
              Enter keywords above to find services, events, and spaces
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse All Listings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}