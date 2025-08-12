import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = async (role: 'provider' | 'customer') => {
    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Upsert profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role,
          display_name: user.email?.split('@')[0] || 'User'
        });

      if (profileError) throw profileError;

      if (role === 'provider') {
        // Create provider record
        const { error: providerError } = await supabase
          .from('providers')
          .upsert({
            id: user.id,
            charges_enabled: false
          });

        if (providerError) throw providerError;
        
        // Show Connect button
        setLoading(false);
      } else {
        // Customer - redirect to browse
        navigate('/browse');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}/onboarding/complete`
          })
        }
      );

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get Connect URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Connect');
      setLoading(false);
    }
  };

  const [showConnect, setShowConnect] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Welcome! Choose your role</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        {!showConnect ? (
          <div className="space-y-4">
            <button
              onClick={() => {
                handleRoleSelect('provider');
                setShowConnect(true);
              }}
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              I'm a Provider
            </button>
            
            <button
              onClick={() => handleRoleSelect('customer')}
              disabled={loading}
              className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              I'm a Customer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              To accept payments, connect your Stripe account
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Connect with Stripe'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}