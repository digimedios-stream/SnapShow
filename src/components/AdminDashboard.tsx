import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Plus, Image as ImageIcon, Video, MessageSquare, Settings, ExternalLink, Trash2, Sparkles, Link as LinkIcon, Share2, Check, Download, Loader2, Printer, RefreshCw, Monitor, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsPanel } from './SettingsPanel';
import { ThemeOnboarding } from './ThemeOnboarding';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const AdminDashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [onboardingFinished, setOnboardingFinished] = useState<boolean | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    
    fetchContent(selectedEventId);

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`admin_changes_${selectedEventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'content_items',
        filter: `event_id=eq.${selectedEventId}` 
      }, () => {
        fetchContent(selectedEventId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEventId]);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is SuperAdmin (Tú)
    const { data: profile } = await supabase
      .from('portal_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.is_superadmin || !profile) {
      setIsAdmin(true);
      const { data } = await supabase.from('events').select('*');
      if (data) {
        setEvents(data);
        const targetId = selectedEventId || data[0]?.id;
        if (targetId) {
          const { data: settings } = await supabase.from('event_settings').select('onboarding_completed').eq('event_id', targetId).maybeSingle();
          setOnboardingFinished(settings?.onboarding_completed === true);
        }
      }
    } else if (profile?.managed_event_id) {
      setIsAdmin(false);
      setSelectedEventId(profile.managed_event_id);
      const { data } = await supabase.from('events').select('*').eq('id', profile.managed_event_id).single();
      if (data) {
        setEvents([data]);
        const { data: settings } = await supabase.from('event_settings').select('onboarding_completed').eq('event_id', profile.managed_event_id).maybeSingle();
        setOnboardingFinished(settings?.onboarding_completed === true);
      }
    }
  };

  const fetchEventsForAdmin = async () => {
    const { data } = await supabase.from('events').select('*');
    if (data) setEvents(data);
    if (data && data.length > 0 && !selectedEventId) {
      setSelectedEventId(data[0].id);
    }
  };

  const fetchSingleEvent = async (id: string) => {
    const { data } = await supabase.from('events').select('*, event_settings(*)').eq('id', id).single();
    if (data) {
      setEvents([data]);
    }
  };

  const handleResetCycle = async () => {
    if (!confirm('¿Quieres reiniciar el contador de vistas? Todas las fotos volverán a aparecer en el carrusel.')) return;
    await supabase.from('content_items').update({ display_count: 0 }).eq('event_id', selectedEventId);
    if (selectedEventId) fetchContent(selectedEventId);
    alert('✅ Ciclo reiniciado.');
  };

  const fetchContent = async (id: string) => {
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .eq('event_id', id)
      .order('is_approved', { ascending: true })
      .order('display_count', { ascending: true })
      .order('sort_order', { ascending: false });
    if (data) setContentItems(data);
  };

  // ... (funciones handleApprove, openPopOut, copyGuestLink, handleUpload, handleAddMessage siguen igual)
  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará permanentemente el evento "${name.toUpperCase()}", todas sus fotos, videos y configuraciones.\n\nEsta acción no se puede deshacer.`)) return;
    
    try {
      // 1. Borrar configuraciones
      await supabase.from('event_settings').delete().eq('event_id', id);
      // 2. Borrar contenido
      await supabase.from('content_items').delete().eq('event_id', id);
      // 3. Borrar el evento
      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) throw error;
      
      alert('✅ Evento eliminado completamente.');
      if (selectedEventId === id) setSelectedEventId(null);
      fetchInitialData();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleApprove = async (id: string) => {
    await supabase.from('content_items').update({ is_approved: true }).eq('id', id);
    if (previewItem?.id === id) setPreviewItem(null);
  };

  const openPopOut = () => {
    if (selectedEventId) {
      window.open(`/screen?id=${selectedEventId}`, 'ProjectionScreen', 'width=1280,height=720');
    }
  };

  const copyGuestLink = () => {
    if (selectedEventId) {
      const url = `${window.location.origin}/guest?id=${selectedEventId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateEvent = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: newEvent, error: eventError } = await supabase.from('events').insert({
      name,
      client_id: user.id
    }).select().single();

    if (eventError) {
      alert('Error: ' + eventError.message);
      return;
    }

    // Auto-create settings
    await supabase.from('event_settings').insert({
      event_id: newEvent.id,
      onboarding_completed: false
    });

    fetchInitialData();
  };

  const handleUpload = async (file: File) => {
    if (!selectedEventId) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${selectedEventId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-content')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('event-content')
        .getPublicUrl(filePath);

      await supabase.from('content_items').insert({
        event_id: selectedEventId,
        type: file.type.startsWith('video') ? 'video' : 'image',
        content_url: publicUrl,
        is_approved: false // IMPORTANTE: El administrador también debe aprobarlo después
      });
      fetchContent(selectedEventId);
    }
    setUploading(false);
  };

  const handleAddMessage = async (text: string) => {
    if (!selectedEventId) return;
    await supabase.from('content_items').insert({
      event_id: selectedEventId,
      type: 'message',
      text_content: text,
      is_approved: false // IMPORTANTE: El administrador también debe aprobarlo después
    });
    fetchContent(selectedEventId);
  };

  const handleDownloadAll = async () => {
    const approvedMedia = contentItems.filter(item => item.is_approved && item.type !== 'message');
    if (approvedMedia.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();
    const eventName = events.find(e => e.id === selectedEventId)?.name || 'evento';
    try {
      const promises = approvedMedia.map(async (item, index) => {
        const response = await fetch(item.content_url);
        const blob = await response.blob();
        zip.file(`${index + 1}-${item.type}.${item.type === 'video' ? 'mp4' : 'jpg'}`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `SnapShow-${eventName}.zip`);
    } finally {
       setIsDownloading(false);
    }
  };

  const currentEvent = events.find(e => e.id === selectedEventId);
  
  // Lógica de detección ultra-robusta
  const getOnboardingStatus = () => {
    if (!currentEvent?.event_settings) return false;
    const settings = currentEvent.event_settings;
    if (Array.isArray(settings)) {
      return settings.length > 0 && settings[0].onboarding_completed === true;
    }
    return settings.onboarding_completed === true;
  };

  const onboardingDone = getOnboardingStatus();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Onboarding Assistant */}
      {currentEvent && onboardingFinished === false && (
        <ThemeOnboarding 
          eventId={currentEvent.id} 
          initialName={currentEvent.name} 
          onComplete={() => {
            setOnboardingFinished(true);
            window.location.reload();
          }} 
        />
      )}

      {/* Printable Flyer Modal */}
      {showPrintModal && selectedEventId && (
        <div className="fixed inset-0 z-[70] bg-white text-black p-12 flex flex-col items-center justify-center text-center">
          <div className="border-[12px] border-black p-12 max-w-lg w-full">
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">SnapShow En Vivo</h1>
            <p className="text-xl font-bold mb-8 opacity-60">{currentEvent?.name}</p>
            <div className="bg-black text-white py-4 px-8 rounded-full mb-12 font-black inline-block">¡SUBE TUS FOTOS Y VIDEOS!</div>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/guest?id=${selectedEventId}`)}`}
              className="w-64 h-64 mx-auto mb-12 border-8 border-black p-2"
              alt="QR"
            />
            <div className="space-y-4">
               <p className="text-lg font-bold">1. Escanéa el código</p>
               <p className="text-lg font-bold">2. Elige tu mejor foto o video</p>
               <p className="text-lg font-bold">3. ¡Míralo en pantalla al instante!</p>
            </div>
            <footer className="mt-16 border-t pt-8 border-black/10">
               <p className="text-sm font-black uppercase tracking-widest">Digimedios Apps © 2026</p>
            </footer>
          </div>
          <div className="mt-8 flex gap-4 no-print">
            <button onClick={() => window.print()} className="bg-black text-white px-8 py-3 rounded-xl font-bold">🖨️ Imprimir Ahora</button>
            <button onClick={() => setShowPrintModal(false)} className="text-black/40 px-8 py-3 font-bold">Cerrar</button>
          </div>
          <style>{`@media print { .no-print { display: none; } body { padding: 0; } }`}</style>
        </div>
      )}

      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Sparkles size={20} /></div>
          <h2 className="text-xl font-bold text-gradient-primary tracking-tight">SnapShow</h2>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          {events.map((event) => (
             <div key={event.id} className="group flex items-center gap-1">
               <button
                  onClick={() => setSelectedEventId(event.id)}
                  className={`flex-1 text-left px-4 py-3 rounded-xl transition-all ${selectedEventId === event.id ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}
               >
                 <span className="truncate block w-32">{event.name}</span>
               </button>
               {isAdmin && (
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event.id, event.name);
                  }}
                  className="p-2 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Eliminar Evento"
                 >
                   <Trash2 size={16} />
                 </button>
               )}
             </div>
          ))}
          {isAdmin && (
            <button 
              onClick={() => {
                const name = prompt('Nombre del nuevo evento:');
                if (name) handleCreateEvent(name);
              }}
              className="w-full mt-4 border border-dashed border-white/10 p-4 rounded-xl text-white/20 hover:text-indigo-400 hover:border-indigo-400/40 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Evento</span>
            </button>
          )}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="mt-6 flex items-center gap-2 px-4 py-2 text-white/40 hover:text-red-400 border-t border-white/5 pt-6"><LogOut size={18} /> Salir</button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {!selectedEventId ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="p-8 bg-indigo-500/5 rounded-full mb-8 animate-pulse">
              <Sparkles className="text-indigo-500" size={64} />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">Bienvenido a SnapShow</h2>
            <p className="text-lg text-white/40 mb-10 leading-relaxed">Te ayudamos a convertir tu evento en una experiencia interactiva única. Selecciona un evento para empezar o crea uno nuevo en el menú lateral.</p>
            {isAdmin && (
               <button 
                onClick={() => {
                  const name = prompt('Nombre del nuevo evento:');
                  if (name) handleCreateEvent(name);
                }}
                className="bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:bg-indigo-400 transition-all"
               >
                 Crear Mi Primer Evento
               </button>
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{currentEvent?.name}</h1>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1">Versión 3.0 • Dash Control</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={openPopOut} className="flex items-center gap-2 glass px-4 py-2 text-purple-400 hover:bg-white/5 transition-all text-sm font-bold"><Monitor size={16} /> Pantalla</button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/screen?id=${selectedEventId}`;
                    navigator.clipboard.writeText(url);
                    alert('Link copiado para vMix / OBS');
                  }} 
                  className="flex items-center gap-2 glass px-4 py-2 text-blue-400 hover:bg-white/5 transition-all text-sm font-bold"
                >
                  <LinkIcon size={16} /> link OBS
                </button>
                <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 glass px-4 py-2 text-amber-500 hover:bg-white/5 text-sm font-bold"><Printer size={16} /> Flyer QR</button>
                <button onClick={handleResetCycle} className="flex items-center gap-2 glass px-4 py-2 text-white/60 hover:bg-white/5 text-sm font-bold"><RefreshCw size={16} /> Reiniciar</button>
                <button onClick={handleDownloadAll} className="flex items-center gap-2 glass px-4 py-2 text-green-400 hover:bg-green-500/10 transition-all text-sm font-bold">
                   {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={16} />} ZIP
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 glass px-3 py-2 text-white/40 hover:text-white transition-all"><Settings size={18} /></button>
              </div>
            </header>

            {/* Acciones Rápidas */}
            <div className="flex flex-wrap gap-4 mb-12">
                <label className="px-8 py-4 bg-amber-500 text-black rounded-2xl font-black flex items-center gap-3 hover:bg-amber-400 transition-all text-sm cursor-pointer shadow-lg shadow-amber-500/10">
                  <ImageIcon size={20} /> SUBIR FOTO
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
                </label>

                <label className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-400 transition-all text-sm cursor-pointer shadow-lg shadow-indigo-500/10">
                  <Video size={20} /> SUBIR VÍDEO
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
                </label>

                <button 
                  onClick={() => { const msg = prompt('Escribe el mensaje para la pantalla:'); if (msg) handleAddMessage(msg); }}
                  className="px-8 py-4 bg-green-500 text-black rounded-2xl font-black flex items-center gap-3 hover:bg-green-400 transition-all text-sm shadow-lg shadow-green-500/10"
                >
                  <MessageSquare size={20} /> NUEVO MENSAJE
                </button>
              </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-6">Contenido del Evento ({contentItems.length})</h3>
              {contentItems.map((item) => (
                <div key={item.id} className="glass group p-4 flex items-center gap-4 hover:border-white/20 transition-all border border-white/5 rounded-3xl">
                  <div 
                    onClick={() => setPreviewItem(item)}
                    className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 cursor-zoom-in hover:scale-105 transition-all relative group/thumb"
                  >
                    {item.type === 'image' && <img src={item.content_url} className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100" />}
                    {item.type === 'video' && (
                      <video src={item.content_url} className="w-full h-full object-cover opacity-80" />
                    )}
                    {item.type === 'message' && <MessageSquare className="text-green-500" size={24} />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                       <Play size={20} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-lg">
                      {item.type === 'message' ? item.text_content : 'Archivo Multimedia'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">Vistas: <span className={item.display_count >= 3 ? 'text-indigo-400' : 'text-green-500'}>{item.display_count || 0}</span> / 3</span>
                        {item.display_count > 0 && (
                          <button onClick={() => supabase.from('content_items').update({ display_count: 0 }).eq('id', item.id).then(() => fetchContent(selectedEventId!))} className="p-1 hover:text-white transition-colors"><RefreshCw size={10} /></button>
                        )}
                      </div>
                      <span className={
                        !item.is_approved ? 'text-amber-500' :
                        item.display_count >= 3 ? 'text-white/20' : 'text-green-500'
                      }>
                        ● {!item.is_approved ? 'Por aprobar' : item.display_count >= 3 ? 'Finalizado' : 'Activo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!item.is_approved && (
                      <button onClick={() => handleApprove(item.id)} className="px-5 py-3 bg-green-500 text-black rounded-xl font-black text-[10px] hover:bg-green-400 transition-all flex items-center gap-2"><Check size={14} /> LANZAR</button>
                    )}
                    <button onClick={() => { if(confirm('¿Borrar este archivo?')) { supabase.from('content_items').delete().eq('id', item.id).then(() => fetchContent(selectedEventId!)); } }} className="p-3 bg-white/5 text-white/20 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {isSettingsOpen && selectedEventId && <SettingsPanel eventId={selectedEventId} onClose={() => setIsSettingsOpen(false)} />}

      {/* MODAL DE VISTA PREVIA GIGANTE */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-full bg-white/5 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            >
               <button 
                 onClick={() => setPreviewItem(null)}
                 className="absolute top-6 right-6 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-red-500 transition-all"
               >
                 <X size={24} />
               </button>

               <div className="flex-1 flex items-center justify-center bg-black/20 p-4">
                  {previewItem.type === 'image' && (
                    <img src={previewItem.content_url} className="max-w-full max-h-[70vh] object-contain rounded-2xl" />
                  )}
                  {previewItem.type === 'video' && (
                    <video 
                      src={previewItem.content_url} 
                      className="max-w-full max-h-[70vh] object-contain rounded-2xl" 
                      controls 
                      autoPlay 
                    />
                  )}
                  {previewItem.type === 'message' && (
                    <div className="p-12 text-center">
                       <h2 className="text-4xl font-black">{previewItem.text_content}</h2>
                    </div>
                  )}
               </div>

               <div className="p-8 border-t border-white/10 bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 uppercase text-xs font-black tracking-widest mb-1">Estado del contenido</p>
                    <p className="font-bold text-xl">{previewItem.is_approved ? '✅ En Pantalla' : '⏳ Esperando aprobación'}</p>
                  </div>
                  <div className="flex gap-4">
                    {!previewItem.is_approved && (
                      <button 
                        onClick={() => { handleApprove(previewItem.id); setPreviewItem(null); }}
                        className="px-8 py-4 bg-green-500 text-black rounded-2xl font-black hover:bg-green-400 transition-all flex items-center gap-2"
                      >
                        <Check /> APROBAR AHORA
                      </button>
                    )}
                    <button 
                      onClick={() => { if(confirm('¿Borrar este contenido?')) { supabase.from('content_items').delete().eq('id', previewItem.id).then(() => { fetchContent(selectedEventId!); setPreviewItem(null); }); } }}
                      className="px-8 py-4 bg-white/10 text-red-400 rounded-2xl font-black hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                      <Trash2 /> BORRAR
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
