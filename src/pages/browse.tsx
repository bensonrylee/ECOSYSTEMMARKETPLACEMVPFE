import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [filters, setFilters] = useState({
    kind: '',
    city: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    loadListings();
  }, [filters]);

  async function loadListings() {
    try {
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Listings</h1>
      
      {/* Filters */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid md:grid-cols-4 gap-4">
          <select
            value={filters.kind}
            onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">All Types</option>
            <option value="service">Service</option>
            <option value="event">Event</option>
            <option value="space">Space</option>
          </select>
          
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="p-2 border rounded"
          />
          
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="p-2 border rounded"
          />
          
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            to={`/listings/${listing.id}`}
            className="block border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            {listing.primary_photo_url ? (
              <img
                src={listing.primary_photo_url}
                alt={listing.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No photo</span>
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {listing.kind} • {listing.address_city}
              </p>
              <p className="text-blue-600 font-semibold">
                ${(listing.price_cents / 100).toFixed(2)}
                {listing.pricing_unit === 'hour' && '/hr'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No listings found matching your criteria
        </div>
      )}
    </div>
  );
}