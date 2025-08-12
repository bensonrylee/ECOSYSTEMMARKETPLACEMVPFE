import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function OnboardingComplete() {
  const [status, setStatus] = useState('Processing...');
  const navigate = useNavigate();

  useEffect(() => {
    const updateProvider = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Update provider with charges_enabled
        const { error } = await supabase
          .from('providers')
          .update({ charges_enabled: true })
          .eq('id', user.id);

        if (error) throw error;

        setStatus('Success! Redirecting...');
        setTimeout(() => navigate('/listings/new'), 2000);
      } catch (err) {
        setStatus('Error completing onboarding');
        console.error(err);
      }
    };

    updateProvider();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Onboarding Complete</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}