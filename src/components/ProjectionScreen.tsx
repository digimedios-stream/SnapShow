import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BackgroundAnimations, ThemeCategory } from './BackgroundAnimations';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectionScreenProps {
  eventId: string;
}

export const ProjectionScreen = ({ eventId }: ProjectionScreenProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emojis, setEmojis] = useState<{ id: number; char: string; x: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          name,
          event_settings (*),
          content_items (*)
        `)
        .eq('id', eventId)
        .single();

      if (eventData) {
        setEventName(eventData.name);
        setSettings(eventData.event_settings);
        
        // SMART CYCLE: Filtrar por aprobación y por límite de visualizaciones
        const maxDisplays = eventData.event_settings?.max_displays || 999;
        
        const validItems = (eventData.content_items || [])
          .filter((item: any) => 
            item.is_approved === true && 
            (item.display_count || 0) < maxDisplays
          )
          .sort((a: any, b: any) => {
             // Prioridad a lo menos visto
             return (a.display_count || 0) - (b.display_count || 0);
          });
        
        setItems(validItems);
      }
    };

    fetchData();

    // suscripciones en tiempo real
    const itemsChannel = supabase.channel('content_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'content_items', filter: `event_id=eq.${eventId}` }, () => fetchData()).subscribe();
    const settingsChannel = supabase.channel('settings_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'event_settings', filter: `event_id=eq.${eventId}` }, () => fetchData()).subscribe();

    // LIVE EMOJIS: Escuchar transmisiones de reacciones
    const emojiChannel = supabase.channel(`reactions_${eventId}`)
      .on('broadcast', { event: 'emoji' }, (payload) => {
        const newEmoji = {
          id: Date.now(),
          char: payload.payload.char,
          x: Math.random() * 80 + 10 // Entre 10% y 90% del ancho
        };
        setEmojis(prev => [...prev.slice(-20), newEmoji]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(emojiChannel);
    };
  }, [eventId]);

  useEffect(() => {
    if (items.length <= 1 || items[currentIndex]?.type === 'video') return;
    
    const interval = setInterval(() => {
      handleNext();
    }, (settings?.slide_duration || 5) * 1000);

    return () => clearInterval(interval);
  }, [items, currentIndex, settings]);

  const handleNext = async () => {
    // Antes de pasar al siguiente, sumar 1 al contador de vistas del actual
    const currentItem = items[currentIndex];
    if (currentItem && currentItem.id) {
       await supabase.rpc('increment_display_count', { item_id: currentItem.id });
    }

    if (items.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  };

  const currentItem = items[currentIndex] || { type: 'message', text_content: 'SnapShow • Esperando contenido...' };

  return (
    <div className="h-screen w-screen text-white overflow-hidden relative">
      <BackgroundAnimations 
        category={(settings?.theme_id as ThemeCategory) || 'generic'} 
        variant={settings?.background_variant || 0} 
      />

      {/* Floating Emojis Layer */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {emojis.map(e => (
            <motion.span
              key={e.id}
              initial={{ y: '110vh', x: `${e.x}vw`, opacity: 0, scale: 0.5 }}
              animate={{ y: '-10vh', opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1.5, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeOut" }}
              className="absolute text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              {e.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* HUD: Logo & QR */}
      <div className="absolute top-8 left-8 z-20">
        {settings?.show_logo && settings?.logo_url && (
          <img src={settings.logo_url} alt="Logo" className="h-20 w-auto object-contain drop-shadow-2xl" />
        )}
      </div>

      <div className="absolute bottom-12 right-12 z-20">
        {settings?.show_qr && (
          <div className="glass p-4 rounded-3xl flex flex-col items-center gap-2 border border-white/20 shadow-2xl backdrop-blur-md">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/guest?id=${eventId}`)}`} 
               alt="QR" 
               className="w-32 h-32 object-contain rounded-xl bg-white p-1" 
             />
             <p className="text-[12px] uppercase font-bold tracking-[0.3em] text-white/60">¡PARTICIPA!</p>
          </div>
        )}
      </div>

      {/* Main Content Carousel */}
      <AnimatePresence mode="wait">
        {items.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-24 z-10 text-center"
          >
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
              <div className="glass p-8 rounded-[40px] border border-white/20 shadow-2xl relative">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/guest?id=${eventId}`)}`} 
                  alt="QR" 
                  className="w-64 h-64 object-contain rounded-2xl bg-white p-2" 
                />
              </div>
            </div>
            <h2 className="text-6xl font-black mb-4 tracking-tighter drop-shadow-2xl">
              ¡TU MOMENTO EN PANTALLA! 📸
            </h2>
            <p className="text-3xl font-bold text-white/40 uppercase tracking-[0.3em]">
              Escanea el código para participar
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${items[currentIndex]?.id}-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotateY: 10 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="absolute inset-0 flex items-center justify-center p-24 z-10"
          >
            {items[currentIndex]?.type === 'message' && (
              <div className="text-center max-w-5xl">
                <h1 className="text-6xl md:text-8xl font-black leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] tracking-tight">
                  {items[currentIndex].text_content}
                </h1>
              </div>
            )}

            {items[currentIndex]?.type === 'image' && (
              <div className="relative group">
                 <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-110 -z-10" />
                 <img 
                   src={items[currentIndex].content_url} 
                   className="max-h-[85vh] max-w-full object-contain rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-4 border-white/10" 
                   alt="Content" 
                 />
              </div>
            )}

            {items[currentIndex]?.type === 'video' && (
              <video 
                src={items[currentIndex].content_url} 
                autoPlay 
                muted 
                onEnded={handleNext}
                className="max-h-[85vh] max-w-full object-contain rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-4 border-white/10"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 left-0 w-full text-center z-20 pointer-events-none px-12">
        <p className="text-2xl font-bold uppercase tracking-[0.4em] text-white/40 drop-shadow-lg">
          {eventName}
        </p>
      </div>
    </div>
  );
};
