import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SuperAdminLoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast('Invalid credentials or access denied.', 'error');
      } else {
        toast('Secure Session Established.', 'success');
        navigate('/superadmin', { replace: true });
      }
    } catch (err: any) {
      toast(err.message || 'An error occurred during authentication.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 relative overflow-hidden">
      {/* Cyber Grid Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.07),transparent)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/30 items-center justify-center mb-4 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <ShieldCheck size={32} className="text-red-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Super Admin Portal</h1>
          <p className="text-xs text-red-500/80 font-mono mt-1 uppercase tracking-widest">Platform Owner Login — Secure Access Only</p>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Secure Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} className="text-gray-500" />}
              required
              className="bg-gray-950 border-gray-800 text-white placeholder-gray-600 focus:border-red-500/50"
              placeholder="admin@recyclehub.com"
            />
            
            <Input
              label="Access Code / Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} className="text-gray-500" />}
              required
              className="bg-gray-950 border-gray-800 text-white placeholder-gray-600 focus:border-red-500/50"
              placeholder="••••••••"
            />

            <Button 
              type="submit" 
              loading={loading} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl border border-red-500/30 transition-all shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_25px_rgba(220,38,38,0.45)]"
              size="lg"
            >
              Verify & Connect
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-800/60 text-center">
            <p className="text-2xs text-gray-500 font-mono">
              SYSTEM IP: LOGGED FOR SECURITY AUDIT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
