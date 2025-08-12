import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  Shield, 
  ArrowLeft,
  Plus,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { bookListing } from '../../lib/payments';

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
  provider_id: string;
  created_at: string;
}

interface Slot {
  id: string;
  listing_id: string;
  start_at: string;
  end_at: string;
}

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [providerReady, setProviderReady] = useState(false);
  
  // Provider slot generation form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysAhead, setDaysAhead] = useState(14);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      // Always use public view for listing data to follow frontend rules
      const { data: listingData, error: listingError } = await supabase
        .from('public_listings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (listingError) throw listingError;
      
      setListing(listingData);
      
      if (session?.user) {
        const userIsProvider = session.user.id === listingData.provider_id;
        setIsProvider(userIsProvider);
        
        // Load slots using appropriate view
        const slotsTable = userIsProvider ? 'listing_slots' : 'public_listing_slots';
        const { data: slotsData } = await supabase
          .from(slotsTable)
          .select('*')
          .eq('listing_id', id)
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true })
          .limit(50);
        
        setSlots(slotsData || []);
        
        // Check if provider can accept payments
        if (!userIsProvider) {
          const { data: provider } = await supabase
            .from('providers')
            .select('charges_enabled')
            .eq('id', listingData.provider_id)
            .single();
          
          setProviderReady(provider?.charges_enabled || false);
        }
      }
    } catch (err: any) {
      console.error('Error loading listing:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateSlots(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const slotsToInsert = [];
      const start = new Date(startDate);
      
      for (let day = 0; day < daysAhead; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + day);
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMin, 0, 0);
        
        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + slotMinutes);
          
          if (slotEnd <= dayEnd) {
            slotsToInsert.push({
              listing_id: id,
              start_at: slotStart.toISOString(),
              end_at: slotEnd.toISOString()
            });
          }
          
          slotStart = new Date(slotEnd);
        }
      }
      
      const { error } = await supabase
        .from('listing_slots')
        .upsert(slotsToInsert, { onConflict: 'listing_id,start_at' });
      
      if (error) throw error;
      
      // Refresh slots
      await loadData();
      setShowSlotForm(false);
      
    } catch (err: any) {
      console.error('Error generating slots:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function bookSlot(slot: Slot) {
    if (!user || !listing) return;
    
    try {
      // Insert booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          listing_id: listing.id,
          customer_id: user.id,
          provider_id: listing.provider_id,
          start_at: slot.start_at,
          end_at: slot.end_at,
          amount_cents: listing.price_cents,
          status: 'pending'
        })
        .select()
        .single();
      
      if (bookingError) {
        if (bookingError.code === '23505') {
          alert('This slot was just taken. Please choose another.');
        } else {
          throw bookingError;
        }
        return;
      }
      
      // Get provider Connect ID
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('stripe_connect_id')
        .eq('id', listing.provider_id)
        .single();
      
      if (providerError || !provider?.stripe_connect_id) {
        alert('Provider not properly connected. Please try again later.');
        return;
      }
      
      // Redirect to checkout using payment helper
      await bookListing(
        booking.id,
        listing.price_cents,
        provider.stripe_connect_id,
        listing.id
      );
    } catch (err: any) {
      console.error('Booking error:', err);
      alert('Booking failed. Please try again.');
    }
  }

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    if (isToday) return `Today at ${timeString}`;
    if (isTomorrow) return `Tomorrow at ${timeString}`;
    
    return `${date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })} at ${timeString}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-8"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h1>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/browse"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Back Navigation */}
        <Link
          to="/browse"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to listings
        </Link>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image */}
          <div className="relative">
            {listing.primary_photo_url ? (
              <img
                src={listing.primary_photo_url}
                alt={listing.title}
                className="w-full h-64 md:h-96 object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <span className="text-8xl">{getKindIcon(listing.kind)}</span>
              </div>
            )}
            
            {/* Type Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium capitalize ${getKindColor(listing.kind)}`}>
              {listing.kind}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {listing.title}
              </h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{listing.address_city}, {listing.address_region}</span>
              </div>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center text-yellow-500">
                  <Star className="h-5 w-5 fill-current mr-1" />
                  <span className="text-gray-700 font-medium">4.8</span>
                  <span className="text-gray-500 ml-1">(42 reviews)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Shield className="h-5 w-5 mr-1" />
                  <span className="text-sm">Verified Provider</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  ${(listing.price_cents / 100).toFixed(2)}
                </div>
                {listing.pricing_unit === 'hour' && (
                  <div className="text-gray-600">per hour</div>
                )}
              </div>
              
              <div className="prose prose-gray max-w-none mb-8">
                <p>{listing.description}</p>
              </div>
            </div>

            {/* Auth Check */}
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-1">Sign in required</h3>
                    <p className="text-sm text-yellow-700">
                      Please sign in to view available time slots and make bookings.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Provider or Customer View */}
        {user && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
            {isProvider ? (
              // Provider View
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Availability</h2>
                  <button
                    onClick={() => setShowSlotForm(!showSlotForm)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showSlotForm ? 'Cancel' : 'Add Slots'}
                  </button>
                </div>

                {showSlotForm && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Time Slots</h3>
                    <form onSubmit={generateSlots} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Days Ahead</label>
                        <input
                          type="number"
                          value={daysAhead}
                          onChange={(e) => setDaysAhead(Number(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="365"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration (min)</label>
                        <select
                          value={slotMinutes}
                          onChange={(e) => setSlotMinutes(Number(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={240}>4 hours</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                        <button
                          type="submit"
                          disabled={generating}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {generating ? 'Generating...' : 'Generate Slots'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Current Slots */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Slots ({slots.length})
                  </h3>
                  {slots.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium">
                              {formatDateTime(slot.start_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No available slots. Generate some to start accepting bookings.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Customer View
              <div>
                {!providerReady && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-yellow-800 mb-1">Provider setup in progress</h3>
                        <p className="text-sm text-yellow-700">
                          The provider is completing their payment setup. Bookings will be available soon.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Time Slots</h2>
                
                {slots.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDateTime(slot.start_at)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            ${(listing.price_cents / 100).toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => bookSlot(slot)}
                          disabled={!providerReady}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          Book Now
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No available slots</h3>
                    <p className="text-gray-600">
                      Check back later or contact the provider directly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}