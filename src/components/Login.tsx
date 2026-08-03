import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative">
      <div className="floating-light" style={{ top: '20%', left: '20%' }}></div>
      <div className="floating-light" style={{ bottom: '20%', right: '20%', animationDelay: '2s' }}></div>
      
      <div className="glass w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center gap-0 mb-4">
            {/* Logo (Arriba) */}
            <img src="/hero_phone.png" alt="Logo" style={{ height: '152px' }} className="w-auto object-contain drop-shadow-[0_0_25px_rgba(99,102,241,0.3)]" />
            {/* Logotipo (Abajo) */}
            <img src="/logo_text.png" alt="SnapShow" style={{ height: '88px', marginTop: '-20px' }} className="w-auto object-contain" />
          </div>
          <p className="text-white/40 text-sm">SaaS de Proyección para Eventos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
          </button>
        </form>

        <footer className="mt-12 text-center relative">
          <div className="h-[1px] w-12 bg-white/10 mx-auto mb-6" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 drop-shadow-lg">
              © SnapShow <span className="text-indigo-500/60">2026</span>
            </p>
            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
              POWERED BY <span className="text-white/30">DIGIMEDIOS APPS</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
