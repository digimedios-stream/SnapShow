import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BackgroundAnimations } from './BackgroundAnimations';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectionScreenProps {
  eventId: string;
}

export const ProjectionScreen = ({ eventId }: ProjectionScreenProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 1. Initial Data Fetch
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
        // Only show approved items
        const approvedItems = (eventData.content_items || [])
          .filter((item: any) => item.is_approved === true)
          .sort((a: any, b: any) => {
            // Priority 1: Videos first
            if (a.type === 'video' && b.type !== 'video') return -1;
            if (a.type !== 'video' && b.type === 'video') return 1;
            // Priority 2: Sort order (newest first based on Date.now())
            return b.sort_order - a.sort_order;
          });
        setItems(approvedItems);
      }
    };

    fetchData();

    // 2. Realtime Subscriptions
    const itemsChannel = supabase
      .channel('content_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'content_items', 
        filter: `event_id=eq.${eventId}` 
      }, () => fetchData())
      .subscribe();

    const settingsChannel = supabase
      .channel('settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_settings', 
        filter: `event_id=eq.${eventId}` 
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [eventId]);

  useEffect(() => {
    // If it's a video, we don't use the interval timer, we wait for onEnded
    if (items.length <= 1 || items[currentIndex]?.type === 'video') return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, (settings?.slide_duration || 5) * 1000);

    return () => clearInterval(interval);
  }, [items, currentIndex, settings]);

  const handleVideoEnd = () => {
    if (items.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  };

  if (!settings) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Cargando...</div>;

  const currentItem = items[currentIndex] || { type: 'message', text_content: 'Esperando contenido aprobado...' };

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative font-sans">
      <BackgroundAnimations theme={settings.background_animation || 'lights'} />
      
      {/* HUD: Logo & QR */}
      <div className="absolute top-8 left-8 z-20">
        {settings.show_logo && settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
        )}
      </div>

      <div className="absolute bottom-12 right-12 z-20">
        {settings.show_qr && (
          <div className="glass p-3 rounded-2xl flex flex-col items-center gap-2 border border-white/20">
             <img 
               src={settings.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/guest?id=${eventId}`)}`} 
               alt="QR" 
               className="w-28 h-28 object-contain rounded-lg bg-white p-1" 
             />
             <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">¡Sube tus fotos!</p>
          </div>
        )}
      </div>

      {/* Main Content Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id || 'initial'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center p-20 z-10"
        >
          {currentItem.type === 'message' && (
            <div className="text-center max-w-4xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-bold leading-tight drop-shadow-2xl"
              >
                {currentItem.text_content}
              </motion.h1>
            </div>
          )}

          {currentItem.type === 'image' && (
            <img 
              src={currentItem.content_url} 
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl" 
              alt="Evento" 
            />
          )}

          {currentItem.type === 'video' && (
            <video 
              src={currentItem.content_url} 
              autoPlay 
              muted 
              onEnded={handleVideoEnd}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Event Title Footer */}
      <div className="absolute bottom-8 left-0 w-full text-center z-20 pointer-events-none">
        <p className="text-xl font-medium opacity-60 uppercase tracking-widest drop-shadow-md">
          {eventName}
        </p>
      </div>
    </div>
  );
};
