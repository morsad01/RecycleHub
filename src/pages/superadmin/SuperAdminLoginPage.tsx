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
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-xl bg-[#161F30] border border-[#22304A] items-center justify-center mb-4 text-emerald-400">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">Platform Owner Login — Secure Access</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} className="text-slate-400" />}
              required
              className="bg-[#0B0F19] border-[#1F2937] text-white placeholder-slate-500 focus:border-[#0F7A5C]"
              placeholder="admin@resellbd.com"
            />
            
            <Input
              label="Access Code / Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} className="text-gray-500" />}
              required
              className="bg-[#0B0F19] border-[#1F2937] text-white placeholder-slate-500 focus:border-[#0F7A5C]"
              placeholder="••••••••"
            />

            <Button 
              type="submit" 
              loading={loading} 
              className="w-full bg-[#0F7A5C] hover:bg-[#0D6B50] text-white font-medium py-2.5 rounded-lg transition-colors"
              size="lg"
            >
              Verify & Connect
            </Button>
          </form>
          
          <div className="mt-5 pt-5 border-t border-[#1F2937] text-center">
            <p className="text-xs text-slate-500 font-mono">
              SYSTEM IP: LOGGED FOR SECURITY AUDIT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
