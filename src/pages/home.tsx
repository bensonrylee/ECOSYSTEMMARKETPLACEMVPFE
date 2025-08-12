import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Star, Shield, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              Your Local Services
              <span className="block text-blue-200">Marketplace</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 md:mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Connect with trusted providers for services, events, and spaces. 
              Secure payments, instant booking, professional results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/onboarding"
                className="group inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/browse"
                className="group inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-blue-700 transition-all duration-200"
              >
                Browse Listings
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 md:mt-16 flex flex-wrap justify-center items-center gap-6 md:gap-8 text-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <span className="text-sm">Verified Providers</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm">Instant Booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for your business and personal projects
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="group bg-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900">Services</h3>
              <p className="text-gray-600 leading-relaxed">
                From lawn care to home repair, find skilled professionals for any task. 
                All providers are verified and insured.
              </p>
            </div>
            
            <div className="group bg-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900">Events</h3>
              <p className="text-gray-600 leading-relaxed">
                Book venues, equipment, and services for your next special occasion. 
                Perfect for parties, meetings, and celebrations.
              </p>
            </div>
            
            <div className="group bg-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900">Spaces</h3>
              <p className="text-gray-600 leading-relaxed">
                Rent unique spaces for work, storage, or creative projects. 
                Find the perfect spot for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, secure, and fast. Get what you need in just a few clicks.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center group">
              <div className="relative mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                {/* Connection Line */}
                <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 -translate-y-1/2"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900">Browse & Book</h3>
              <p className="text-gray-600 leading-relaxed">
                Find the perfect service or space and book instantly with our easy-to-use platform
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                {/* Connection Line */}
                <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-purple-200 to-green-200 -translate-y-1/2"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900">Secure Payment</h3>
              <p className="text-gray-600 leading-relaxed">
                Pay safely through our platform with Stripe protection and get instant confirmation
              </p>
            </div>
            
            <div className="text-center group sm:col-span-2 lg:col-span-1">
              <div className="relative mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-900">Get It Done</h3>
              <p className="text-gray-600 leading-relaxed">
                Meet your provider and enjoy your service or space with confidence and peace of mind
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Call to Action */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 leading-relaxed">
            Join thousands of satisfied customers and providers on our platform today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl gap-2"
            >
              Start as Provider
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/browse"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/80 text-white rounded-xl font-semibold hover:bg-white hover:text-blue-700 transition-all duration-200 backdrop-blur-sm"
            >
              Find Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-white mb-4">Marketplace</div>
              <p className="text-gray-400 mb-4 max-w-md">
                Your trusted local services marketplace. Connecting customers with verified providers 
                for services, events, and spaces.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">For Customers</h3>
              <div className="space-y-2">
                <Link to="/browse" className="block hover:text-white transition-colors">Browse Services</Link>
                <Link to="/search" className="block hover:text-white transition-colors">Search</Link>
                <Link to="/profile" className="block hover:text-white transition-colors">My Account</Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">For Providers</h3>
              <div className="space-y-2">
                <Link to="/onboarding" className="block hover:text-white transition-colors">Get Started</Link>
                <Link to="/dashboard" className="block hover:text-white transition-colors">Dashboard</Link>
                <Link to="/listings/new" className="block hover:text-white transition-colors">Create Listing</Link>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
            <div className="flex gap-6 mb-4 md:mb-0">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <a href="mailto:support@marketplace.com" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm">© 2024 Marketplace. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-1">
                Payments powered by{' '}
                <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">
                  Stripe
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}