import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Input, Button } from '../components/ui';

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast(error, 'error');
    } else {
      toast('Password updated successfully!', 'success');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary-500 items-center justify-center mb-4 shadow-lg">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('auth.resetTitle') ?? 'Reset Password'}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('auth.resetSubtitle') ?? 'Enter your new password below'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.newPassword') ?? 'New Password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              placeholder="••••••••"
            />
            <Input
              label={t('auth.confirmPassword') ?? 'Confirm Password'}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              placeholder="••••••••"
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.updatePassword') ?? 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
