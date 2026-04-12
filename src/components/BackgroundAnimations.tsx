import { motion } from 'framer-motion';

interface BackgroundAnimationsProps {
  theme: 'lights' | 'bokeh' | 'particles' | 'aurora' | 'none';
}

export const BackgroundAnimations = ({ theme }: BackgroundAnimationsProps) => {
  if (theme === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#020617]">
      {/* Base Aurora - Un gradiente base que ocupa todo el fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)]" />

      {(theme === 'lights' || theme === 'aurora') && (
        <>
          <motion.div
            animate={{
              x: ['-20%', '20%', '-20%'],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 left-0 w-full h-[80%] rounded-[100%] bg-[radial-gradient(circle,#4338ca_0%,transparent_70%)] opacity-30 blur-[60px]"
          />
          <motion.div
            animate={{
              x: ['20%', '-20%', '20%'],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-0 right-0 w-full h-[80%] rounded-[100%] bg-[radial-gradient(circle,#6366f1_0%,transparent_70%)] opacity-30 blur-[60px]"
          />
        </>
      )}

      {theme === 'aurora' && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,#06b6d4_0%,transparent_60%)] opacity-10 blur-[40px]"
        />
      )}

      {(theme === 'bokeh' || theme === 'particles') && (
        <div className="absolute inset-0 w-full h-full">
          {[...Array(theme === 'particles' ? 35 : 15)].map((_, i) => {
            const size = theme === 'particles' ? Math.random() * 4 + 2 : Math.random() * 100 + 50;
            const left = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = Math.random() * 10 + 10;
            
            return (
              <motion.div
                key={i}
                initial={{ 
                  y: '110vh',
                  x: `${left}vw`,
                  opacity: 0,
                }}
                animate={{
                  y: '-20vh',
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: delay,
                  ease: "linear"
                }}
                style={{
                  width: size,
                  height: size,
                }}
                className={`absolute rounded-full ${
                  theme === 'particles' 
                    ? 'bg-white shadow-[0_0_10px_white]' 
                    : 'bg-white/5 blur-xl'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
