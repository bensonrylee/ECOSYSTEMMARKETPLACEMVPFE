import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Briefcase, 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  Shield,
  Star,
  Clock,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'role' | 'connect' | 'auth'>('auth');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep('role');
      } else {
        setStep('auth');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setStep('auth');
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setStep('role');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setStep('role');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: 'provider' | 'customer') => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStep('auth');
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
        setStep('connect');
      } else {
        // Customer - redirect to browse
        navigate('/browse');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
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
    } finally {
      setLoading(false);
    }
  };

  if (step === 'auth') {
    return <AuthStep onSignUp={handleSignUp} onSignIn={handleSignIn} loading={loading} error={error} />;
  }

  if (step === 'role') {
    return <RoleSelectionStep onRoleSelect={handleRoleSelect} loading={loading} error={error} />;
  }

  if (step === 'connect') {
    return <ConnectStep onConnect={handleConnect} loading={loading} error={error} />;
  }

  return null;
}

function AuthStep({ onSignUp, onSignIn, loading, error }: {
  onSignUp: (email: string, password: string) => void;
  onSignIn: (email: string, password: string) => void;
  loading: boolean;
  error: string;
}) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      onSignUp(email, password);
    } else {
      onSignIn(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isSignUp ? 'Join thousands of users on our platform' : 'Sign in to your account'}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-blue-600 hover:text-blue-500 font-medium"
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-500 font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoleSelectionStep({ onRoleSelect, loading, error }: {
  onRoleSelect: (role: 'provider' | 'customer') => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Welcome to the Marketplace
          </h2>
          <p className="text-xl text-gray-600">
            Choose how you'd like to use our platform
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {/* Customer Option */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full border-2 border-transparent hover:border-blue-200 transition-all cursor-pointer group"
                 onClick={() => !loading && onRoleSelect('customer')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm a Customer</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Book services, events, and spaces from verified providers in your area
                </p>
                
                <div className="space-y-3 mb-8 text-left">
                  {[
                    { icon: Star, text: 'Browse verified providers' },
                    { icon: Shield, text: 'Secure payments with Stripe' },
                    { icon: Clock, text: 'Instant booking confirmation' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <feature.icon className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={loading}
                  className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      Get Started as Customer
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Provider Option */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full border-2 border-transparent hover:border-purple-200 transition-all cursor-pointer group"
                 onClick={() => !loading && onRoleSelect('provider')}>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                  <Briefcase className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm a Provider</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Offer your services, host events, or rent spaces to customers in your area
                </p>
                
                <div className="space-y-3 mb-8 text-left">
                  {[
                    { icon: DollarSign, text: 'Earn money from your skills' },
                    { icon: Users, text: 'Reach thousands of customers' },
                    { icon: Zap, text: 'Easy listing management' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <feature.icon className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={loading}
                  className="w-full py-4 px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      Get Started as Provider
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            You can change your role later in your account settings
          </p>
        </div>
      </div>
    </div>
  );
}

function ConnectStep({ onConnect, loading, error }: {
  onConnect: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Almost There!
          </h2>
          <p className="text-gray-600 text-lg">
            Connect your Stripe account to start accepting payments
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div className="flex items-start">
              <Shield className="w-6 h-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Secure & Fast</h3>
                <p className="text-gray-600 text-sm">
                  Stripe handles all payment processing with bank-level security
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-green-600 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quick Setup</h3>
                <p className="text-gray-600 text-sm">
                  Takes just 2-3 minutes to complete your account setup
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <DollarSign className="w-6 h-6 text-purple-600 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Start Earning</h3>
                <p className="text-gray-600 text-sm">
                  Begin accepting bookings and payments immediately after setup
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6 mr-3" />
                Connect with Stripe
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By connecting, you agree to Stripe's{' '}
              <a href="https://stripe.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium text-sm">
            Skip for now (you can set up payments later)
          </Link>
        </div>
      </div>
    </div>
  );
}