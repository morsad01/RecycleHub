import { SEO } from '../components/SEO';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflinePage() {
  return (
    <>
      <SEO title="You're Offline" description="No internet connection. Please check your network." />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto">
            <WifiOff size={40} className="text-neutral-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-neutral-900">You're Offline</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              It seems you've lost your internet connection. Please check your network settings and try again.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    </>
  );
}
