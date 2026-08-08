import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { 
  Sparkles, Heart, GraduationCap, Music, Tv, 
  Check, QrCode, MessageSquare, ShieldCheck, 
  Download, Palette, Smartphone, Zap, ArrowRight, 
  FolderArchive, Users, Smile, ExternalLink, LogIn, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  session: Session | null;
}

interface SimulatedEmoji {
  id: number;
  char: string;
  x: number;
  scale: number;
  duration: number;
}

const ROLES = [
  {
    id: 'djs',
    name: 'DJs & Animadores',
    roleTitle: 'El complemento visual perfecto para tu cabina',
    description: 'Ofrece una experiencia visual integrada y fluida. Abre la pantalla en una ventana independiente, arrástrala a la salida de video (pantalla LED, proyector o TV) y ponla en pantalla completa. Controla el contenido desde tu laptop o celular sin interrumpir tu set.',
    highlight: 'Moderación en vivo simplificada y control de velocidad.',
    icon: Music,
    color: 'from-blue-500 to-indigo-600',
    mockupBg: 'lights',
    mockupType: 'message',
    mockupText: '¡Sigan bailando! Siguiente tanda en 5 minutos... 🎧🔥',
    mockupUser: 'DJ Gonza'
  },
  {
    id: 'led_screens',
    name: 'Proveedores de Pantallas',
    roleTitle: 'Aumenta el valor de tu equipamiento',
    description: 'Convierte tus pantallas estáticas en un centro interactivo de entretenimiento. Agrega SnapShow como un servicio premium adicional para tus clientes. Promociona tu marca subiendo tu logo fijo que se mostrará junto al código QR durante todo el evento.',
    highlight: 'Branding personalizado del proveedor en pantalla gigante.',
    icon: Tv,
    color: 'from-purple-500 to-pink-600',
    mockupBg: 'mesh',
    mockupType: 'photo',
    mockupImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600',
    mockupText: '⚡ LED Pro Rent - Pantallas e Iluminación ⚡'
  },
  {
    id: 'weddings',
    name: 'Novios & Bodas',
    roleTitle: 'Captura cada rincón de tu noche especial',
    description: 'Tus invitados serán tus fotógrafos espontáneos. Captura los brindis en las mesas, el baile y los momentos que el fotógrafo profesional no llega a ver. Deja que todos envíen sus dedicatorias de amor y felicitaciones directamente a la pantalla gigante.',
    highlight: 'Descarga ZIP completa de todo el material al finalizar.',
    icon: Heart,
    color: 'from-stone-400 to-stone-600',
    mockupBg: 'gold',
    mockupType: 'photo',
    mockupImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
    mockupText: '¡Vivan los novios! Sofía & Nacho 💍❤️'
  },
  {
    id: 'quinces',
    name: 'Quinceañeras',
    roleTitle: 'La máxima interacción con tus amigos',
    description: 'La diversión que los jóvenes aman. Permite que tus invitados suban sus selfies de la pista y videos cortos de hasta 6 segundos directamente desde la cámara de su celular. Interactúa con una lluvia constante de emojis y reacciones flotantes en pantalla.',
    highlight: 'Soporte de videos nativo y emojis flotantes interactivos.',
    icon: Sparkles,
    color: 'from-pink-500 to-purple-600',
    mockupBg: 'quince',
    mockupType: 'photo',
    mockupImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=600',
    mockupText: 'Mis 15 de Cami! 🎉👑'
  },
  {
    id: 'instituciones',
    name: 'Corporativos & Escuelas',
    roleTitle: 'Fomenta la participación comunitaria',
    description: 'La opción ideal para fiestas de egresados, graduaciones, cenas de fin de año o aniversarios institucionales. Conecta a una gran audiencia en el salón de eventos proyectando saludos masivos, con total seguridad gracias a la moderación inteligente.',
    highlight: 'Perfecto para egresados y celebraciones institucionales.',
    icon: GraduationCap,
    color: 'from-emerald-500 to-teal-700',
    mockupBg: 'stars',
    mockupType: 'message',
    mockupText: '¡Felicitaciones Promo 2026! Éxitos en esta nueva etapa 🎓✨',
    mockupUser: 'Rectoría'
  }
];

