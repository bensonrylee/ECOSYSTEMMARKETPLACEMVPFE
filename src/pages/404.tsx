import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
        
        <div className="text-6xl mb-6">🔍</div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, the page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Link>
          
          <Link
            to="/browse"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium w-full justify-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Listings
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium w-full justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
        
        <div className="mt-12 p-6 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">Need help?</h3>
          <p className="text-blue-700 text-sm mb-3">
            If you think this is a mistake, please contact support.
          </p>
          <a
            href="mailto:support@marketplace.com"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}