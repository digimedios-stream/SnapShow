import { motion } from 'framer-motion';

interface BackgroundAnimationsProps {
  theme: 'lights' | 'bokeh' | 'particles' | 'none';
}

export const BackgroundAnimations = ({ theme }: BackgroundAnimationsProps) => {
  if (theme === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {theme === 'lights' && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: ['-10%', '10%', '-10%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
              x: ['10%', '-10%', '10%'],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px]"
          />
        </>
      )}

      {theme === 'bokeh' && (
        <div className="relative w-full h-full">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0 
              }}
              animate={{
                y: ['0%', '-10%'],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              className="absolute w-32 h-32 bg-white/10 rounded-full blur-xl"
            />
          ))}
        </div>
      )}
    </div>
  );
};
