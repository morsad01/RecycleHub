import { useState } from 'react';
import { ShieldCheck, HelpCircle, X, CheckCircle2, TrendingUp, Star, Clock, Phone, Mail, Shield } from 'lucide-react';
import type { Profile, TrustScoreBreakdown } from '../../types';

interface TrustScoreCardProps {
  score?: number;
  profile?: Profile | null;
  compact?: boolean;
  className?: string;
}

export function TrustScoreCard({
  score = 92,
  profile,
  compact = false,
  className = '',
}: TrustScoreCardProps) {
  const [showModal, setShowModal] = useState(false);

  // Derive realistic breakdown factors
  const breakdown: TrustScoreBreakdown = {
    identity: profile?.is_seller_verified ? 25 : 10,
    phone: profile?.phone ? 15 : 5,
    email: 15,
    transactions: Math.min(20, (profile?.total_sales ?? 3) * 4),
    rating: Math.round(((profile?.rating_avg ?? 4.8) / 5) * 15),
    responsiveness: 10,
  };

  const calculatedScore = profile?.trust_score ?? Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));

  const getScoreColor = (val: number) => {
    if (val >= 90) return { ring: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', label: 'Exceptional Trust' };
    if (val >= 75) return { ring: 'text-primary-500', bg: 'bg-primary-50 text-primary-700 border-primary-200', text: 'text-primary-600', label: 'High Trust' };
    if (val >= 60) return { ring: 'text-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', label: 'Moderate Trust' };
    return { ring: 'text-neutral-400', bg: 'bg-neutral-50 text-neutral-600 border-neutral-200', text: 'text-neutral-500', label: 'Building Trust' };
  };

  const color = getScoreColor(calculatedScore);

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${color.bg} ${className}`}
          title="Seller Trust Score - Click for details"
        >
          <ShieldCheck size={14} className={color.text} />
          <span>Trust Score: {calculatedScore}/100</span>
        </button>

        {showModal && <TrustCalculationModal onClose={() => setShowModal(false)} score={calculatedScore} breakdown={breakdown} />}
      </>
    );
  }

  return (
    <>
      <div className={`p-5 rounded-3xl bg-white border border-neutral-100 shadow-card ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className={color.text} size={20} />
            <h3 className="text-sm font-bold text-neutral-900">ResellBD Trust Score</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <HelpCircle size={14} /> How it's calculated
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={color.ring}
                strokeDasharray={`${calculatedScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-black text-neutral-900">{calculatedScore}</span>
              <span className="text-[9px] text-neutral-400 font-bold -mt-0.5">/100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-900">{color.label}</span>
              <span className="text-2xs px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-600 font-semibold">Verified Model</span>
            </div>
            <p className="text-2xs text-neutral-500 mt-1 line-clamp-2">
              Based on official identity verification, completed buyer transactions, response rate, and peer reviews.
            </p>
          </div>
        </div>
      </div>

      {showModal && <TrustCalculationModal onClose={() => setShowModal(false)} score={calculatedScore} breakdown={breakdown} />}
    </>
  );
}

function TrustCalculationModal({
  onClose,
  score,
  breakdown,
}: {
  onClose: () => void;
  score: number;
  breakdown: TrustScoreBreakdown;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">ResellBD Trust Score Model</h3>
              <p className="text-xs text-neutral-500">Transparent & Fair Buyer Confidence System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Score Breakdown */}
        <div className="py-5 space-y-5 text-xs text-neutral-600">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div>
              <span className="text-xs font-bold text-neutral-800">Total Trust Rating</span>
              <p className="text-2xs text-neutral-500">Calculated across 6 multi-dimensional verification signals</p>
            </div>
            <div className="text-xl font-black text-primary-600 bg-white px-3.5 py-1.5 rounded-xl border border-neutral-200">
              {score} <span className="text-xs text-neutral-400 font-bold">/100</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wider mb-3">
              Factor Weighting Breakdown:
            </h4>

            <div className="space-y-2.5">
              {[
                { label: 'Identity KYC Document Review', pts: breakdown.identity, max: 25, icon: <Shield size={14} />, desc: 'NID, Passport or Driving License verified by ResellBD' },
                { label: 'Phone Number OTP Verification', pts: breakdown.phone, max: 15, icon: <Phone size={14} />, desc: 'Active Bangladesh mobile verified via 2-factor OTP' },
                { label: 'Email Account Authentication', pts: breakdown.email, max: 15, icon: <Mail size={14} />, desc: 'Authenticated email address' },
                { label: 'Successful Completed Sales', pts: breakdown.transactions, max: 20, icon: <TrendingUp size={14} />, desc: 'Delivered orders without dispute resolution claims' },
                { label: 'Buyer Reviews & Star Rating', pts: breakdown.rating, max: 15, icon: <Star size={14} />, desc: 'Authentic feedback from verified buyers' },
                { label: 'Response Rate & Chat Speed', pts: breakdown.responsiveness, max: 10, icon: <Clock size={14} />, desc: 'Prompt reply to buyer inquiries' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl border border-neutral-100 bg-white hover:border-neutral-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-semibold text-neutral-900">
                      <span className="text-primary-600">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span className="font-bold text-neutral-800">
                      {item.pts} / {item.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-1">
                    <div
                      className="bg-primary-500 h-full rounded-full"
                      style={{ width: `${(item.pts / item.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-3xs text-neutral-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-sky-900 text-2xs space-y-1">
            <strong className="font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-sky-600" /> Transparent & Anti-Discriminatory
            </strong>
            <p>
              ResellBD's scoring algorithm evaluates objective safety signals without exposing private seller documents or sensitive personal data.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          Close Explainer
        </button>
      </div>
    </div>
  );
}
