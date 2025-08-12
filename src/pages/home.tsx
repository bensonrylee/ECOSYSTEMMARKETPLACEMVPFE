import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Your Local Services Marketplace
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Connect with trusted providers for services, events, and spaces
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/onboarding"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
            <Link
              to="/browse"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">Services</h3>
              <p className="text-gray-600">
                From lawn care to home repair, find skilled professionals for any task
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-purple-600">Events</h3>
              <p className="text-gray-600">
                Book venues, equipment, and services for your next special occasion
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-green-600">Spaces</h3>
              <p className="text-gray-600">
                Rent unique spaces for work, storage, or creative projects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 mb-8">Trusted by leading organizations</p>
          <div className="flex justify-center items-center gap-12 opacity-50">
            <div className="w-32 h-12 bg-gray-300 rounded"></div>
            <div className="w-32 h-12 bg-gray-300 rounded"></div>
            <div className="w-32 h-12 bg-gray-300 rounded"></div>
            <div className="w-32 h-12 bg-gray-300 rounded"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Book</h3>
              <p className="text-gray-600">
                Find the perfect service or space and book instantly
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">
                Pay safely through our platform with Stripe protection
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get It Done</h3>
              <p className="text-gray-600">
                Meet your provider and enjoy your service or space
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold">Marketplace</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-sm">
            © 2024 Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}