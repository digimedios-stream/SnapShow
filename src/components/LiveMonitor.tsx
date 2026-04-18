import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Play, X } from 'lucide-react';

interface LiveMonitorProps {
  eventId: string;
  onClose: () => void;
}

export const LiveMonitor = ({ eventId, onClose }: LiveMonitorProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from('events')
        .select('event_settings(max_displays), content_items(*)')
        .eq('id', eventId)
        .single();

      if (eventData) {
        const settings = Array.isArray(eventData.event_settings) ? eventData.event_settings[0] : eventData.event_settings;
        const maxDisplays = settings?.max_displays || 3;
        
        const validItems = (eventData.content_items || [])
          .filter((item: any) => 
            item.is_approved === true && 
            (item.display_count || 0) < maxDisplays
          )
          .sort((a: any, b: any) => {
             return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });
        
        setItems(validItems);
      }
    };

    fetchData();
    const channel = supabase.channel(`sync_${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items', filter: `event_id=eq.${eventId}` }, () => fetchData())
      .on('broadcast', { event: 'sync' }, (payload) => {
        setActiveId(payload.payload.itemId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  useEffect(() => {
    if (items.length > 0) {
      const foundIndex = items.findIndex(it => it.id === activeId);
      if (foundIndex !== -1) {
        setCurrentIndex(foundIndex);
      } else {
        if (currentIndex >= items.length) setCurrentIndex(0);
        setActiveId(items[currentIndex]?.id || items[0]?.id || null);
      }
    }
  }, [items, activeId]);

  const currentItem = items[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed left-6 top-[55%] -translate-y-1/2 w-[272px] aspect-video glass border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col z-40"
    >
      <div className="absolute top-2 left-2 z-20 bg-red-600 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
        <div className="w-1 h-1 bg-white rounded-full" />
        LIVE
      </div>

      <div className="flex-1 bg-black/40 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-bold text-white/20 tracking-widest uppercase"
            >
              Esperando contenido...
            </motion.div>
          ) : (
            <motion.div
              key={currentItem?.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentItem?.type === 'message' && (
                <div className="px-6 text-center">
                  <p className="text-sm font-black leading-tight line-clamp-3">{currentItem.text_content}</p>
                </div>
              )}
              {currentItem?.type === 'image' && (
                <img src={currentItem.content_url} className="w-full h-full object-cover opacity-60" />
              )}
              {currentItem?.type === 'video' && (
                <div className="relative w-full h-full">
                  <video 
                    src={currentItem.content_url} 
                    className="w-full h-full object-cover opacity-60"
                    autoPlay muted loop // En el monitor lo ponemos en loop y muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={24} className="text-white/40" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-8 bg-black/60 px-4 flex items-center justify-between border-t border-white/5">
        <span className="text-[10px] font-black tracking-tighter text-white/40 uppercase">
          {items.length} Elementos en Cola
        </span>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${i === currentIndex ? 'bg-indigo-500' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
