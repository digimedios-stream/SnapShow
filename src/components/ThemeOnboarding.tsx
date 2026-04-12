import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sparkles, Check, PartyPopper, Heart, GraduationCap, Music, Calendar, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const THEME_CONFIG: Record<string, string[]> = {
  quince: [
    'linear-gradient(135deg, #2d1b4e 0%, #1a1a1a 100%)',
    'radial-gradient(circle at center, #4c1d95 0%, #000000 100%)',
    'linear-gradient(45deg, #1e1b4b 0%, #312e81 100%)',
    'conic-gradient(from 180deg at 50% 50%, #1a1033 0%, #3b0764 100%)'
  ],
  wedding: [
    'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)',
    'radial-gradient(circle at 50% 50%, #1c1917 0%, #0c0a09 100%)',
    'linear-gradient(to right, #0f172a, #1e293b)',
    'radial-gradient(ellipse at bottom, #1e1b4b 0%, #020617 100%)'
  ],
  anniversary: [
    'linear-gradient(135deg, #451a03 0%, #000000 100%)',
    'radial-gradient(circle at center, #422006 0%, #000000 100%)',
    'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)',
    'conic-gradient(from 0deg, #1a1a1a, #261a0d, #1a1a1a)'
  ],
  graduation: [
    'linear-gradient(135deg, #064e3b 0%, #020617 100%)',
    'radial-gradient(circle at 10% 10%, #0f172a 0%, #000000 100%)',
    'linear-gradient(45deg, #0c4a6e 0%, #082f49 100%)',
    'linear-gradient(to bottom, #1e293b, #0f172a)'
  ],
  carnaval: [
    'linear-gradient(135deg, #701a75 0%, #4a044e 100%)',
    'radial-gradient(circle at bottom left, #1e1b4b 0%, #701a75 100%)',
    'linear-gradient(45deg, #4c1d95 0%, #be185d 100%)',
    'radial-gradient(circle at center, #831843 0%, #000000 100%)'
  ],
  festival: [
    'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
    'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #000000 100%)',
    'linear-gradient(45deg, #1e1b4b 0%, #312e81 100%)',
    'linear-gradient(to right, #020617, #1e293b)'
  ],
  newyear: [
    'linear-gradient(135deg, #1a1a1a 0%, #422006 100%)',
    'radial-gradient(circle at center, #171717 0%, #0a0a0a 100%)',
    'linear-gradient(45deg, #000000 0%, #1e1b4b 100%)',
    'radial-gradient(ellipse at top, #262626 0%, #000000 100%)'
  ],
  generic: [
    'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
    'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)',
    'linear-gradient(45deg, #000000 0%, #1a1a1a 100%)',
    'linear-gradient(to bottom, #111111, #000000)'
  ]
};

interface ThemeOnboardingProps {
  eventId: string;
  initialName: string;
  onComplete: () => void;
}

const THEMES = [
  { id: 'quince', name: 'Cumpleaños de 15', icon: Sparkles, color: 'from-pink-500 to-purple-600' },
  { id: 'wedding', name: 'Casamientos / Bodas', icon: Heart, color: 'from-stone-400 to-stone-600' },
  { id: 'graduation', name: 'Egresados / Graduación', icon: GraduationCap, color: 'from-emerald-500 to-teal-700' },
  { id: 'anniversary', name: 'Aniversarios', icon: Calendar, color: 'from-amber-600 to-orange-800' },
  { id: 'carnaval', name: 'Carnaval / Fiesta', icon: Music, color: 'from-fuchsia-500 to-rose-600' },
  { id: 'festival', name: 'Festivales', icon: PartyPopper, color: 'from-indigo-600 to-blue-800' },
  { id: 'newyear', name: 'Fin de Año / Cenas', icon: Moon, color: 'from-slate-700 to-black' },
];

export const ThemeOnboarding = ({ eventId, initialName, onComplete }: ThemeOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [variant, setVariant] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    try {
      setSaving(true);
      
      // 1. Actualizar el nombre del evento
      await supabase.from('events').update({ name }).eq('id', eventId);
      
      // 2. Intentar actualizar los ajustes (UPDATE)
      const { data: updateData, error: updateError } = await supabase
        .from('event_settings')
        .update({
          theme_id: selectedTheme,
          background_variant: variant,
          onboarding_completed: true
        })
        .eq('event_id', eventId)
        .select();

      // 3. Si no existe la fila (updateData vacío), la insertamos (INSERT)
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('event_settings')
          .insert({
            event_id: eventId,
            theme_id: selectedTheme,
            background_variant: variant,
            onboarding_completed: true
          });
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      alert('✨ ¡Configuración guardada con éxito! Redirigiendo...');
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error al configurar:', error);
      alert('Error al guardar la configuración: ' + error.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="text-5xl font-black mb-6 text-gradient">¡Bienvenido a SnapShow!</h2>
            <p className="text-xl text-white/60 mb-12">Vamos a darle un toque personal a tu evento.</p>
            <div className="glass-card p-8 max-w-md mx-auto">
              <label className="block text-left text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Nombre del Evento</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl focus:border-indigo-500 transition-all outline-none"
                placeholder="Ej: Boda de Ana y Luis"
              />
              <button 
                onClick={() => setStep(2)}
                className="w-full mt-8 bg-indigo-500 py-4 rounded-xl font-bold text-lg hover:bg-indigo-400 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <h2 className="text-4xl font-black text-center mb-12">Elige la Temática</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => { setSelectedTheme(theme.id); setStep(3); }}
                  className={`glass-card p-6 flex flex-col items-center gap-4 transition-all hover:scale-105 ${selectedTheme === theme.id ? 'border-white' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                >
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.color} shadow-lg`}>
                    <theme.icon size={32} />
                  </div>
                  <span className="font-bold text-center text-sm">{theme.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <h2 className="text-4xl font-black mb-4">Color y Textura</h2>
            <p className="text-white/40 mb-12">Selecciona una de las 4 variantes elegantes para tu fondo.</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`aspect-square rounded-3xl overflow-hidden border-4 transition-all ${variant === v ? 'border-indigo-500 scale-105' : 'border-transparent'}`}
                >
                  <div 
                    style={{ background: THEME_CONFIG[selectedTheme]?.[v] || THEME_CONFIG.generic[v] }}
                    className="w-full h-full p-4 flex items-end justify-end"
                  >
                    {variant === v && <div className="bg-indigo-500 rounded-full p-1"><Check size={20}/></div>}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-6">
               <button onClick={() => setStep(2)} className="px-8 py-4 text-white/40 font-bold">Volver</button>
               <button 
                  onClick={handleFinish}
                  disabled={saving}
                  className="bg-green-500 text-black px-12 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-all flex items-center gap-3"
               >
                 {saving ? 'Configurando...' : '¡Listo, Empezar!'}
               </button>
            </div>
            <p className="mt-8 text-[10px] text-white/10 uppercase tracking-[0.2em]">SnapShow Engine v3.0.5</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
