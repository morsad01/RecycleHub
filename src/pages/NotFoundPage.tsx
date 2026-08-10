import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Home, Search, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <SEO title="Page Not Found" description="The page you are looking for does not exist." />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-40 h-40">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <span className="text-7xl font-black text-primary-300 select-none">404</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-neutral-900">Page Not Found</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              <Home size={16} />
              Back to Home
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              <Search size={16} />
              Browse Marketplace
            </Link>
          </div>

          <button onClick={() => window.history.back()} className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1 mx-auto transition-colors">
            <ArrowLeft size={12} /> Go Back
          </button>
        </div>
      </div>
    </>
  );
}
