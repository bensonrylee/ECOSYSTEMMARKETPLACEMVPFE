import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  CreditCard,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Booking {
  id: string;
  status: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  start_at: string;
  end_at: string;
  listing: {
    title: string;
    address_city: string;
    address_region: string;
    kind: string;
  } | null;
  provider: {
    email: string;
  } | null;
}

export default function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    fetchBooking();
    
    // Poll for updates if not paid (max 10 seconds)
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
        .select(`
          id, 
          status, 
          stripe_payment_intent_id,
          amount_cents,
          start_at,
          end_at,
          listings:listing_id (
            title,
            address_city,
            address_region,
            kind
          ),
          profiles:provider_id (
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Booking not found. Please check your booking confirmation email.');
        } else {
          throw error;
        }
        return;
      }
      
      setBooking({
        ...data,
        listing: Array.isArray(data.listings) ? data.listings[0] : data.listings,
        provider: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
      });
      
      // Stop polling if paid
      if (data?.status === 'paid') {
        setPollCount(10);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Unable to load booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const handleShare = async () => {
    if (navigator.share && booking) {
      try {
        await navigator.share({
          title: 'Booking Confirmation',
          text: `My booking for ${booking.listing?.title} is confirmed!`,
          url: window.location.href,
        });
      } catch (err) {
        // Fall back to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing payment...</h1>
          <p className="text-gray-600">Please wait while we confirm your booking</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full mx-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? 'Unable to Load Booking' : 'Booking Not Found'}
          </h1>
          <p className="text-gray-600 mb-8">
            {error || 'The booking you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <div className="space-y-3">
            <Link
              to="/browse"
              className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Browse
            </Link>
            <Link
              to="/profile"
              className="block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startDateTime = formatDateTime(booking.start_at);
  const endDateTime = formatDateTime(booking.end_at);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 md:px-8 py-8 text-white text-center">
            {booking.status === 'paid' ? (
              <>
                <CheckCircle className="h-20 w-20 mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Booking Confirmed!</h1>
                <p className="text-green-100 text-lg">
                  Your payment was successful and your booking is confirmed
                </p>
              </>
            ) : booking.status === 'pending' && pollCount < 5 ? (
              <>
                <Clock className="h-20 w-20 mx-auto mb-4 animate-pulse" />
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Processing Payment...</h1>
                <p className="text-blue-100 text-lg">
                  Please wait while we process your payment
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-20 w-20 mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment Pending</h1>
                <p className="text-yellow-100 text-lg">
                  Your payment is taking longer than expected
                </p>
              </>
            )}
          </div>

          {/* Booking Details */}
          <div className="px-6 md:px-8 py-8">
            {booking.listing && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
                
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-xl text-gray-900 mb-4">
                    {booking.listing.title}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{startDateTime.date}</div>
                        <div className="text-gray-600">{startDateTime.time} - {endDateTime.time}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{booking.listing.kind}</div>
                        <div className="text-gray-600">
                          {booking.listing.address_city}, {booking.listing.address_region}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Payment Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-xl">${(booking.amount_cents / 100).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                        booking.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status === 'paid' ? 'Paid' : 'Processing'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Booking ID</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {booking.id}
                      </span>
                    </div>
                    
                    {booking.stripe_payment_intent_id && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Reference</span>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {booking.stripe_payment_intent_id.substring(0, 20)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {booking.status === 'paid' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Booking
                  </button>
                  
                  <button className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </button>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/profile"
                  className="flex items-center justify-center px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  View My Bookings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
                
                <Link
                  to="/browse"
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Book Another Service
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Additional Info */}
            {booking.status === 'paid' && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
                <div className="text-green-700 space-y-2 text-sm">
                  <p>• You'll receive a confirmation email shortly</p>
                  <p>• The provider will contact you before your scheduled time</p>
                  <p>• Keep this page bookmarked for your reference</p>
                  <p>• Contact support if you need to make any changes</p>
                </div>
              </div>
            )}

            {booking.status !== 'paid' && pollCount >= 5 && (
              <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="font-semibold text-yellow-800 mb-2">Payment Still Processing</h3>
                <div className="text-yellow-700 space-y-2 text-sm">
                  <p>• Your payment may take a few minutes to process</p>
                  <p>• You'll receive an email confirmation once complete</p>
                  <p>• Refresh this page to check for updates</p>
                  <p>• Contact support if you continue to have issues</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}