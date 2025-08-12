import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export default function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    fetchBooking();
    
    // Poll for updates if not paid
    const interval = setInterval(() => {
      setPollCount(prev => {
        if (prev >= 5) {
          clearInterval(interval);
          return prev;
        }
        fetchBooking();
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [id]);

  async function fetchBooking() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, stripe_payment_intent_id')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setBooking(data);
      
      // Stop polling if paid
      if (data?.status === 'paid') {
        setPollCount(10);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Processing payment...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Booking not found</div>
          <Link to="/browse" className="text-blue-600 hover:underline">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {booking.status === 'paid' ? (
          <>
            <div className="text-green-600 text-5xl mb-4 text-center">✓</div>
            <h1 className="text-2xl font-bold text-center mb-2">Payment Successful!</h1>
            <p className="text-gray-600 text-center mb-6">
              Your booking has been confirmed
            </p>
            <div className="bg-gray-50 rounded p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Booking ID</div>
              <div className="font-mono text-sm">{booking.id}</div>
              {booking.stripe_payment_intent_id && (
                <>
                  <div className="text-sm text-gray-600 mb-1 mt-3">Payment Intent</div>
                  <div className="font-mono text-sm">{booking.stripe_payment_intent_id}</div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-yellow-600 text-5xl mb-4 text-center">⏳</div>
            <h1 className="text-2xl font-bold text-center mb-2">
              {pollCount < 5 ? 'Processing...' : 'Still Processing'}
            </h1>
            <p className="text-gray-600 text-center mb-6">
              {pollCount < 5 
                ? 'Your payment is being processed'
                : 'This is taking longer than expected'}
            </p>
            <div className="bg-gray-50 rounded p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="font-semibold">{booking.status}</div>
            </div>
          </>
        )}
        
        <Link
          to="/browse"
          className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Browse
        </Link>
      </div>
    </div>
  );
}