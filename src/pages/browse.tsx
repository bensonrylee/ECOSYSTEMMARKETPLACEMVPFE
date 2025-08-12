import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Filter, X, Search, Star, DollarSign } from 'lucide-react';
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

export default function Browse() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    kind: '',
    city: '',
    minPrice: '',
    maxPrice: ''
  });


  useEffect(() => {
    loadListings();
  }, [filters, searchTerm]);

  async function loadListings() {
    try {
      setLoading(true);
      // Always use public view for browsing
      let query = supabase
        .from('public_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

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
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Error loading listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  const clearFilters = () => {
    setFilters({
      kind: '',
      city: '',
      minPrice: '',
      maxPrice: ''
    });
    setSearchTerm('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length + (searchTerm ? 1 : 0);

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'service': return '🔧';
      case 'event': return '🎉';
      case 'space': return '🏠';
      default: return '📋';
    }
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'space': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="h-16 bg-gray-200 rounded mb-8"></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Browse Listings</h1>
              <p className="text-gray-600 mt-1">
                {listings.length} {listings.length === 1 ? 'listing' : 'listings'} available
              </p>
            </div>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
                  <div className="space-y-2">
                    {[
                      { value: '', label: 'All Types' },
                      { value: 'service', label: 'Services' },
                      { value: 'event', label: 'Events' },
                      { value: 'space', label: 'Spaces' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="kind"
                          value={option.value}
                          checked={filters.kind === option.value}
                          onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City or region"
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="flex-1">
            {listings.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listings/${listing.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300"
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
                      
                      {/* Type Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium capitalize ${getKindColor(listing.kind)}`}>
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
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all listings
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Load More Button - for future pagination */}
            {listings.length >= 50 && (
              <div className="text-center mt-12">
                <button className="inline-flex items-center px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Load More Listings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}