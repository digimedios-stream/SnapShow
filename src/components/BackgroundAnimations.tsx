import { motion } from 'framer-motion';

interface BackgroundAnimationsProps {
  theme: 'lights' | 'bokeh' | 'particles' | 'aurora' | 'none';
}

export const BackgroundAnimations = ({ theme }: BackgroundAnimationsProps) => {
  if (theme === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {(theme === 'lights' || theme === 'aurora') && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              x: ['-20%', '20%', '-20%'],
              y: ['-10%', '10%', '-10%'],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-indigo-600/30 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.4, 1, 1.4],
              x: ['20%', '-20%', '20%'],
              y: ['10%', '-10%', '10%'],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-[20%] -right-[20%] w-[80%] h-[80%] bg-purple-600/30 rounded-full blur-[120px]"
          />
          {theme === 'aurora' && (
            <motion.div
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px]"
            />
          )}
        </>
      )}

      {(theme === 'bokeh' || theme === 'particles') && (
        <div className="relative w-full h-full">
          {[...Array(theme === 'particles' ? 30 : 15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0,
                scale: theme === 'particles' ? Math.random() * 0.5 : 1
              }}
              animate={{
                y: theme === 'particles' ? ['100%', '-10%'] : ['0%', '-20%'],
                x: theme === 'particles' ? [null, `${(Math.random() - 0.5) * 20}%`] : null,
                opacity: [0, theme === 'particles' ? 0.8 : 0.3, 0],
              }}
              transition={{
                duration: Math.random() * (theme === 'particles' ? 10 : 5) + 5,
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
              className={`absolute rounded-full blur-${theme === 'particles' ? 'sm' : 'xl'} ${
                theme === 'particles' ? 'w-1 h-1 bg-white shadow-[0_0_10px_white]' : 'w-32 h-32 bg-white/10'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
