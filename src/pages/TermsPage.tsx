export function TermsPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-sm">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">Terms of Service</h1>
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-neutral-600 mb-4">
            By accessing or using RecycleHub, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. User Accounts</h2>
          <p className="text-neutral-600 mb-4">
            You must provide accurate and complete information when creating an account. You are responsible for safeguarding your password and any activities under your account.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Prohibited Items</h2>
          <p className="text-neutral-600 mb-4">
            Users may not list illegal items, stolen goods, hazardous materials, or any items that violate local laws in Bangladesh.
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">4. Platform Rules</h2>
          <p className="text-neutral-600 mb-4">
            RecycleHub is a marketplace connecting buyers and sellers. We do not take ownership of the items listed and are not responsible for the quality, safety, or legality of the items.
          </p>
        </div>
      </div>
    </main>
  );
}
