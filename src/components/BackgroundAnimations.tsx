import { motion } from 'framer-motion';

interface BackgroundAnimationsProps {
  theme: 'lights' | 'bokeh' | 'particles' | 'aurora' | 'none';
}

export const BackgroundAnimations = ({ theme }: BackgroundAnimationsProps) => {
  if (theme === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#020617]">
      {/* Base Aurora - Siempre presente para dar profundidad pero muy ligera */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,transparent_100%)]" />

      {(theme === 'lights' || theme === 'aurora') && (
        <>
          <motion.div
            animate={{
              x: ['-10%', '10%', '-10%'],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,#4338ca_0%,transparent_70%)] opacity-40"
          />
          <motion.div
            animate={{
              x: ['10%', '-10%', '10%'],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,#6366f1_0%,transparent_70%)] opacity-40"
          />
        </>
      )}

      {theme === 'aurora' && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-[radial-gradient(circle,#06b6d4_0%,transparent_70%)] opacity-20"
        />
      )}

      {(theme === 'bokeh' || theme === 'particles') && (
        <div className="relative w-full h-full">
          {[...Array(theme === 'particles' ? 25 : 12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0,
                scale: theme === 'particles' ? Math.random() * 0.4 + 0.1 : 1
              }}
              animate={{
                y: ['100%', '-10%'],
                opacity: [0, theme === 'particles' ? 0.7 : 0.4, 0],
              }}
              transition={{
                duration: Math.random() * 8 + 7,
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
              className={`absolute rounded-full ${
                theme === 'particles' 
                  ? 'w-1 h-1 bg-white shadow-[0_0_8px_white]' 
                  : 'w-24 h-24 bg-gradient-to-br from-white/10 to-transparent'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
