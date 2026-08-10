import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Input, Button } from '../components/ui';
import logoImg from '../Image/logo.jpeg';

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
          <Link to="/" className="inline-block group mb-3">
            <img
              src={logoImg}
              alt="ResellBD Logo"
              className="w-16 h-16 object-contain rounded-2xl shadow-md mx-auto group-hover:scale-105 transition-transform"
            />
          </Link>
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
