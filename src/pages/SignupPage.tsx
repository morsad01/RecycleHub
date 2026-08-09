import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Input, Button } from '../components/ui';
import logoImg from '../Image/logo.jpeg';

export function SignupPage() {
  const { signUp } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // State to show the email confirmation screen
  const [signupDone, setSignupDone] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      setError(error);
      toast(error, 'error');
    } else {
      // Show the email confirmation banner — do NOT navigate away
      setSubmittedEmail(email);
      setSignupDone(true);
    }
  };

  // ── Email Confirmation Screen ─────────────────────────────────────────────
  if (signupDone) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            {/* Success icon */}
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-emerald-500" />
            </div>

            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Account Created! 🎉
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              We sent a <strong className="text-neutral-700">confirmation email</strong> to:
            </p>

            {/* Email highlight box */}
            <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 justify-center">
              <Mail size={16} className="text-primary-600 shrink-0" />
              <span className="font-semibold text-primary-800 text-sm break-all">{submittedEmail}</span>
            </div>

            {/* Step-by-step instructions */}
            <div className="bg-neutral-50 rounded-xl p-4 text-left mb-6 space-y-3">
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">What to do next:</p>
              {[
                { step: '1', text: 'Open your email inbox (check Spam/Junk too)' },
                { step: '2', text: 'Find the email from ResellBD' },
                { step: '3', text: 'Click the "Confirm your email" button' },
                { step: '4', text: 'Come back and log in!' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <span className="text-sm text-neutral-600">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Warning note */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-xs text-amber-700 leading-relaxed">
                ⚠️ <strong>Important:</strong> You <strong>cannot log in</strong> until you verify your email. 
                The confirmation link expires in <strong>24 hours</strong>.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Go to Login <ArrowRight size={16} />
            </Link>

            <p className="text-xs text-neutral-400 mt-4">
              Didn't receive the email?{' '}
              <button
                onClick={() => setSignupDone(false)}
                className="text-primary-600 hover:underline font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal Signup Form ────────────────────────────────────────────────────
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
          <h1 className="text-2xl font-bold text-neutral-900">{t('auth.signupTitle')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('auth.signupSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.fullName')}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User size={18} />}
              required
              placeholder="Your full name"
            />
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
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              placeholder="••••••••"
            />

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-xl px-4 py-3">
                <p className="text-sm text-error-600">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.signUp')}
            </Button>
          </form>

          {/* Email notice hint at the bottom of the form */}
          <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
            <Mail size={14} className="shrink-0 mt-0.5" />
            <span>
              After signing up, you'll receive a <strong>confirmation email</strong>. 
              Click the link in that email to activate your account.
            </span>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-4">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
