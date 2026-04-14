import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export type AnimationTheme = 'aurora' | 'lights' | 'gold' | 'bokeh' | 'stars' | 'mesh' | 'video' | 'none';

interface BackgroundAnimationsProps {
  theme?: AnimationTheme;
}

export const BackgroundAnimations = ({ theme = 'aurora' }: BackgroundAnimationsProps) => {
  const renderTheme = () => {
    switch (theme) {
      case 'aurora':
        return (
          <div className="absolute inset-0 bg-[#020617] overflow-hidden">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_#4f46e5_0%,_transparent_50%)] blur-[120px]"
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-[50%] -right-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_#9333ea_0%,_transparent_50%)] blur-[120px]"
            />
          </div>
        );

      case 'lights':
        return (
          <div className="absolute inset-0 bg-black">
             <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
             <motion.div 
               animate={{ x: ['-100%', '100%'] }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent skew-x-12"
             />
             <motion.div 
               animate={{ x: ['100%', '-100%'] }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute bottom-0 w-1/2 h-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent -skew-x-12"
             />
          </div>
        );

      case 'gold':
        return (
          <div className="absolute inset-0 bg-[#1a0f00]">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '110%', x: `${Math.random() * 100}%`, opacity: 0 }}
                animate={{ y: '-10%', opacity: [0, 1, 0] }}
                transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5 }}
                className="absolute w-1 h-1 bg-amber-400 rounded-full blur-[1px] shadow-[0_0_10px_#fbbf24]"
              />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] opacity-60" />
          </div>
        );

      case 'stars':
        return (
          <div className="absolute inset-0 bg-[#020617]">
             {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
                style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                className="absolute w-1 h-1 bg-white rounded-full"
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
          </div>
        );

      case 'mesh':
        return (
          <div className="absolute inset-0 bg-zinc-950 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-40">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/30 blur-[120px] animate-pulse" />
              <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
            </div>
          </div>
        );

      case 'bokeh':
        return (
          <div className="absolute inset-0 bg-slate-950">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                  x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                  scale: [1, 1.5, 1]
                }}
                transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-64 h-64 rounded-full bg-white/5 blur-[60px]"
              />
            ))}
          </div>
        );

      case 'video':
        return <VideoBackground index={1} />;

      default:
        if (theme.startsWith('video_')) {
          const index = parseInt(theme.split('_')[1]);
          return <VideoBackground index={index} />;
        }
        return <div className="absolute inset-0 bg-[#0a0a0a]" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {renderTheme()}
      {/* Grano sutil global */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </div>
  );
};

const VideoBackground = ({ index }: { index: number }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    // Obtenemos la URL pública desde el bucket 'backgrounds'
    const { data } = supabase.storage.from('backgrounds').getPublicUrl(`bg${index}.mp4`);
    console.log("Intentando cargar video de fondo:", data?.publicUrl);
    if (data?.publicUrl) {
      setVideoUrl(data.publicUrl);
    }
  }, [index]);

  if (!videoUrl) return <div className="absolute inset-0 bg-indigo-900/20" />;

  return (
    <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
      <AnimatePresence mode="wait">
        <motion.video
          key={videoUrl}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }} // Subimos a 1 para asegurar visibilidad en la prueba
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          onError={(e) => console.error("Error al cargar el video de fondo:", e)}
          className="min-w-full min-h-full w-auto h-auto object-cover absolute"
        />
      </AnimatePresence>
      
      {/* Overlay para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
    </div>
  );
};
