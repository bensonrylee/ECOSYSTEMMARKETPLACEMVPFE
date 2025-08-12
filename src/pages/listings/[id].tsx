import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { bookListing } from '../../lib/payments';

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [providerReady, setProviderReady] = useState(false);
  
  // Provider slot form
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
      
      if (!session) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      
      // Use public view for anonymous users, full table for authenticated
      const tableName = session ? 'listings' : 'public_listings';
      const { data: listingData, error: listingError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (listingError) throw listingError;
      
      setListing(listingData);
      setIsProvider(session.user.id === listingData.provider_id);
      
      if (!isProvider) {
        // Load slots for customers (use public view for anon)
        const slotsTable = session ? 'listing_slots' : 'public_listing_slots';
        const { data: slotsData } = await supabase
          .from(slotsTable)
          .select('*')
          .eq('listing_id', id)
          .order('start_at', { ascending: true })
          .limit(50);
        
        setSlots(slotsData || []);
        
        // Check if provider can accept payments
        const { data: provider } = await supabase
          .from('providers')
          .select('charges_enabled')
          .eq('id', listingData.provider_id)
          .single();
        
        setProviderReady(provider?.charges_enabled || false);
      }
    } catch (err: any) {
      alert(String(err?.message || err));
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
      
      alert(`Generated ${slotsToInsert.length} slots`);
    } catch (err: any) {
      alert(String(err?.message || err));
    } finally {
      setGenerating(false);
    }
  }

  async function bookSlot(slot: any) {
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
          alert('This slot was just taken.');
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
        alert('Provider not properly connected');
        return;
      }
      
      // Redirect to checkout
      await bookListing(
        booking.id,
        listing.price_cents,
        provider.stripe_connect_id,
        listing.id
      );
    } catch (err: any) {
      alert(String(err?.message || err));
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!listing) return <div className="p-8">Listing not found</div>;
  if (!user) return <div className="p-8">Please sign in</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
      <p className="text-gray-600 mb-4">
        {listing.kind} • ${(listing.price_cents / 100).toFixed(2)} {listing.pricing_unit === 'hour' ? '/hr' : ''}
      </p>
      
      {isProvider ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Generate Slots</h2>
          <form onSubmit={generateSlots} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Days Ahead</label>
              <input
                type="number"
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="w-full p-2 border rounded"
                min="1"
                max="365"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slot Duration (minutes)</label>
              <input
                type="number"
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(Number(e.target.value))}
                className="w-full p-2 border rounded"
                min="15"
                max="480"
                required
              />
            </div>
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Slots'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          {!providerReady && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-4">
              <p className="font-semibold mb-1">Provider setup incomplete</p>
              <p className="text-sm">The provider needs to complete their payout setup before accepting payments. Bookings are temporarily unavailable.</p>
            </div>
          )}
          <h2 className="text-xl font-semibold mb-4">Available Slots</h2>
          <div className="space-y-2">
            {slots.map((slot) => (
              <div key={slot.start_at} className="flex justify-between items-center p-3 border rounded">
                <span>
                  {new Date(slot.start_at).toLocaleDateString()} at {new Date(slot.start_at).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => bookSlot(slot)}
                  disabled={!providerReady}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Book
                </button>
              </div>
            ))}
            {slots.length === 0 && <p className="text-gray-500">No available slots</p>}
          </div>
        </div>
      )}
    </div>
  );
}