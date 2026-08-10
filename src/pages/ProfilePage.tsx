import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, MapPin, Plus, Trash2, Star, Upload, ArrowRight, CheckCircle2, 
  Clock, XCircle, CreditCard, Globe, Car, Lock, Sparkles, AlertCircle, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button, Input, Textarea, Avatar, Modal, Badge } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { Address, IdentityVerification } from '../types';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrFull, setAddrFull] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrPhone, setAddrPhone] = useState('');

  // Fetch identity verification status from identity_verifications table
  const { data: verification } = useQuery({
    queryKey: ['my-identity-verification', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as IdentityVerification | null;
    },
    enabled: !!user,
  });

  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as Address[];
    },
    enabled: !!user,
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    const file = e.target.files[0];
    try {
      const { uploadToGoogleDrive } = await import('../lib/googleDrive');
      const directUrl = await uploadToGoogleDrive(file);
      const { error } = await supabase.from('profiles').update({ avatar_url: directUrl }).eq('id', user.id);
      if (!error) {
        refreshProfile();
        toast(lang === 'bn' ? 'প্রোফাইল ছবি আপডেট হয়েছে' : 'Avatar updated', 'success');
      } else {
        toast((lang === 'bn' ? 'আপডেট ব্যর্থ: ' : 'Failed to update avatar: ') + error.message, 'error');
      }
    } catch (err: any) {
      toast((lang === 'bn' ? 'আপলোড ব্যর্থ: ' : 'Failed to upload avatar: ') + (err.message || err), 'error');
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: fullName,
      phone,
      bio,
      address,
      city,
    }).eq('id', user!.id);
    setSaving(false);
    refreshProfile();
    toast(t('profile.saved'), 'success');
  };

  const saveAddress = async () => {
    if (!user) return;
    const addrData = {
      user_id: user.id,
      label: addrLabel || null,
      full_address: addrFull,
      city: addrCity || null,
      area: addrArea || null,
      phone: addrPhone || null,
    };
    if (editingAddress) {
      await supabase.from('addresses').update(addrData).eq('id', editingAddress.id);
    } else {
      await supabase.from('addresses').insert(addrData);
    }
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddrLabel(''); setAddrFull(''); setAddrCity(''); setAddrArea(''); setAddrPhone('');
    queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    toast(lang === 'bn' ? 'ঠিকানা সংরক্ষিত হয়েছে' : 'Address saved', 'success');
  };

  const deleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t('profile.title')}</h1>

      {/* Profile info */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size={72} />
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center cursor-pointer hover:bg-primary-600">
              <Upload size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-neutral-900">{profile?.full_name}</h2>
              {profile?.is_seller_verified && <Badge variant="success"><Shield size={10} /> {t('profile.verifiedBadge')}</Badge>}
            </div>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={14} className="text-accent-400 fill-accent-400" />
              <span className="text-sm text-neutral-600">{profile?.rating_avg.toFixed(1)} ({profile?.rating_count})</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label={t('profile.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label={t('profile.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880..." />
          <Input label={t('profile.address')} value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label={t('profile.city')} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <Textarea label={t('profile.bio')} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-4" />
        <Button onClick={saveProfile} loading={saving} className="mt-4">{t('profile.save')}</Button>
      </div>

      {/* Seller verification — Full Bangladesh KYC Hub */}
      <div className="bg-white rounded-2xl shadow-card p-6 border border-neutral-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 shadow-sm">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-900">
                  {lang === 'bn' ? 'ভেরিফায়েড সেলার ভেরিফিকেশন' : 'Become a Verified Seller'}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                  KYC Verification
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {lang === 'bn'
                  ? 'উচ্চ ট্রাস্ট স্কোর অর্জন করতে এবং ক্রেতাদের আস্থা বাড়াতে সরকারি পরিচয়পত্র দিয়ে ভেরিফিকেশন সম্পন্ন করুন।'
                  : 'Verify your identity using official Bangladesh government documents to build trust and increase sales.'}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div>
            {profile?.is_seller_verified || verification?.status === 'approved' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 size={15} /> {lang === 'bn' ? 'আইডেন্টিটি ভেরিফায়েড ✓' : 'Identity Verified ✓'}
              </div>
            ) : verification?.status === 'pending' || verification?.status === 'under_review' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                <Clock size={15} /> {lang === 'bn' ? 'পর্যালোচনাধীন (১–২ দিন)' : 'Under Review (1–2 Days)'}
              </div>
            ) : verification?.status === 'rejected' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-50 border border-error-200 text-error-700 text-xs font-bold">
                <XCircle size={15} /> {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Action Required'}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                {lang === 'bn' ? 'ভেরিফায়েড নয়' : 'Not Verified'}
              </div>
            )}
          </div>
        </div>

        {/* Accepted Bangladesh Documents */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
            {lang === 'bn' ? 'বাংলাদেশে অনুমোদিত পরিচয়পত্র:' : 'Accepted Documents in Bangladesh:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5">
              <CreditCard size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block">
                  {lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'Bangladesh NID'}
                </span>
                <span className="text-2xs text-neutral-500">
                  {lang === 'bn' ? 'স্মার্ট কার্ড বা লেমিনেটেড এনআইডি' : 'Smart Card or Laminated NID (Front + Back + Selfie)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5">
              <Globe size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block">
                  {lang === 'bn' ? 'পাসপোর্ট' : 'Passport'}
                </span>
                <span className="text-2xs text-neutral-500">
                  {lang === 'bn' ? 'মেশিন-রিডেবল পাসপোর্ট (বায়ো-ডাটা পাতা)' : 'Machine-Readable Passport (Bio-data page + Selfie)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5">
              <Car size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block">
                  {lang === 'bn' ? 'ড্রাইভিং লাইসেন্স' : 'Driving License'}
                </span>
                <span className="text-2xs text-neutral-500">
                  {lang === 'bn' ? 'বিআরটিএ স্মার্ট ড্রাইভিং লাইসেন্স' : 'BRTA Smart License (Front + Back + Selfie)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Perks */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-2xs text-neutral-600 font-medium">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
            <Sparkles size={13} className="text-emerald-600" />
            {lang === 'bn' ? 'ভেরিফায়েড সেলার ব্যাজ ✓' : 'Verified Seller Badge ✓'}
          </span>
          <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-800 px-2.5 py-1 rounded-lg border border-primary-100">
            <Shield size={13} className="text-primary-600" />
            {lang === 'bn' ? '+২৫ ট্রাস্ট স্কোর পয়েন্ট' : '+25 Trust Score Points'}
          </span>
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg">
            <Lock size={13} />
            {lang === 'bn' ? 'এনক্রিপ্টেড প্রাইভেট স্টোরেজ' : 'Privacy-First Encrypted Storage'}
          </span>
        </div>

        {/* Live Submission Status Details if exists */}
        {verification && (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">{lang === 'bn' ? 'জমাকৃত নথি:' : 'Submitted Document:'}</span>
              <span className="font-bold text-neutral-800 uppercase">
                {verification.document_type === 'nid' ? (lang === 'bn' ? 'জাতীয় পরিচয়পত্র' : 'Bangladesh NID') :
                 verification.document_type === 'passport' ? (lang === 'bn' ? 'পাসপোর্ট' : 'Passport') :
                 (lang === 'bn' ? 'ড্রাইভিং লাইসেন্স (BRTA)' : 'Driving License (BRTA)')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">{lang === 'bn' ? 'জমা দেওয়ার তারিখ:' : 'Submission Date:'}</span>
              <span className="font-medium text-neutral-800">{formatDate(verification.created_at)}</span>
            </div>

            {verification.admin_feedback && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 mt-2">
                <span className="font-bold block mb-0.5">{lang === 'bn' ? 'অ্যাডমিন রিভিউ ফিডব্যাক:' : 'Admin Review Feedback:'}</span>
                <p>{verification.admin_feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          {profile?.is_seller_verified || verification?.status === 'approved' ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 size={16} /> {lang === 'bn' ? 'আপনার একাউন্ট ভেরিফায়েড ব্যাজ প্রাপ্ত' : 'Your account has the Identity Verified Badge'}
            </div>
          ) : (
            <Button
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              onClick={() => navigate('/verify-identity')}
            >
              <Shield size={16} />
              {!verification || verification.status === 'rejected'
                ? (lang === 'bn' ? 'বাংলাদেশ আইডেন্টিটি ভেরিফিকেশন শুরু করুন →' : 'Start Bangladesh Identity Verification →')
                : (lang === 'bn' ? 'ভেরিফিকেশন স্টেটাস দেখুন →' : 'View Verification Progress →')}
            </Button>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900">{t('profile.addresses')}</h3>
          <Button variant="outline" size="sm" onClick={() => { setEditingAddress(null); setShowAddressModal(true); setAddrLabel(''); setAddrFull(''); setAddrCity(''); setAddrArea(''); setAddrPhone(''); }}>
            <Plus size={16} /> {t('profile.addAddress')}
          </Button>
        </div>
        {addresses && addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                <MapPin size={18} className="text-neutral-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {addr.label && <span className="text-sm font-medium text-neutral-900">{addr.label}</span>}
                    {addr.is_default && <Badge variant="primary">{t('profile.defaultAddress')}</Badge>}
                  </div>
                  <p className="text-sm text-neutral-600">{addr.full_address}</p>
                  {addr.city && <p className="text-xs text-neutral-500">{addr.city}{addr.area ? `, ${addr.area}` : ''}</p>}
                  {addr.phone && <p className="text-xs text-neutral-500">{addr.phone}</p>}
                </div>
                <div className="flex gap-1">
                  {!addr.is_default && <Button variant="ghost" size="sm" onClick={() => setDefaultAddress(addr.id)}>{t('profile.setAsDefault')}</Button>}
                  <Button variant="ghost" size="sm" className="text-error-500" onClick={() => deleteAddress(addr.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No addresses saved yet.</p>
        )}
      </div>



      {/* Address modal */}
      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title={editingAddress ? t('profile.editAddress') : t('profile.addAddress')}>
        <div className="space-y-4">
          <Input label="Label" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="Home, Office..." />
          <Textarea label="Full Address" value={addrFull} onChange={(e) => setAddrFull(e.target.value)} rows={2} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={t('profile.city')} value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
            <Input label="Area" value={addrArea} onChange={(e) => setAddrArea(e.target.value)} />
          </div>
          <Input label={t('profile.phone')} value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowAddressModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveAddress}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
