import { motion } from 'framer-motion';

export type ThemeCategory = 'quince' | 'wedding' | 'anniversary' | 'graduation' | 'carnaval' | 'festival' | 'newyear' | 'generic';

interface BackgroundAnimationsProps {
  category?: ThemeCategory;
  variant?: number; // 0 to 3
}

const THEME_CONFIG: Record<ThemeCategory, string[]> = {
  quince: [
    'linear-gradient(135deg, #2d1b4e 0%, #1a1a1a 100%)', // Midnight Purple
    'radial-gradient(circle at center, #4c1d95 0%, #000000 100%)', // Violet Deep
    'linear-gradient(45deg, #1e1b4b 0%, #312e81 100%)', // Indigo Night
    'conic-gradient(from 180deg at 50% 50%, #1a1033 0%, #3b0764 100%)' // Royal Amethyst
  ],
  wedding: [
    'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)', // Classic Dark
    'radial-gradient(circle at 50% 50%, #1c1917 0%, #0c0a09 100%)', // Stone Elegance
    'linear-gradient(to right, #0f172a, #1e293b)', // Navy Silk
    'radial-gradient(ellipse at bottom, #1e1b4b 0%, #020617 100%)' // Deep Occan
  ],
  anniversary: [
    'linear-gradient(135deg, #451a03 0%, #000000 100%)', // Bronze/Gold
    'radial-gradient(circle at center, #422006 0%, #000000 100%)', // Amber Shadow
    'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)', // Charcoal
    'conic-gradient(from 0deg, #1a1a1a, #261a0d, #1a1a1a)' // Wine/Leather
  ],
  graduation: [
    'linear-gradient(135deg, #064e3b 0%, #020617 100%)', // Emerald Night
    'radial-gradient(circle at 10% 10%, #0f172a 0%, #000000 100%)', // Tech Blue
    'linear-gradient(45deg, #0c4a6e 0%, #082f49 100%)', // Sky Deep
    'linear-gradient(to bottom, #1e293b, #0f172a)' // Academic Slate
  ],
  carnaval: [
    'linear-gradient(135deg, #701a75 0%, #4a044e 100%)', // Fuchsia Rush
    'radial-gradient(circle at bottom left, #1e1b4b 0%, #701a75 100%)', // Neon Mix
    'linear-gradient(45deg, #4c1d95 0%, #be185d 100%)', // Energy Pulse
    'radial-gradient(circle at center, #831843 0%, #000000 100%)' // Ruby Night
  ],
  festival: [
    'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)', // Festival Blue
    'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #000000 100%)', // Stage Black
    'linear-gradient(45deg, #1e1b4b 0%, #312e81 100%)', // Crowd Indigo
    'linear-gradient(to right, #020617, #1e293b)' // Modern Event
  ],
  newyear: [
    'linear-gradient(135deg, #1a1a1a 0%, #422006 100%)', // Golden Spark
    'radial-gradient(circle at center, #171717 0%, #0a0a0a 100%)', // Tuxedo
    'linear-gradient(45deg, #000000 0%, #1e1b4b 100%)', // Champagne Night
    'radial-gradient(ellipse at top, #262626 0%, #000000 100%)' // Luxury Grey
  ],
  generic: [
    'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
    'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)',
    'linear-gradient(45deg, #000000 0%, #1a1a1a 100%)',
    'linear-gradient(to bottom, #111111, #000000)'
  ]
};

export const BackgroundAnimations = ({ category = 'generic', variant = 0 }: BackgroundAnimationsProps) => {
  const bg = THEME_CONFIG[category]?.[variant] || THEME_CONFIG.generic[0];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" style={{ background: bg }}>
      {/* Capa de textura sutil (Grano/Ruido) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      {/* Sombras de movimiento lento (Sin usar Blur pesado) */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-white/5 radial-gradient(circle at 50% 50%, white, transparent)"
      />
      
      {/* Efecto de partículas reactivas (Solo si hay actividad, implementado vía broadcast luego) */}
      <div id="emoji-container" className="absolute inset-0" />
    </div>
  );
};
