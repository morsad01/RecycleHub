import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Input, Button } from '../components/ui';
import logoImg from '../Image/logo.jpeg';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast(error, 'error');
    } else {
      setSent(true);
      toast('Reset link sent!', 'success');
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
          <h1 className="text-2xl font-bold text-neutral-900">{t('auth.forgotTitle')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('auth.forgotSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm text-neutral-600 mb-4">Check your email for a password reset link.</p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
                <ArrowLeft size={16} /> {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={18} />}
                required
                placeholder="you@example.com"
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t('auth.sendResetLink')}
              </Button>
            </form>
          )}
          {!sent && (
            <p className="text-center text-sm text-neutral-500 mt-4">
              <Link to="/login" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700">
                <ArrowLeft size={14} /> {t('auth.backToLogin')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
