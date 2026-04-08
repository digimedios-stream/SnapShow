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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 1. Initial Data Fetch
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          *,
          event_settings (*),
          content_items (*)
        `)
        .eq('id', eventId)
        .single();

      if (eventData) {
        setSettings(eventData.event_settings);
        setItems(eventData.content_items.sort((a: any, b: any) => a.sort_order - b.sort_order));
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
    if (items.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, (settings?.slide_duration || 5) * 1000);

    return () => clearInterval(interval);
  }, [items, settings]);

  if (!settings) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Cargando...</div>;

  const currentItem = items[currentIndex] || { type: 'message', text_content: 'Iniciando...' };

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative font-sans">
      <BackgroundAnimations theme={settings.background_animation || 'lights'} />
      
      {/* HUD: Logo & QR */}
      <div className="absolute top-8 left-8 z-20">
        {settings.show_logo && settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
        )}
      </div>

      <div className="absolute bottom-8 right-8 z-20">
        {settings.show_qr && settings.qr_url && (
          <div className="glass p-2 rounded-xl">
             <img src={settings.qr_url} alt="QR" className="w-24 h-24 object-contain" />
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
              <h1 className="text-5xl md:text-7xl font-bold leading-tight drop-shadow-2xl">
                {currentItem.text_content}
              </h1>
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
              loop 
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Event Title Footer */}
      <div className="absolute bottom-8 left-0 w-full text-center z-20 pointer-events-none">
        <p className="text-xl font-medium opacity-60 uppercase tracking-widest drop-shadow-md">
          {eventId} {/* Replace with event name in real impl */}
        </p>
      </div>
    </div>
  );
};
