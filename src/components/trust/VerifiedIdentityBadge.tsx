import { useState } from 'react';
import { Shield, ShieldCheck, Phone, Mail, Building2, CheckCircle2, Info, X } from 'lucide-react';
import type { VerificationLevel } from '../../types';

interface VerifiedIdentityBadgeProps {
  level?: VerificationLevel | string;
  isSellerVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  businessVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function VerifiedIdentityBadge({
  level = 'level_3',
  isSellerVerified = true,
  phoneVerified = true,
  emailVerified = true,
  businessVerified = false,
  size = 'md',
  showDetails = false,
  className = '',
}: VerifiedIdentityBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  const getTierDetails = () => {
    if (businessVerified || level === 'level_5') {
      return {
        label: 'Business Verified',
        icon: <Building2 className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
        color: 'text-indigo-600',
        tier: 5,
        desc: 'Verified business entity with official trade license and verified seller credentials.',
      };
    }
    if (level === 'level_4') {
      return {
        label: 'Trusted Seller',
        icon: <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        color: 'text-emerald-600',
        tier: 4,
        desc: 'Identity verified with 5+ completed sales, high buyer ratings (4.5+), and prompt response rates.',
      };
    }
    if (isSellerVerified || level === 'level_3') {
      return {
        label: 'Identity Verified',
        icon: <Shield className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
        badgeClass: 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100',
        color: 'text-primary-600',
        tier: 3,
        desc: 'Identity verified via official document review (NID / Passport / Driving License) under ResellBD Privacy Shield.',
      };
    }
    if (phoneVerified || level === 'level_1') {
      return {
        label: 'Phone Verified',
        icon: <Phone className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
        color: 'text-sky-600',
        tier: 1,
        desc: 'Active phone number verified via SMS confirmation.',
      };
    }
    return {
      label: 'Email Verified',
      icon: <Mail className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
      badgeClass: 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100',
      color: 'text-neutral-600',
      tier: 2,
      desc: 'Email account authenticated and confirmed.',
    };
  };

  const tier = getTierDetails();

  const sizeClasses = {
    sm: 'text-2xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowModal(true);
        }}
        className={`inline-flex items-center font-semibold rounded-full border transition-all duration-200 ${sizeClasses[size]} ${tier.badgeClass} ${className}`}
        title={`${tier.label} - Click to learn more`}
      >
        <span className="shrink-0">{tier.icon}</span>
        <span>{tier.label}</span>
        {showDetails && <Info className="w-3 h-3 opacity-60 ml-0.5" />}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${tier.badgeClass}`}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{tier.label}</h3>
                  <p className="text-xs text-neutral-500">ResellBD Trust & Verification Framework</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            <div className="py-4 space-y-4 text-xs text-neutral-600">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <p className="font-semibold text-neutral-800 mb-1">What does this badge mean?</p>
                <p className="leading-relaxed">{tier.desc}</p>
              </div>

              {/* 5-Tier Verification Levels */}
              <div>
                <p className="font-bold text-neutral-800 mb-2.5 uppercase tracking-wide text-2xs">
                  ResellBD 5-Tier Verification Levels:
                </p>
                <div className="space-y-2">
                  {[
                    { lvl: 'Level 1', name: 'Phone Verified', icon: <Phone size={13} />, desc: 'SMS OTP confirmed' },
                    { lvl: 'Level 2', name: 'Email Verified', icon: <Mail size={13} />, desc: 'Inbox authenticated' },
                    { lvl: 'Level 3', name: 'Identity Verified', icon: <Shield size={13} />, desc: 'NID / Passport / License reviewed' },
                    { lvl: 'Level 4', name: 'Trusted Seller', icon: <ShieldCheck size={13} />, desc: '5+ successful sales, 4.5+ rating' },
                    { lvl: 'Level 5', name: 'Business Verified', icon: <Building2 size={13} />, desc: 'Official trade license registered' },
                  ].map((item, idx) => (
                    <div
                      key={item.lvl}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                        idx + 1 === tier.tier ? 'bg-primary-50 border border-primary-200 font-semibold text-primary-900' : 'bg-neutral-50/60 text-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-2xs text-neutral-400 font-medium">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Shield Notice */}
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-2xs">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Privacy-First Architecture</strong>
                  Identity documents and government numbers are strictly encrypted in private storage and NEVER visible to buyers.
                </div>
              </div>
            </div>

            {/* Footer button */}
            <div className="pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
