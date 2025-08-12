import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function OnboardingComplete() {
  const [status, setStatus] = useState('Verifying account status...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const updateProvider = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Get account ID from URL
        const accountId = searchParams.get('acct');
        if (!accountId) {
          setStatus('No account ID found. Please try onboarding again.');
          return;
        }

        // Call Edge Function to retrieve and update provider capabilities
        const { data: session } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke('update-provider-capabilities', {
          body: { accountId },
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`
          }
        });

        if (error) throw error;

        if (data?.charges_enabled) {
          setStatus('Success! You can now accept payments. Redirecting...');
          setTimeout(() => navigate('/listings/new'), 2000);
        } else {
          setStatus('Account setup incomplete. You may need to provide additional information to Stripe.');
          setTimeout(() => navigate('/onboarding'), 3000);
        }
      } catch (err) {
        setStatus('Error verifying account status');
        console.error(err);
      }
    };

    updateProvider();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Onboarding Complete</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}