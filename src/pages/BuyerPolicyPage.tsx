export function BuyerPolicyPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-sm">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">Buyer Policy</h1>
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="text-neutral-600 mb-4">
            Buyers are expected to read item descriptions carefully, communicate respectfully with sellers, and pay promptly for orders. Fraudulent claims will result in account suspension.
          </p>
        </div>
      </div>
    </main>
  );
}
