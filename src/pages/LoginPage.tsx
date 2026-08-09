import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Input, Button } from '../components/ui';

export function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      // Supabase returns "Email not confirmed" when user hasn't clicked the verification link
      if (
        error.toLowerCase().includes('email not confirmed') ||
        error.toLowerCase().includes('not confirmed')
      ) {
        setErrorMsg(
          'Your email address has not been confirmed yet. Please check your inbox (and Spam folder) and click the confirmation link we sent you.'
        );
      } else if (
        error.toLowerCase().includes('invalid login') ||
        error.toLowerCase().includes('invalid credentials')
      ) {
        setErrorMsg('Incorrect email or password. Please try again.');
      } else {
        setErrorMsg(error);
      }
      toast('Login failed', 'error');
    } else {
      toast('Welcome back!', 'success');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary-500 items-center justify-center mb-4 shadow-lg">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
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
            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              placeholder="••••••••"
            />
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Error box — especially for "email not confirmed" */}
            {errorMsg && (
              <div className="bg-error-50 border border-error-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-error-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-error-700 leading-relaxed">{errorMsg}</p>
                  {errorMsg.toLowerCase().includes('not been confirmed') && (
                    <p className="text-xs text-error-500 mt-1.5">
                      ✉️ Check your <strong>Spam / Junk</strong> folder too. The link expires in 24 hours.
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.signIn')}
            </Button>
          </form>
          <p className="text-center text-sm text-neutral-500 mt-4">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
