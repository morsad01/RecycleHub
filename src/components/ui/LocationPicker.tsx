import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { getDivisions, getDistricts, getUpazilas } from '../../lib/bd-locations';
import { Input } from './Input';

interface LocationPickerProps {
  value: {
    division?: string | null;
    district?: string | null;
    upazila?: string | null;
    area?: string | null;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  onChange: (value: any) => void;
  error?: string;
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const { lang, t } = useI18n();
  const [divisions] = useState(getDivisions());
  const [districts, setDistricts] = useState(getDistricts(value.division || undefined));
  const [upazilas, setUpazilas] = useState(getUpazilas(value.district || undefined));
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setDistricts(getDistricts(value.division || undefined));
    if (!value.division) {
      onChange({ ...value, district: null, upazila: null });
    }
  }, [value.division]);

  useEffect(() => {
    setUpazilas(getUpazilas(value.district || undefined));
    if (!value.district) {
      onChange({ ...value, upazila: null });
    }
  }, [value.district]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('location.geolocationNotSupported') || 'Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...value,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert(t('location.geolocationError') || 'Failed to get current location');
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('location.division') || 'Division'}
          </label>
          <select
            className="w-full h-11 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            value={value.division || ''}
            onChange={(e) => onChange({ ...value, division: e.target.value })}
          >
            <option value="">{t('location.selectDivision') || 'Select Division'}</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {lang === 'bn' ? d.bn_name : d.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('location.district') || 'District'}
          </label>
          <select
            className="w-full h-11 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:opacity-50"
            value={value.district || ''}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
            disabled={!value.division}
          >
            <option value="">{t('location.selectDistrict') || 'Select District'}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {lang === 'bn' ? d.bn_name : d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('location.upazila') || 'Upazila/Thana'}
          </label>
          <select
            className="w-full h-11 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:opacity-50"
            value={value.upazila || ''}
            onChange={(e) => onChange({ ...value, upazila: e.target.value })}
            disabled={!value.district}
          >
            <option value="">{t('location.selectUpazila') || 'Select Upazila/Thana'}</option>
            {upazilas.map((u) => (
              <option key={u.id} value={u.id}>
                {lang === 'bn' ? u.bn_name : u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('location.postalCode') || 'Postal Code'}
          </label>
          <Input
            type="text"
            placeholder={t('location.postalCodePlaceholder') || 'e.g. 1205'}
            value={value.postal_code || ''}
            onChange={(e) => onChange({ ...value, postal_code: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {t('location.area') || 'Specific Area/Address Details'}
        </label>
        <Input
          type="text"
          placeholder={t('location.areaPlaceholder') || 'e.g. Road 12, Block C, Banani'}
          value={value.area || ''}
          onChange={(e) => onChange({ ...value, area: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
          ) : (
            <Navigation size={16} />
          )}
          {t('location.useCurrentLocation') || 'Use my current location'}
        </button>
        {value.latitude && value.longitude && (
          <span className="text-xs text-success-600 flex items-center gap-1">
            <MapPin size={12} />
            Location captured
          </span>
        )}
      </div>
      
      {error && <p className="text-sm text-error-600 mt-1">{error}</p>}
    </div>
  );
}
