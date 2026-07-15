import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, MapPin, Plus, Trash2, Star, Upload, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button, Input, Textarea, Badge, Avatar, Modal } from '../components/ui';
import type { Address, SellerVerification } from '../types';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [saving, setSaving] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [nidNumber, setNidNumber] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');
  const [nidImage, setNidImage] = useState<string | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrFull, setAddrFull] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrPhone, setAddrPhone] = useState('');

  const { data: verification } = useQuery({
    queryKey: ['my-verification'],
    queryFn: async () => {
      const { data } = await supabase
        .from('seller_verifications')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as SellerVerification | null;
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
    const path = `${user.id}/avatar.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      refreshProfile();
      toast('Avatar updated', 'success');
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

  const submitVerification = async () => {
    if (!user) return;
    setSubmittingVerification(true);
    const nidImageUrl = nidImage;
    if (nidImage === null && nidImage !== undefined) {
      // No new image uploaded
    }
    await supabase.from('seller_verifications').insert({
      seller_id: user.id,
      nid_number: nidNumber,
      nid_image_url: nidImageUrl,
      business_info: businessInfo,
    });
    setSubmittingVerification(false);
    setShowVerification(false);
    setNidNumber('');
    setBusinessInfo('');
    setNidImage(null);
    queryClient.invalidateQueries({ queryKey: ['my-verification'] });
    toast('Verification submitted! We\'ll review it shortly.', 'success');
  };

  const uploadNidImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    const file = e.target.files[0];
    const path = `${user.id}/nid-${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setNidImage(publicUrl);
    }
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
    toast('Address saved', 'success');
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

      {/* Seller verification */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
            <Shield size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">{t('profile.becomeVerified')}</h3>
            <p className="text-sm text-neutral-500 mt-1">{t('profile.verificationDesc')}</p>
            {verification && (
              <div className="mt-2">
                <Badge variant={verification.status === 'approved' ? 'success' : verification.status === 'rejected' ? 'error' : 'warning'}>
                  {t('profile.verificationStatus')}: {verification.status}
                </Badge>
              </div>
            )}
            {!verification || verification.status === 'rejected' ? (
              <Button variant="outline" className="mt-3" onClick={() => setShowVerification(true)}>
                {t('profile.submitVerification')}
              </Button>
            ) : null}
          </div>
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

      {/* Verification modal */}
      <Modal open={showVerification} onClose={() => setShowVerification(false)} title={t('profile.becomeVerified')}>
        <div className="space-y-4">
          <Input label={t('profile.nidNumber')} value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="NID number" />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('profile.uploadNid')}</label>
            <input type="file" accept="image/*" onChange={uploadNidImage} className="block w-full text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            {nidImage && <p className="text-xs text-success-600 mt-1 flex items-center gap-1"><Check size={12} /> Uploaded</p>}
          </div>
          <Textarea label={t('profile.businessInfo')} value={businessInfo} onChange={(e) => setBusinessInfo(e.target.value)} rows={3} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowVerification(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitVerification} loading={submittingVerification}>{t('profile.submitVerification')}</Button>
          </div>
        </div>
      </Modal>

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
