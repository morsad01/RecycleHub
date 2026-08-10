export function PrivacyPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-sm">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-neutral-600 mb-4">
            We collect information you provide directly to us, such as your name, email address, phone number, and physical address for delivery purposes.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Information</h2>
          <p className="text-neutral-600 mb-4">
            We use the information to operate, maintain, and provide the features of the Service, process transactions, and send related information including confirmations and invoices.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Information Sharing</h2>
          <p className="text-neutral-600 mb-4">
            We do not sell your personal information. We may share necessary information with delivery partners and payment gateways to fulfill your orders.
          </p>
        </div>
      </div>
    </main>
  );
}
