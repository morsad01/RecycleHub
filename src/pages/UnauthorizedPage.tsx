import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ShieldOff, Home } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <>
      <SEO title="Access Denied" description="You don't have permission to view this page." />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-error-50 flex items-center justify-center mx-auto">
            <ShieldOff size={40} className="text-error-400" />
          </div>

          <div className="space-y-2">
            <p className="text-5xl font-black text-error-200">403</p>
            <h1 className="text-2xl font-black text-neutral-900">Access Denied</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              You don't have permission to view this page. Please contact an administrator if you believe this is an error.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
