import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function NewListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'service' | 'event' | 'space'>('service');
  const [priceCents, setPriceCents] = useState('');
  const [pricingUnit, setPricingUnit] = useState<'fixed' | 'hour'>('fixed');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setIsProvider(profile?.role === 'provider');
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const sessionResult = await supabase.auth.getSession();
    if (!sessionResult.data.session) return;
    const session = sessionResult.data.session;

    const priceNum = parseInt(priceCents);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be a positive number');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('listings')
      .insert({
        provider_id: session.user.id,
        title,
        description: '',
        kind,
        price_cents: priceNum,
        pricing_unit: pricingUnit,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      alert(`Error: ${error.message}`);
      setSubmitting(false);
      return;
    }

    navigate(`/listings/${data.id}`);
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }
  
  if (!isProvider) {
    return <div className="p-8">Provider access required</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kind</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="w-full p-2 border rounded"
          >
            <option value="service">Service</option>
            <option value="event">Event</option>
            <option value="space">Space</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price (cents) *</label>
          <input
            type="number"
            required
            min="1"
            value={priceCents}
            onChange={(e) => setPriceCents(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pricing Unit</label>
          <select
            value={pricingUnit}
            onChange={(e) => setPricingUnit(e.target.value as typeof pricingUnit)}
            className="w-full p-2 border rounded"
          >
            <option value="fixed">Fixed</option>
            <option value="hour">Per Hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Latitude (optional)</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Longitude (optional)</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}