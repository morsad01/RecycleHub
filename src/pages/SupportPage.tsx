import { useI18n } from '../i18n/I18nContext';
import { HelpCircle, MessageCircle, FileText, Search, Mail } from 'lucide-react';

export function SupportPage() {
  const { t } = useI18n();

  const faqs = [
    { q: 'How do I list an item?', a: 'Click the "Sell" button in the navigation bar and follow the AI-guided listing process.' },
    { q: 'Is it safe to buy on RecycleHub?', a: 'Yes! We verify our sellers and offer secure payment and delivery options.' },
    { q: 'How do I get paid as a seller?', a: 'Payments are held securely and released to you once the buyer confirms delivery.' }
  ];

  return (
    <main className="min-h-screen pt-24 pb-20 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">How can we help?</h1>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input 
              type="text" 
              placeholder="Search for answers..."
              className="w-full h-14 pl-12 pr-4 bg-white border-2 border-neutral-200 rounded-2xl focus:border-primary-500 focus:ring-0 outline-none text-lg transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Knowledge Base</h3>
            <p className="text-sm text-neutral-600">Read detailed guides and articles.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Support Tickets</h3>
            <p className="text-sm text-neutral-600">Check the status of your open tickets.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Contact Us</h3>
            <p className="text-sm text-neutral-600">Get in touch with our team directly.</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="text-primary-600" size={24} />
            <h2 className="text-2xl font-bold text-neutral-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-neutral-100 last:border-0 pb-6 last:pb-0">
                <h4 className="font-bold text-neutral-900 text-lg mb-2">{faq.q}</h4>
                <p className="text-neutral-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
