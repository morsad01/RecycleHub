import { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, MapPin, Lock,
  PhoneCall, CheckCircle2, ChevronRight, HelpCircle, Eye
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui';

export function SafetyCenterPage() {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller' | 'meetup'>('buyer');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <SEO
        title="Buyer & Seller Safety Center"
        description="ResellBD Safety Center: Scam avoidance guidelines, safe public meetup spots, and verified identity peer-to-peer security rules in Bangladesh."
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} /> ResellBD Trust & Security Guard
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display leading-tight">
            Buy Smarter. Sell Better. Meet Safely.
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Your safety and financial integrity are our top priority. Follow our proven safety rules, inspect items in person, and use verified public meetup spots across Bangladesh.
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-3 border-b border-neutral-100 pb-2">
        {[
          { id: 'buyer', label: 'Buyer Protection Rules' },
          { id: 'seller', label: 'Seller Safety Protocol' },
          { id: 'meetup', label: 'Safe Meetup Spot Guide' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Buyer Protection */}
      {activeTab === 'buyer' && (
        <div className="space-y-6 animate-fade-in">
          {/* Critical alert */}
          <div className="p-5 rounded-3xl bg-error-50 border border-error-200 text-error-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-error-950">
              <AlertTriangle size={18} className="text-error-600 shrink-0" />
              <span>Zero-Tolerance Advance Payment Scam Rule</span>
            </div>
            <p className="leading-relaxed">
              <strong>NEVER send advance courier delivery fees, bKash PINs, or partial payments</strong> to an individual seller prior to meeting in person or using ResellBD's verified checkout. Scammers often invent urgent courier fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-neutral-100 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-sm text-neutral-900">Check Verified Identity Badges</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Prioritize sellers with <strong className="text-neutral-800">Identity Verified</strong> or <strong className="text-neutral-800">Trusted Seller</strong> badges whose government IDs have passed ResellBD verification.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-neutral-100 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-sm text-neutral-900">Hardware Inspection Checklist</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Check smartphone IMEI (*#06#), verify Apple TrueTone and battery health %, inspect laptop charging ports, and test audio speakers before handing over cash.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-neutral-100 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-sm text-neutral-900">Always Meet in Daylight</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Schedule physical inspections in daylight hours inside busy public venues like shopping malls, bank lobbies, or metro rail hubs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Seller Safety */}
      {activeTab === 'seller' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-neutral-100 space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold inline-block">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Verify Cash & Bank Transfers Live</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                When accepting instant bKash or Nagad transfers during an in-person meetup, ensure the SMS notification arrives on your own device and verify your updated account balance before parting with the product.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-neutral-100 space-y-3">
              <div className="p-3 rounded-2xl bg-primary-50 text-primary-700 font-bold inline-block">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Protect Personal Location Data</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Avoid inviting unverified strangers to private residences. Meet buyers in community public zones where both parties can comfortably test device operation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Safe Meetup Spots */}
      {activeTab === 'meetup' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-card border border-neutral-100 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={22} className="text-primary-600" />
              <h2 className="text-lg font-bold text-neutral-900">Recommended Public Meetup Spots in Bangladesh</h2>
            </div>
            <p className="text-xs text-neutral-500">
              When meeting a buyer or seller for physical pre-loved item exchange, always choose one of these designated public categories:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {[
                { title: 'Bank Branch Lobbies & ATM Booths', desc: 'Covered by 24/7 security CCTV cameras and armed guard monitoring.' },
                { title: 'Major Shopping Mall Food Courts', desc: 'Bashundhara City, Jamuna Future Park, Police Plaza, Shimanto Square, Sanmar Ocean City.' },
                { title: 'Dhaka Metro Rail (MRT) Concourse', desc: 'Secure, high-traffic stations with active security personnel.' },
                { title: 'University Campus Student Centers', desc: 'DU, BUET, NSU, BRACU, CU student cafeterias with lively daylight foot traffic.' },
              ].map((spot) => (
                <div key={spot.title} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
                  <h4 className="font-bold text-neutral-900">{spot.title}</h4>
                  <p className="text-neutral-500 mt-1 text-2xs">{spot.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