const THEME_STYLES: Record<string, string> = {
  aurora: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
  lights: 'bg-gradient-to-br from-blue-950 via-neutral-900 to-pink-950 border-pink-500/20',
  gold: 'bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950',
  stars: 'bg-[#030712] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-neutral-950 to-black',
  mesh: 'bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950'
};

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const AuroraBackground = ({ children, className = '' }: AuroraBackgroundProps) => {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#070708] w-full ${className}`}>
      {/* Aurora Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base aurora layer */}
        <div className="absolute inset-0 opacity-70">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-950/40 via-purple-950/30 to-indigo-950/40"></div>
        </div>
        
        {/* Animated aurora waves */}
        <div className="absolute inset-0">
          {/* Wave 1 */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse 800px 600px at 50% 20%, rgba(59, 130, 246, 0.25) 0%, transparent 50%)',
              animation: 'aurora1 12s ease-in-out infinite alternate'
            }}
          ></div>
          
          {/* Wave 2 */}
          <div 
            className="absolute inset-0 opacity-55"
            style={{
              background: 'radial-gradient(ellipse 600px 400px at 80% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              animation: 'aurora2 9s ease-in-out infinite alternate-reverse'
            }}
          ></div>
          
          {/* Wave 3 */}
          <div 
            className="absolute inset-0 opacity-45"
            style={{
              background: 'radial-gradient(ellipse 700px 500px at 20% 60%, rgba(236, 72, 153, 0.25) 0%, transparent 50%)',
              animation: 'aurora3 14s ease-in-out infinite alternate'
            }}
          ></div>
          
          {/* Wave 4 */}
          <div 
            className="absolute inset-0 opacity-35"
            style={{
              background: 'radial-gradient(ellipse 900px 300px at 60% 80%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)',
              animation: 'aurora4 10s ease-in-out infinite alternate-reverse'
            }}
          ></div>
        </div>
        
        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070708]/40 via-transparent to-[#070708]/20"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes aurora1 {
          0% { transform: translateX(-100px) translateY(-50px) rotate(0deg) scale(1); }
          50% { transform: translateX(50px) translateY(30px) rotate(180deg) scale(1.1); }
          100% { transform: translateX(100px) translateY(-30px) rotate(360deg) scale(0.9); }
        }
        
        @keyframes aurora2 {
          0% { transform: translateX(80px) translateY(40px) rotate(45deg) scale(0.8); }
          50% { transform: translateX(-30px) translateY(-20px) rotate(225deg) scale(1.2); }
          100% { transform: translateX(-80px) translateY(60px) rotate(405deg) scale(0.9); }
        }
        
        @keyframes aurora3 {
          0% { transform: translateX(-50px) translateY(20px) rotate(90deg) scale(1.1); }
          50% { transform: translateX(70px) translateY(-40px) rotate(270deg) scale(0.8); }
          100% { transform: translateX(-20px) translateY(50px) rotate(450deg) scale(1.0); }
        }
        
        @keyframes aurora4 {
          0% { transform: translateX(30px) translateY(-20px) rotate(135deg) scale(0.9); }
          50% { transform: translateX(-60px) translateY(10px) rotate(315deg) scale(1.1); }
          100% { transform: translateX(40px) translateY(-60px) rotate(495deg) scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export const LandingPage = ({ session }: LandingPageProps) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(ROLES[2]); // Weddings default
  const [simulatedTheme, setSimulatedTheme] = useState('aurora');
  const [emojis, setEmojis] = useState<SimulatedEmoji[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Emojis flotantes simulados
  useEffect(() => {
    const chars = ['❤️', '🔥', '😂', '🙌', '👏', '🎉', '🥂', '👑', '✨'];
    const interval = setInterval(() => {
      const newEmoji: SimulatedEmoji = {
        id: Date.now() + Math.random(),
        char: chars[Math.floor(Math.random() * chars.length)],
        x: Math.random() * 80 + 10, // 10% a 90%
        scale: Math.random() * 0.6 + 0.8, // 0.8 a 1.4
        duration: Math.random() * 3 + 3 // 3s a 6s
      };
      setEmojis(prev => [...prev.slice(-15), newEmoji]);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Cambiar slides del mockup automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccessClick = () => {
    if (session) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  return (
    <AuroraBackground className="text-white font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-[#070708]/60">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/hero_phone.png" alt="Logo" className="h-14 md:h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:scale-105 transition-transform duration-300 relative z-10" />
            <img src="/logo_text.png" alt="SnapShow" className="-ml-3 md:-ml-4 h-14 md:h-20 w-auto object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/60">
            <a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
            <a href="#simulador" className="hover:text-white transition-colors">Simulador</a>
          </nav>

          <button 
            onClick={handleAccessClick}
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-bold text-sm transition-all flex items-center gap-2 group active:scale-95"
          >
            {session ? (
              <>
                <Laptop size={16} className="text-indigo-400" />
                <span>Ir al Panel</span>
              </>
            ) : (
              <>
                <LogIn size={16} className="text-indigo-400" />
                <span>Acceso Clientes</span>
              </>
            )}
            <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 md:py-32 grid md:grid-cols-12 gap-12 items-center">
        {/* Left Info */}
        <div className="md:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-bold text-indigo-300 tracking-wider uppercase">
            <Zap size={12} className="fill-indigo-300 animate-bounce" />
            <span>Proyecciones Interactivas Pro v3.0</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
            Tu fiesta en la <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              pantalla gigante
            </span> <br />
            en tiempo real.
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl">
            Conecta a tus invitados con el evento. Permite que suban fotos, videos cortos y mensajes dedicatorios directo a la pantalla. <strong className="text-white font-semibold">Sin descargas ni registros</strong>, escaneando un simple código QR.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button 
              onClick={handleAccessClick}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95"
            >
              <span>{session ? 'Ir a mi Panel de Control' : 'Crear mi Evento / Iniciar Sesión'}</span>
              <ArrowRight size={18} />
            </button>
            <a 
              href="#simulador"
              className="px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-bold text-base text-center transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Ver Demo Interactiva</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 max-w-lg">
            <div>
              <span className="block text-3xl font-black text-indigo-400">0s</span>
              <span className="text-xs text-neutral-500 uppercase font-semibold">Retraso de Envío</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-purple-400">100%</span>
              <span className="text-xs text-neutral-500 uppercase font-semibold">Web (Sin Apps)</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-pink-400">HD</span>
              <span className="text-xs text-neutral-500 uppercase font-semibold">Calidad de Imagen</span>
            </div>
          </div>
        </div>

        {/* Right Product Mockup */}
        <div className="md:col-span-5 relative w-full flex justify-center">
          <div className="relative w-full max-w-[520px] aspect-[16/10] bg-[#101011] rounded-[24px] p-2 border border-white/10 shadow-2xl shadow-black/80 z-20 group">
            {/* Pantalla Gigante Simulada */}
            <div className={`w-full h-full rounded-[18px] relative overflow-hidden transition-all duration-700 ${THEME_STYLES[simulatedTheme]}`}>
              <div className="absolute inset-0 bg-black/15 z-[5]" />

              {/* Floating Emojis Layer */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {emojis.map(e => (
                  <motion.span
                    key={e.id}
                    initial={{ y: 20, opacity: 0, scale: 0.5 }}
                    animate={{ y: -320, opacity: [0, 1, 1, 0], scale: [0.5, e.scale, e.scale, 0.7] }}
                    transition={{ duration: e.duration, ease: "easeOut" }}
                    style={{ left: `${e.x}%` }}
                    className="absolute bottom-0 text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                  >
                    {e.char}
                  </motion.span>
                ))}
              </div>

              {/* Logo en Pantalla */}
              <div className="absolute top-3 left-4 z-10 opacity-75">
                <span className="font-black text-sm tracking-tighter text-white">SnapShow</span>
              </div>

              {/* QR Code Container */}
              <div className="absolute bottom-3 right-4 z-10 bg-black/60 p-1.5 rounded-xl border border-white/10 flex flex-col items-center gap-0.5">
                <div className="w-12 h-12 bg-white rounded p-0.5 flex items-center justify-center">
                  <QrCode size={40} className="text-black" />
                </div>
                <span className="text-[5px] uppercase font-black tracking-widest text-white/50">¡ESCANEA!</span>
              </div>

              {/* Slide Activo */}
              <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
                <AnimatePresence mode="wait">
                  {activeSlideIndex === 0 && (
                    <motion.div 
                      key="slide-1"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="w-full max-w-[260px] bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg bg-indigo-500/10 border border-white/5 flex items-center justify-center overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=300" 
                          alt="Wedding Party"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <p className="text-[8px] font-black text-center text-indigo-200 tracking-wide uppercase">¡Qué gran noche! 🎉🕺</p>
                    </motion.div>
                  )}

                  {activeSlideIndex === 1 && (
                    <motion.div 
                      key="slide-2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="w-full max-w-[280px] bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3 relative"
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-neutral-300">
                        <MessageSquare className="text-black" size={12} />
                      </div>
                      <div className="flex-1 text-center pt-1.5">
                        <p className="text-[10px] font-bold text-neutral-200 italic leading-snug">"¡Te queremos mucho Cami! Que disfrutes tus 15 de corazón 👑💖"</p>
                        <p className="text-[7px] font-black uppercase text-indigo-400 mt-1.5 tracking-wider">— Lucía & Mati</p>
                      </div>
                    </motion.div>
                  )}

                  {activeSlideIndex === 2 && (
                    <motion.div 
                      key="slide-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="w-full max-w-[260px] bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg bg-pink-500/10 border border-white/5 flex items-center justify-center overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=300" 
                          alt="Party Crowd"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <p className="text-[8px] font-black text-center text-pink-300 tracking-wide uppercase">⚡ EVENTO EN VIVO ⚡</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Soporte de la pantalla simulado */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-gradient-to-b from-neutral-800 to-neutral-900 border-x border-b border-white/5 rounded-b-xl z-10 flex items-center justify-center">
              <div className="w-[12px] h-[4px] bg-indigo-500/50 rounded-full animate-ping" />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS SEGMENTADOS POR ROL */}
      <section id="beneficios" className="py-24 bg-transparent border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Adaptabilidad Total</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight font-sans">
              Diseñado para cada protagonista de la noche
            </h2>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              Ya seas quien organiza la música, el proveedor de la pantalla LED o el homenajeado de la fiesta, SnapShow eleva la experiencia visual de tu evento.
            </p>
          </div>

          {/* Selector de Roles */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-16">
            {ROLES.map(role => {
              const Icon = role.icon;
              const isSelected = selectedRole.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role);
                    setSimulatedTheme(role.mockupBg);
                  }}
                  className={`px-5 py-3 rounded-2xl border font-bold text-sm transition-all flex items-center gap-2.5 active:scale-95 ${
                    isSelected 
                      ? 'bg-white/10 border-white/20 text-white shadow-xl shadow-black/35' 
                      : 'bg-white/5 border-white/5 text-white/55 hover:text-white/80 hover:bg-white/15'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-indigo-400' : 'text-neutral-500'} />
                  <span>{role.name}</span>
                </button>
              );
            })}
          </div>

          {/* Caja Detalle de Beneficio */}
          <div className="glass p-8 md:p-12 rounded-[32px] border border-white/5 bg-gradient-to-br from-white/[0.02] to-white/[0.01] grid md:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Detalle Texto */}
            <div className="md:col-span-7 space-y-6 text-left">
              <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                Perfil: {selectedRole.name}
              </span>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                {selectedRole.roleTitle}
              </h3>
              <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                {selectedRole.description}
              </p>
              
              <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <Check className="text-indigo-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-semibold text-indigo-200">
                  <strong className="text-white">Ventaja principal:</strong> {selectedRole.highlight}
                </p>
              </div>
            </div>

            {/* Detalle Previsualización Dinámica */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-[280px] aspect-[3/4] bg-[#0c0c0d] rounded-3xl p-1.5 border border-white/5 shadow-xl relative overflow-hidden group">
                {/* Pantalla Simulada en Previsualización */}
                <div className={`w-full h-full rounded-[18px] relative overflow-hidden transition-all duration-700 ${THEME_STYLES[selectedRole.mockupBg]}`}>
                  <div className="absolute inset-0 bg-black/25 z-[5]" />
                  
                  {/* Floating Emojis Layer */}
                  <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-50">
                    <span className="absolute bottom-4 left-6 text-2xl animate-bounce">❤️</span>
                    <span className="absolute bottom-16 right-10 text-xl animate-pulse">🔥</span>
                    <span className="absolute bottom-32 left-16 text-2xl">🎉</span>
                  </div>

                  <div className="absolute top-3 left-4 z-10">
                    <span className="text-[10px] font-black tracking-tighter text-white/50 uppercase">Preview</span>
                  </div>

                  {/* Mock content representation */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                    {selectedRole.mockupType === 'photo' ? (
                      <div className="w-full flex flex-col gap-2">
                        <div className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-lg">
                          <img 
                            src={selectedRole.mockupImage} 
                            alt="Mockup Slide"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-wide leading-tight">
                          {selectedRole.mockupText}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col gap-2 relative">
                        <MessageSquare className="text-indigo-400 mx-auto" size={20} />
                        <p className="text-[11px] font-bold text-white italic leading-snug">
                          "{selectedRole.mockupText}"
                        </p>
                        <span className="text-[7px] font-black uppercase text-indigo-400 tracking-wider">
                          — {selectedRole.mockupUser}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QR Overlay en Mockup */}
                  <div className="absolute bottom-3 right-3 z-10 bg-black/85 p-1 rounded-lg border border-white/10">
                    <QrCode size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS / FEATURES GRID */}
      <section id="caracteristicas" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Herramientas Potentes</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Todo lo necesario para una noche inolvidable
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            SnapShow incluye herramientas diseñadas tanto para agilizar la logística del DJ como para maximizar la diversión e interacción de los invitados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 w-fit">
              <Smartphone size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">Sin descargas de Apps</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Los invitados escanean el código QR y suben fotos o videos directamente desde el navegador móvil de su celular. Funciona al instante en iOS y Android sin registros previos.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 w-fit">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">Moderación en Tiempo Real</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Tú decides cómo se proyecta. Activa el "Auto-Approve" para que el contenido se publique inmediatamente, o modera de forma manual aprobando cada foto antes de que salga en pantalla.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-400 w-fit">
              <Smile size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">Reacciones de Emojis</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Los invitados no solo suben fotos: pueden enviar reacciones de emojis en vivo (❤️, 🔥, 😂) que flotan en la pantalla sobre las fotos en tiempo real, aumentando la participación.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 w-fit">
              <Download size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">Generador de Flyers QR</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Genera automáticamente un flyer A4 imprimible con el código QR único del evento. Dóblalo en forma de soporte de mesa y colócalo en mesas o la barra para invitar a la participación.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 w-fit">
              <FolderArchive size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">Descarga Completa ZIP</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Al terminar la noche, puedes descargar todas las fotos y videos aprobados en un solo archivo ZIP comprimido. Entrégaselo a tus clientes como un libro de recuerdos digital premium.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 w-fit">
              <Palette size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">Temas y Branding Temáticos</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Personaliza el fondo de la proyección con transiciones elegantes (Aurora, Neón, Estrellas, Mesh) o reproduce videos HD en bucle. Carga el logo personalizado de la marca o salón.
            </p>
          </div>
        </div>
      </section>

      {/* SIMULADOR DE TEMAS INTERACTIVO */}
      <section id="simulador" className="py-24 bg-transparent border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Controls */}
          <div className="md:col-span-6 space-y-8 text-left">
            <div className="space-y-4">
              <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Demo Interactiva</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Simula el fondo de tu pantalla en vivo
              </h2>
              <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                Prueba cómo lucirá la pantalla gigante de tu fiesta. Selecciona uno de nuestros temas integrados para cambiar al instante el estilo visual y el color del mockup de la derecha.
              </p>
            </div>

            {/* Grid de Temas */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[
                { id: 'aurora', label: 'Aurora', desc: 'Degradado cósmico', color: 'from-blue-600 to-purple-600' },
                { id: 'lights', label: 'Neón', desc: 'Estilo discoteca', color: 'from-pink-600 to-blue-500' },
                { id: 'gold', label: 'Festivo', desc: 'Oro y sofisticación', color: 'from-amber-600 to-yellow-500' },
                { id: 'stars', label: 'Estrellas', desc: 'Espacio y elegancia', color: 'from-slate-900 to-slate-950 border border-white/10' },
                { id: 'mesh', label: 'Mesh', desc: 'Moderna mezcla', color: 'from-purple-600 to-pink-500' }
              ].map((theme) => {
                const isSelected = simulatedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSimulatedTheme(theme.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 active:scale-95 ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white/5' 
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-2 rounded bg-gradient-to-r ${theme.color} mb-1`} />
                    <span className="text-sm font-bold text-white">{theme.label}</span>
                    <span className="text-[10px] text-neutral-500 font-semibold">{theme.desc}</span>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check size={10} className="text-white font-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="pt-2">
              <button 
                onClick={handleAccessClick}
                className="px-6 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <span>Crear Evento con este Estilo</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Right Mockup Display */}
          <div className="md:col-span-6 flex justify-center">
            <div className="w-full max-w-[480px] aspect-[16/10] bg-[#121213] rounded-[28px] p-2.5 border border-white/10 shadow-2xl shadow-black/90 relative group">
              {/* Pantalla Simulada en Simulador */}
              <div className={`w-full h-full rounded-[20px] relative overflow-hidden transition-all duration-1000 ${THEME_STYLES[simulatedTheme]}`}>
                <div className="absolute inset-0 bg-black/15 z-[5]" />

                {/* Floating Emojis Layer */}
                <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                  {emojis.slice(-8).map(e => (
                    <motion.span
                      key={`sim-${e.id}`}
                      initial={{ y: 20, opacity: 0, scale: 0.5 }}
                      animate={{ y: -320, opacity: [0, 1, 1, 0], scale: [0.5, e.scale, e.scale, 0.7] }}
                      transition={{ duration: e.duration, ease: "easeOut" }}
                      style={{ left: `${e.x}%` }}
                      className="absolute bottom-0 text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                    >
                      {e.char}
                    </motion.span>
                  ))}
                </div>

                {/* Event Name & Header */}
                <div className="absolute top-4 left-5 z-10 flex flex-col">
                  <span className="text-[8px] uppercase tracking-[0.2em] font-extrabold text-indigo-400">Diseño en Vivo</span>
                  <span className="font-black text-sm tracking-tight text-white uppercase">MEGA EVENTO 2026</span>
                </div>

                {/* QR Code Container */}
                <div className="absolute bottom-4 right-5 z-10 bg-black/60 p-2 rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                  <div className="w-14 h-14 bg-white rounded-lg p-0.5 flex items-center justify-center">
                    <QrCode size={48} className="text-black" />
                  </div>
                  <span className="text-[6px] uppercase font-black tracking-widest text-indigo-300">PARTICIPAR</span>
                </div>

                {/* Main Content (Photo + Message mock combo) */}
                <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
                  <div className="w-full max-w-[240px] bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-2xl">
                    <div className="w-full aspect-[4/3] rounded-2xl bg-indigo-500/10 border border-white/5 overflow-hidden relative">
                      <img 
                        src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=400" 
                        alt="Party Celebration"
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[7px] font-black uppercase text-indigo-300 tracking-wider">Foto de Invitado</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-neutral-200">"¡Una fiesta mágica, gracias por invitarnos! 🥂✨"</p>
                      <p className="text-[6px] font-black uppercase text-indigo-400 mt-1 tracking-widest">— Familia Rodríguez</p>
                    </div>
                  </div>
                </div>

                {/* Badge del Tema seleccionado */}
                <div className="absolute bottom-4 left-5 z-10 px-3 py-1.5 rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm text-[8px] font-bold uppercase tracking-widest text-indigo-300">
                  Tema: {simulatedTheme}
                </div>
              </div>
              
              {/* Soporte de la pantalla simulado */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-gradient-to-b from-neutral-800 to-neutral-900 border-x border-b border-white/5 rounded-b-xl z-10 flex items-center justify-center">
                <div className="w-[12px] h-[4px] bg-indigo-500/50 rounded-full animate-ping" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 max-w-5xl mx-auto px-6 text-center relative">
        <div className="glass p-12 md:p-20 rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] relative overflow-hidden">
          {/* Light flare */}
          <div className="absolute -top-[50%] left-[50%] -translate-x-1/2 w-[60%] aspect-square bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              ¿Listo para encender tu pantalla?
            </h2>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              Crea tu evento en segundos y ofrece una experiencia interactiva sin fricciones que tus invitados recordarán para siempre.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={handleAccessClick}
                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95"
              >
                <span>{session ? 'Ir a mi Panel de Control' : 'Crear mi Evento / Iniciar Sesión'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-[#050506]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-0">
            <img src="/hero_phone.png" alt="Logo" className="h-10 w-auto object-contain relative z-10" />
            <img src="/logo_text.png" alt="SnapShow" className="-ml-2 h-12 w-auto object-contain" />
            <span className="text-[8px] block font-bold text-white/40 uppercase tracking-widest leading-none ml-3">© 2026</span>
          </div>

          <div className="flex gap-8 text-xs font-semibold text-white/40">
            <a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
            <a href="#simulador" className="hover:text-white transition-colors">Simulador</a>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Desarrollado por <span className="text-white/55">Digimedios Apps</span>
            </p>
          </div>
        </div>
      </footer>
    </AuroraBackground>
  );
};
