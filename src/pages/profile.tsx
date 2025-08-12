import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, Calendar, CreditCard, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your profile</p>
          <Link
            to="/onboarding"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{profile?.display_name || 'User'}</h1>
                  <p className="text-blue-100 mt-1">{user.email}</p>
                  {profile?.role && (
                    <span className="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm capitalize">
                      {profile.role}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to="/profile/edit"
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Profile Info */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
                <div className="space-y-4">
                  {profile?.city && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span>{profile.city}, {profile.region}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">View Dashboard</span>
                  </Link>
                  <Link
                    to="/listings/new"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Create New Listing</span>
                  </Link>
                  <Link
                    to="/browse"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Browse Services</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}