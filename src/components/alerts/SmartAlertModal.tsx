import { useState } from 'react';
import { Bell, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../ui/Toast';
import { Button, Input, Modal } from '../ui';

interface SmartAlertModalProps {
  open: boolean;
  onClose: () => void;
  defaultQuery?: string;
  defaultCategory?: string;
  defaultBrand?: string;
}

export function SmartAlertModal({
  open,
  onClose,
  defaultQuery = '',
  defaultCategory = '',
  defaultBrand = '',
}: SmartAlertModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [queryText, setQueryText] = useState(defaultQuery || 'iPhone 13 128GB');
  const [maxPrice, setMaxPrice] = useState('');
  const [brand, setBrand] = useState(defaultBrand);
  const [location, setLocation] = useState('Dhaka');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please sign in to set smart alerts', 'info');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('smart_alerts').insert({
        user_id: user.id,
        query_text: queryText.trim(),
        max_price: maxPrice ? parseFloat(maxPrice) : null,
        brand: brand.trim() || null,
        location: location.trim() || null,
        notify_email: notifyEmail,
        notify_in_app: notifyInApp,
        is_active: true,
      });

      if (error) throw error;

      toast('Smart alert saved! We will notify you when a match appears.', 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to save alert', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Smart Search Alert">
      <form onSubmit={handleSaveAlert} className="space-y-4 text-xs text-neutral-600">
        <div className="p-3 rounded-2xl bg-primary-50 text-primary-900 border border-primary-100 flex items-start gap-2.5">
          <Sparkles size={16} className="text-primary-600 shrink-0 mt-0.5" />
          <p>
            Get notified instantly via Email and In-App alerts when a matching pre-loved listing is posted below your target budget.
          </p>
        </div>

        <Input
          label="Search Keyword / Product Name"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="e.g. iPhone 13 128GB or Gaming Laptop"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Maximum Target Budget (৳)"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g. 45000"
          />
          <Input
            label="Brand (Optional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Apple"
          />
        </div>

        <Input
          label="Preferred City / Area"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Dhaka, Chittagong, or Mirpur"
        />

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-medium text-neutral-800">Email Notification</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyInApp}
              onChange={(e) => setNotifyInApp(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-medium text-neutral-800">In-App Notification Badge</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <Bell size={14} className="mr-1" /> Activate Alert
          </Button>
        </div>
      </form>
    </Modal>
  );
}
